import { PublicKey } from "@solana/web3.js";
import { specialistProfiles } from "./profiles/index.js";
import type { WalletManifest } from "./marketplace-client.js";
import type { SpecialistProfile } from "./types.js";

export type WalletRotationAction =
  | "generate_or_import_signer"
  | "rotate_profile_and_manifest_wallet"
  | "verify_signer_backed_readiness"
  | "ready_for_operator_funding_approval";

export interface WalletRotationPlanEntry {
  profileId: string;
  displayName: string;
  currentProfileWallet: string;
  currentManifestWallet?: string;
  candidateSignerWallet?: string;
  signerBacked: boolean;
  profileManifestMatch: boolean;
  candidateMatchesProfile: boolean;
  fundingReadyAfterRotation: boolean;
  registrationReadyAfterRotation: boolean;
  actions: WalletRotationAction[];
  blockers: string[];
}

export interface WalletRotationPlan {
  schemaVersion: "reddi.openrouter.wallet-rotation-plan.v1";
  status: "ready_for_operator_funding_approval" | "blocked";
  generatedAt: string;
  network: "solana-devnet";
  profileCount: number;
  signerBackedCandidateCount: number;
  profileManifestMismatchCount: number;
  candidateRotationRequiredCount: number;
  guardrails: string[];
  entries: WalletRotationPlanEntry[];
  nextApprovalRequired: string[];
}

export interface SignerBackedCandidateManifestProfile {
  profileId: string;
  displayName?: string;
  publicKey: string;
  signerProvenance?: {
    sourceEnv?: string;
    derivedFromSigner?: boolean;
  };
}

export interface SignerBackedCandidateManifest {
  schemaVersion?: string;
  network?: string;
  profiles?: SignerBackedCandidateManifestProfile[];
}

export function buildWalletRotationPlan(input?: {
  profiles?: SpecialistProfile[];
  currentManifest?: WalletManifest;
  candidateManifest?: SignerBackedCandidateManifest;
  generatedAt?: string;
}): WalletRotationPlan {
  const profiles = input?.profiles ?? specialistProfiles;
  const currentManifestById = new Map((input?.currentManifest?.profiles ?? []).map((entry) => [entry.profileId, entry]));
  const candidateById = new Map((input?.candidateManifest?.profiles ?? []).map((entry) => [entry.profileId, entry]));

  const entries = profiles.map((profile): WalletRotationPlanEntry => {
    const currentManifestWallet = currentManifestById.get(profile.id)?.publicKey;
    const candidate = candidateById.get(profile.id);
    const candidateSignerWallet = candidate?.publicKey;
    const signerBacked = isSignerBackedCandidate(candidate);
    const profileManifestMatch = currentManifestWallet === profile.walletAddress;
    const candidateMatchesProfile = signerBacked && candidateSignerWallet === profile.walletAddress;
    const actions: WalletRotationAction[] = [];
    const blockers: string[] = [];

    if (!profileManifestMatch) {
      blockers.push("current public manifest wallet does not match profile wallet");
    }
    if (!signerBacked) {
      actions.push("generate_or_import_signer");
      blockers.push("missing signer-backed candidate public key");
    } else if (!candidateMatchesProfile) {
      actions.push("rotate_profile_and_manifest_wallet");
      blockers.push("signer-backed candidate wallet has not yet replaced profile/manifest wallet");
    }

    if (signerBacked) actions.push("verify_signer_backed_readiness");
    if (profileManifestMatch && candidateMatchesProfile) actions.push("ready_for_operator_funding_approval");

    return {
      profileId: profile.id,
      displayName: profile.displayName,
      currentProfileWallet: profile.walletAddress,
      currentManifestWallet,
      candidateSignerWallet,
      signerBacked,
      profileManifestMatch,
      candidateMatchesProfile,
      fundingReadyAfterRotation: profileManifestMatch && candidateMatchesProfile,
      registrationReadyAfterRotation: profileManifestMatch && candidateMatchesProfile,
      actions,
      blockers,
    };
  });

  const signerBackedCandidateCount = entries.filter((entry) => entry.signerBacked).length;
  const profileManifestMismatchCount = entries.filter((entry) => !entry.profileManifestMatch).length;
  const candidateRotationRequiredCount = entries.filter((entry) => entry.signerBacked && !entry.candidateMatchesProfile).length;
  const ready = entries.every((entry) => entry.fundingReadyAfterRotation && entry.registrationReadyAfterRotation);

  return {
    schemaVersion: "reddi.openrouter.wallet-rotation-plan.v1",
    status: ready ? "ready_for_operator_funding_approval" : "blocked",
    generatedAt: input?.generatedAt ?? new Date().toISOString(),
    network: "solana-devnet",
    profileCount: profiles.length,
    signerBackedCandidateCount,
    profileManifestMismatchCount,
    candidateRotationRequiredCount,
    guardrails: [
      "public metadata only",
      "no private keys or signer material emitted",
      "no devnet funding executed",
      "no devnet registration executed",
      "no Coolify mutation executed",
      "operator approval required before any transfer or registration",
    ],
    entries,
    nextApprovalRequired: ready
      ? [
          "Operator approval to fund signer-backed devnet wallets.",
          "Operator approval to run devnet registration after balances pass.",
          "Operator approval to mutate Coolify environment and redeploy hosted specialists.",
        ]
      : [
          "Generate or import signer-backed devnet wallets for every blocked profile.",
          "Rotate profile wallet constants and public manifest to signer-derived public keys.",
          "Re-run wallet readiness and rotation plan until all profiles are signer-backed and equality-verified.",
        ],
  };
}

function isSignerBackedCandidate(candidate: SignerBackedCandidateManifestProfile | undefined): boolean {
  if (!candidate) return false;
  if (!candidate.signerProvenance || candidate.signerProvenance.derivedFromSigner !== true) return false;
  if (typeof candidate.publicKey !== "string") return false;
  try {
    const publicKey = new PublicKey(candidate.publicKey);
    return publicKey.toBase58() === candidate.publicKey;
  } catch {
    return false;
  }
}
