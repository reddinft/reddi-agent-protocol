import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";

export type CapabilityInput = {
  taskTypes: string[];
  inputModes: string[];
  outputModes: string[];
  pricing: {
    baseUsd: number;
    perCallUsd?: number;
  };
  privacyModes: Array<"public" | "per" | "vanish">;
  tags?: string[];
};

export type CapabilityRecord = {
  walletAddress: string;
  updatedAt: string;
  capabilities: CapabilityInput;
  /** SHA-256 of canonical profile JSON (sorted keys, no updatedAt) */
  capabilityHash?: string;
};

/**
 * Compute a stable SHA-256 hash of a capability profile.
 * Keys sorted alphabetically, updatedAt excluded, arrays sorted.
 */
export function computeCapabilityHash(walletAddress: string, caps: ReturnType<typeof validateCapabilities>): string {
  const canonical = {
    inputModes: [...caps.inputModes].sort(),
    outputModes: [...caps.outputModes].sort(),
    pricing: { baseUsd: caps.pricing.baseUsd, perCallUsd: caps.pricing.perCallUsd ?? 0 },
    privacyModes: [...caps.privacyModes].sort(),
    tags: [...(caps.tags ?? [])].sort(),
    taskTypes: [...caps.taskTypes].sort(),
    version: "1",
    walletAddress,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}

const CAPABILITY_PATH = join(process.cwd(), "data", "onboarding", "specialist-capabilities.json");

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function readAll(): CapabilityRecord[] {
  try {
    return JSON.parse(readFileSync(CAPABILITY_PATH, "utf8")) as CapabilityRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: CapabilityRecord[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(CAPABILITY_PATH, JSON.stringify(records, null, 2));
}

export function validateCapabilities(input: CapabilityInput) {
  const taskTypes = normalizeList(input.taskTypes || []);
  const inputModes = normalizeList(input.inputModes || []);
  const outputModes = normalizeList(input.outputModes || []);
  const tags = normalizeList(input.tags || []);
  const privacyModes = Array.from(new Set((input.privacyModes || []).filter(Boolean)));

  if (taskTypes.length === 0) throw new Error("At least one task type is required.");
  if (inputModes.length === 0) throw new Error("At least one input mode is required.");
  if (outputModes.length === 0) throw new Error("At least one output mode is required.");
  if (privacyModes.length === 0) throw new Error("At least one privacy mode is required.");

  for (const mode of privacyModes) {
    if (!["public", "per", "vanish"].includes(mode)) {
      throw new Error(`Unsupported privacy mode: ${mode}`);
    }
  }

  const baseUsd = Number(input.pricing?.baseUsd);
  const perCallUsd =
    input.pricing?.perCallUsd === undefined ? undefined : Number(input.pricing.perCallUsd);

  if (!Number.isFinite(baseUsd) || baseUsd < 0) {
    throw new Error("pricing.baseUsd must be a number >= 0.");
  }
  if (perCallUsd !== undefined && (!Number.isFinite(perCallUsd) || perCallUsd < 0)) {
    throw new Error("pricing.perCallUsd must be a number >= 0 when provided.");
  }

  return {
    taskTypes,
    inputModes,
    outputModes,
    tags,
    privacyModes: privacyModes as Array<"public" | "per" | "vanish">,
    pricing: {
      baseUsd,
      perCallUsd,
    },
  };
}

export function upsertCapabilities(walletAddress: string, capabilities: CapabilityInput) {
  if (!walletAddress || walletAddress.length < 32) {
    throw new Error("Valid wallet address is required.");
  }

  const normalized = validateCapabilities(capabilities);
  const records = readAll();
  const now = new Date().toISOString();

  const capabilityHash = computeCapabilityHash(walletAddress, normalized);
  const nextRecord: CapabilityRecord = {
    walletAddress,
    updatedAt: now,
    capabilities: normalized,
    capabilityHash,
  };

  const idx = records.findIndex((r) => r.walletAddress === walletAddress);
  if (idx >= 0) {
    records[idx] = nextRecord;
  } else {
    records.push(nextRecord);
  }

  writeAll(records);

  return {
    ok: true,
    record: nextRecord,
    storagePath: CAPABILITY_PATH,
  };
}
