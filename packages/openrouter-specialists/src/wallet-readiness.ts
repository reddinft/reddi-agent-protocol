import { specialistProfiles } from "./profiles/index.js";
import type { SpecialistProfile } from "./types.js";
import type { SignerBackedWalletManifest } from "./wallet-provenance.js";

export type WalletReadinessStatus = "ready" | "blocked";
export type WalletProvenanceStatus =
  | "signer_backed"
  | "placeholder_or_unverified";

export interface WalletReadinessEntry {
  profileId: string;
  displayName: string;
  publicKey: string;
  profileIndex: number;
  firstFiveDeploymentProfile: boolean;
  provenance: WalletProvenanceStatus;
  signerSourceEnv?: string;
  fundingReady: boolean;
  registrationReady: boolean;
  blockers: string[];
}

export interface WalletReadinessReport {
  schemaVersion: "reddi.openrouter.wallet-readiness.v1";
  status: WalletReadinessStatus;
  generatedAt: string;
  network: "solana-devnet";
  profileCount: number;
  signerBackedCount: number;
  placeholderOrUnverifiedCount: number;
  guardrails: string[];
  entries: WalletReadinessEntry[];
  nextApprovalRequired: string[];
}

export function buildWalletReadinessReport(input?: {
  profiles?: SpecialistProfile[];
  signerBackedManifest?: SignerBackedWalletManifest;
  generatedAt?: string;
}): WalletReadinessReport {
  const profiles = input?.profiles ?? specialistProfiles;
  const signerBackedByProfile = new Map(
    (input?.signerBackedManifest?.profiles ?? []).map((entry) => [
      entry.profileId,
      entry,
    ]),
  );
  const entries = profiles.map((profile, index): WalletReadinessEntry => {
    const signerBacked = signerBackedByProfile.get(profile.id);
    const signerBackedMatchesProfile =
      signerBacked?.publicKey === profile.walletAddress;
    const blockers: string[] = [];
    if (!signerBacked)
      blockers.push("wallet is not signer-backed in supplied manifest");
    else if (!signerBackedMatchesProfile)
      blockers.push("signer-backed public key does not match profile wallet");

    const provenance: WalletProvenanceStatus =
      signerBacked && signerBackedMatchesProfile
        ? "signer_backed"
        : "placeholder_or_unverified";
    return {
      profileId: profile.id,
      displayName: profile.displayName,
      publicKey: profile.walletAddress,
      profileIndex: index,
      firstFiveDeploymentProfile: index < 5,
      provenance,
      signerSourceEnv:
        provenance === "signer_backed"
          ? signerBacked?.signerProvenance.sourceEnv
          : undefined,
      fundingReady: provenance === "signer_backed",
      registrationReady: provenance === "signer_backed",
      blockers,
    };
  });
  const signerBackedCount = entries.filter(
    (entry) => entry.provenance === "signer_backed",
  ).length;
  const placeholderOrUnverifiedCount = entries.length - signerBackedCount;
  return {
    schemaVersion: "reddi.openrouter.wallet-readiness.v1",
    status: placeholderOrUnverifiedCount === 0 ? "ready" : "blocked",
    generatedAt: input?.generatedAt ?? new Date().toISOString(),
    network: "solana-devnet",
    profileCount: entries.length,
    signerBackedCount,
    placeholderOrUnverifiedCount,
    guardrails: [
      "public metadata only",
      "no private keys or signer material emitted",
      "placeholder_or_unverified wallets are not funding-ready",
      "placeholder_or_unverified wallets are not registration-ready",
      "devnet funding requires separate operator approval",
    ],
    entries,
    nextApprovalRequired: [
      "Generate or import signer-backed devnet wallets for every placeholder_or_unverified profile.",
      "Rotate profile wallet constants/public manifest from signer-derived public keys before funding.",
      "Run balance checks and request explicit devnet funding approval before any transfer.",
      "Run devnet registration only after signer/profile/manifest wallet equality passes.",
    ],
  };
}
