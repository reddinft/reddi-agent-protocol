import { candidatesFromWalletManifest, type WalletManifest } from "./marketplace-client.js";
import { specialistProfiles } from "./profiles/index.js";

export type ReadinessStatus = "ready" | "blocked";

export interface SpecialistReadinessEntry {
  profileId: string;
  displayName: string;
  walletAddress?: string;
  endpoint?: string;
  roles: string[];
  capabilities: string[];
  preferredAttestors: string[];
  checks: Array<{ id: string; ok: boolean; summary: string }>;
  blockers: string[];
}

export interface DeploymentReadinessReport {
  schemaVersion: "reddi.openrouter.deployment-readiness.v1";
  status: ReadinessStatus;
  generatedAt: string;
  network: string;
  minimumBalanceLamports: number;
  guardrails: string[];
  entries: SpecialistReadinessEntry[];
  excluded: Array<{ profileId: string; reasons: string[] }>;
  nextApprovalRequired: string[];
}

export function buildDeploymentReadinessReport(input: {
  manifest: WalletManifest;
  endpointBaseUrl?: string;
  fundedProfileIds?: string[];
  deployedProfileIds?: string[];
  generatedAt?: string;
}): DeploymentReadinessReport {
  const endpointBaseUrl = input.endpointBaseUrl;
  const funded = new Set(input.fundedProfileIds ?? []);
  const deployed = new Set(input.deployedProfileIds ?? []);
  const { candidates, excluded } = candidatesFromWalletManifest(input.manifest, specialistProfiles);
  const entries = candidates.map((candidate): SpecialistReadinessEntry => {
    const endpoint = endpointBaseUrl ? `${endpointBaseUrl}${candidate.endpointPath}` : undefined;
    const checks = [
      { id: "public_wallet_present", ok: Boolean(candidate.walletAddress), summary: candidate.walletAddress ? "public wallet present" : "missing public wallet" },
      { id: "endpoint_configured", ok: Boolean(endpoint), summary: endpoint ? `endpoint planned: ${endpoint}` : "PUBLIC_BASE_URL/endpoint not configured" },
      { id: "funding_confirmed", ok: funded.has(candidate.profileId), summary: funded.has(candidate.profileId) ? "funding marked ready" : "funding not confirmed; approval/funding required" },
      { id: "deployment_confirmed", ok: deployed.has(candidate.profileId), summary: deployed.has(candidate.profileId) ? "deployment marked ready" : "Coolify deployment not confirmed" },
      { id: "attestor_configured", ok: candidate.roles.includes("attestor") || candidate.preferredAttestors.length > 0, summary: candidate.roles.includes("attestor") ? "profile is attestor" : `preferred attestor: ${candidate.preferredAttestors[0] ?? "missing"}` },
    ];
    return {
      profileId: candidate.profileId,
      displayName: candidate.displayName,
      walletAddress: candidate.walletAddress,
      endpoint,
      roles: candidate.roles,
      capabilities: candidate.capabilities,
      preferredAttestors: candidate.preferredAttestors,
      checks,
      blockers: checks.filter((check) => !check.ok).map((check) => check.summary),
    };
  });
  const nextApprovalRequired = [
    "Approve/configure Coolify deployments for first five specialist profiles.",
    "Approve/fund public devnet wallets to the minimum balance threshold if live registration is next.",
    "Approve production secret configuration for OPENROUTER_API_KEY outside the repository.",
    "Approve any live downstream x402 execution separately; Iteration 4.5 does not enable it.",
  ];
  return {
    schemaVersion: "reddi.openrouter.deployment-readiness.v1",
    status: entries.every((entry) => entry.blockers.length === 0) && excluded.length === 0 ? "ready" : "blocked",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    network: input.manifest.network,
    minimumBalanceLamports: input.manifest.minimumBalanceLamports,
    guardrails: [
      "public metadata only",
      "no private keys or signer material inspected",
      "no devnet SOL spent",
      "no Coolify deployment performed",
      "no live downstream x402 calls executed",
    ],
    entries,
    excluded,
    nextApprovalRequired,
  };
}
