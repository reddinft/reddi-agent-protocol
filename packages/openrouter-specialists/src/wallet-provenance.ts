import { Keypair, PublicKey } from "@solana/web3.js";
import type { SpecialistProfile } from "./types.js";
import { specialistProfiles } from "./profiles/index.js";

export interface SignerBackedWalletManifestProfile {
  profileId: string;
  displayName: string;
  publicKey: string;
  signerProvenance: {
    sourceEnv: string;
    derivedFromSigner: true;
  };
}

export interface SignerBackedWalletManifest {
  schemaVersion: "1.0.0";
  network: "solana-devnet";
  minimumBalanceLamports: number;
  generatedAt: string;
  profiles: SignerBackedWalletManifestProfile[];
}

export interface LoadedSignerProfile {
  profile: SpecialistProfile;
  keypair: Keypair;
  sourceEnv: string;
}

export interface SignerEnvLoadResult {
  loaded: LoadedSignerProfile[];
  missingProfileIds: string[];
}

const BULK_SIGNER_ENV = "OPENROUTER_SPECIALIST_SIGNER_KEYPAIRS_JSON";
const SECRET_FIELD_PATTERN = /(secret|private|mnemonic|seed|keypair)/i;

export function profileEnvSlug(profileId: string): string {
  return profileId.toUpperCase().replace(/[^A-Z0-9]+/g, "_");
}

export function perProfileSignerEnvNames(profileId: string): string[] {
  const slug = profileEnvSlug(profileId);
  return [
    `OPENROUTER_SPECIALIST_${slug}_SIGNER_KEYPAIR_JSON`,
    `OPENROUTER_SPECIALIST_${slug}_SECRET_KEY_JSON`,
  ];
}

export function signerEnvNamesFor(profileId: string): string[] {
  return [BULK_SIGNER_ENV, ...perProfileSignerEnvNames(profileId)];
}

export function parseSignerKeypairMaterial(material: unknown): Keypair {
  let candidate = material;
  if (typeof candidate === "string") {
    candidate = JSON.parse(candidate);
  }
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    const record = candidate as Record<string, unknown>;
    candidate = record.secretKey ?? record.privateKey ?? record.keypair;
    if (typeof candidate === "string") candidate = JSON.parse(candidate);
  }
  if (!Array.isArray(candidate)) {
    throw new Error("signer keypair material must be a JSON array or object with secretKey/privateKey/keypair array");
  }
  const bytes = candidate.map((value) => {
    if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 255) throw new Error("signer keypair bytes must be integers 0..255");
    return Number(value);
  });
  if (bytes.length !== 64) throw new Error("signer keypair secret key must contain 64 bytes");
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

export function loadSignerKeypairsFromEnv(options?: {
  env?: NodeJS.ProcessEnv;
  profiles?: SpecialistProfile[];
  requireAll?: boolean;
}): SignerEnvLoadResult {
  const env = options?.env ?? process.env;
  const profiles = options?.profiles ?? specialistProfiles.slice(0, 5);
  const loaded: LoadedSignerProfile[] = [];
  const missingProfileIds: string[] = [];
  const bulk = loadBulkSignerEnv(env[BULK_SIGNER_ENV]);

  for (const profile of profiles) {
    const fromBulk = bulk.get(profile.id);
    if (fromBulk !== undefined) {
      loaded.push({ profile, keypair: parseSignerKeypairMaterial(fromBulk), sourceEnv: BULK_SIGNER_ENV });
      continue;
    }

    const perProfile = perProfileSignerEnvNames(profile.id).find((name) => env[name]?.trim());
    if (perProfile) {
      loaded.push({ profile, keypair: parseSignerKeypairMaterial(env[perProfile]), sourceEnv: perProfile });
    } else {
      missingProfileIds.push(profile.id);
    }
  }

  if (options?.requireAll && missingProfileIds.length > 0) {
    throw new Error(`missing signer env for profiles: ${missingProfileIds.join(", ")}`);
  }

  return { loaded, missingProfileIds };
}

export function buildSignerBackedWalletManifest(input: {
  loaded: LoadedSignerProfile[];
  minimumBalanceLamports?: number;
  generatedAt?: string;
}): SignerBackedWalletManifest {
  return {
    schemaVersion: "1.0.0",
    network: "solana-devnet",
    minimumBalanceLamports: input.minimumBalanceLamports ?? 1_000_000,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    profiles: input.loaded.map(({ profile, keypair, sourceEnv }) => ({
      profileId: profile.id,
      displayName: profile.displayName,
      publicKey: keypair.publicKey.toBase58(),
      signerProvenance: {
        sourceEnv,
        derivedFromSigner: true,
      },
    })),
  };
}

export function validateSignerBackedManifest(manifest: unknown, options?: { requireSignerProvenance?: boolean }): string[] {
  const errors: string[] = [];
  if (!manifest || typeof manifest !== "object") return ["manifest must be an object"];
  const record = manifest as Record<string, unknown>;
  if (record.schemaVersion !== "1.0.0") errors.push("schemaVersion must be 1.0.0");
  if (record.network !== "solana-devnet") errors.push("manifest must be solana-devnet only");
  if (typeof record.minimumBalanceLamports !== "number" || record.minimumBalanceLamports < 0) errors.push("minimumBalanceLamports must be a non-negative number");
  if (!Array.isArray(record.profiles)) errors.push("profiles must be an array");

  const ids = new Set<string>();
  const publicKeys = new Set<string>();
  for (const entry of Array.isArray(record.profiles) ? record.profiles : []) {
    if (!entry || typeof entry !== "object") {
      errors.push("profile entry must be an object");
      continue;
    }
    const profile = entry as Record<string, unknown>;
    const profileId = String(profile.profileId ?? "unknown");
    if (typeof profile.profileId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.profileId)) errors.push(`${profileId}: invalid profileId`);
    if (ids.has(profileId)) errors.push(`${profileId}: duplicate profileId`);
    ids.add(profileId);
    if (typeof profile.publicKey !== "string" || !isStrictPublicKey(profile.publicKey)) errors.push(`${profileId}: invalid publicKey`);
    if (typeof profile.publicKey === "string" && publicKeys.has(profile.publicKey)) errors.push(`${profileId}: duplicate publicKey`);
    if (typeof profile.publicKey === "string") publicKeys.add(profile.publicKey);

    for (const key of Object.keys(profile)) {
      if (SECRET_FIELD_PATTERN.test(key) && key !== "signerProvenance") errors.push(`${profileId}: public manifest contains secret-like field ${key}`);
    }

    const provenance = profile.signerProvenance as Record<string, unknown> | undefined;
    if (options?.requireSignerProvenance) {
      if (!provenance || typeof provenance !== "object") errors.push(`${profileId}: missing signerProvenance`);
      else {
        if (provenance.derivedFromSigner !== true) errors.push(`${profileId}: signerProvenance.derivedFromSigner must be true`);
        if (typeof provenance.sourceEnv !== "string" || !signerEnvNamesFor(profileId).includes(provenance.sourceEnv)) {
          errors.push(`${profileId}: signerProvenance.sourceEnv must be an approved env var name`);
        }
      }
    }
  }

  if (containsSecretLikeValue(record)) errors.push("public manifest contains secret-like value material");
  return errors;
}

export function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return "[REDACTED_ARRAY]";
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    output[key] = SECRET_FIELD_PATTERN.test(key) ? "[REDACTED]" : redactSecrets(nested);
  }
  return output;
}

function loadBulkSignerEnv(raw: string | undefined): Map<string, unknown> {
  const out = new Map<string, unknown>();
  if (!raw?.trim()) return out;
  const parsed = JSON.parse(raw);
  if (Array.isArray(parsed)) {
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      if (typeof record.profileId === "string") out.set(record.profileId, record.secretKey ?? record.privateKey ?? record.keypair ?? record);
    }
    return out;
  }
  if (parsed && typeof parsed === "object") {
    for (const [profileId, material] of Object.entries(parsed as Record<string, unknown>)) out.set(profileId, material);
  }
  return out;
}

function isStrictPublicKey(value: string): boolean {
  try {
    const publicKey = new PublicKey(value);
    return publicKey.toBytes().length === 32 && publicKey.toBase58() === value;
  } catch {
    return false;
  }
}

function containsSecretLikeValue(value: unknown): boolean {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^(\[\s*\d{1,3}\s*,){20,}/.test(trimmed)) return true;
    if (/BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY/.test(trimmed)) return true;
    if (/\b(?:secretKey|privateKey|mnemonic|seed phrase)\b/i.test(trimmed)) return true;
  }
  if (Array.isArray(value)) return value.length >= 32 && value.every((entry) => Number.isInteger(entry));
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).some(containsSecretLikeValue);
  return false;
}
