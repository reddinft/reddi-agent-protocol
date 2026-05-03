import type { SpecialistPrice, SpecialistProfile } from "./types.js";
import { specialistProfiles } from "./profiles/index.js";

export interface MarketplaceCandidate {
  profileId: string;
  displayName: string;
  endpointPath: string;
  capabilities: string[];
  roles: string[];
  price: SpecialistPrice;
  reputationScore: number;
  freshnessScore: number;
  preferredAttestors: string[];
  safetyMode: string;
}

export interface MarketplaceDiscoveryQuery {
  requesterProfileId: string;
  requiredCapabilities: string[];
  maxCandidates?: number;
}

export interface RankedMarketplaceCandidate extends MarketplaceCandidate {
  matchedCapabilities: string[];
  missingCapabilities: string[];
  rankScore: number;
  rankRationale: string[];
}

export interface DelegationPlanRequest {
  task: string;
  requiredCapabilities: string[];
  requesterProfileId: string;
  maxCandidates?: number;
}

export interface DelegationPlan {
  mode: "dry_run";
  status: "planned" | "no_candidates";
  requesterProfileId: string;
  task: string;
  requiredCapabilities: string[];
  liveCallsEnabled: false;
  downstreamCallsExecuted: 0;
  candidates: RankedMarketplaceCandidate[];
  selectedCandidate?: RankedMarketplaceCandidate;
  estimatedCost?: SpecialistPrice;
  requiredAttestor?: string;
  guardrails: string[];
}

export interface MarketplaceDiscoveryClient {
  discover(query: MarketplaceDiscoveryQuery): Promise<MarketplaceCandidate[]>;
}

const STATIC_REPUTATION: Record<string, { reputationScore: number; freshnessScore: number }> = {
  "planning-agent": { reputationScore: 0.91, freshnessScore: 0.92 },
  "document-intelligence-agent": { reputationScore: 0.88, freshnessScore: 0.9 },
  "verification-validation-agent": { reputationScore: 0.93, freshnessScore: 0.91 },
  "code-generation-agent": { reputationScore: 0.9, freshnessScore: 0.89 },
  "conversational-agent": { reputationScore: 0.84, freshnessScore: 0.88 },
};

export class StaticMarketplaceDiscoveryClient implements MarketplaceDiscoveryClient {
  constructor(private readonly profiles: SpecialistProfile[] = specialistProfiles) {}

  async discover(query: MarketplaceDiscoveryQuery): Promise<MarketplaceCandidate[]> {
    const required = normalizeCapabilities(query.requiredCapabilities);
    return this.profiles
      .filter((profile) => profile.id !== query.requesterProfileId)
      .filter((profile) => profile.roles.includes("specialist"))
      .filter((profile) => required.length === 0 || normalizeCapabilities(profile.capabilities).some((capability) => required.includes(capability)))
      .map(toCandidate);
  }
}

export function normalizeCapabilities(capabilities: string[]): string[] {
  return [...new Set(capabilities.map((capability) => capability.trim().toLowerCase()).filter(Boolean))].sort();
}

export function inferRequiredCapabilities(task: string): string[] {
  const normalized = task.toLowerCase();
  const inferred = new Set<string>();
  const addWhen = (pattern: RegExp, capability: string) => {
    if (pattern.test(normalized)) inferred.add(capability);
  };

  addWhen(/\b(document|pdf|evidence|extract|summari[sz]e|classif)/, "document-analysis");
  addWhen(/\b(code|bug|debug|test|typescript|api|implementation|build)\b/, "code-generation");
  addWhen(/\b(verify|validate|attest|quality|review|evidence)\b/, "verification");
  addWhen(/\b(plan|roadmap|sequence|milestone|orchestrat)/, "planning");
  addWhen(/\b(intake|clarify|conversation|support|handoff)\b/, "conversation");

  return [...inferred].sort();
}

export function rankMarketplaceCandidates(candidates: MarketplaceCandidate[], requiredCapabilities: string[]): RankedMarketplaceCandidate[] {
  const required = normalizeCapabilities(requiredCapabilities);
  return candidates
    .map((candidate) => rankCandidate(candidate, required))
    .sort((a, b) => b.rankScore - a.rankScore || priceAsNumber(a.price) - priceAsNumber(b.price) || b.reputationScore - a.reputationScore || a.profileId.localeCompare(b.profileId));
}

export async function buildDryRunDelegationPlan(input: {
  request: DelegationPlanRequest;
  discoveryClient?: MarketplaceDiscoveryClient;
}): Promise<DelegationPlan> {
  const requiredCapabilities = normalizeCapabilities(input.request.requiredCapabilities);
  const discoveryClient = input.discoveryClient ?? new StaticMarketplaceDiscoveryClient();
  const candidates = rankMarketplaceCandidates(
    await discoveryClient.discover({
      requesterProfileId: input.request.requesterProfileId,
      requiredCapabilities,
      maxCandidates: input.request.maxCandidates,
    }),
    requiredCapabilities,
  ).slice(0, input.request.maxCandidates ?? 3);
  const selectedCandidate = candidates[0];

  return {
    mode: "dry_run",
    status: selectedCandidate ? "planned" : "no_candidates",
    requesterProfileId: input.request.requesterProfileId,
    task: input.request.task,
    requiredCapabilities,
    liveCallsEnabled: false,
    downstreamCallsExecuted: 0,
    candidates,
    selectedCandidate,
    estimatedCost: selectedCandidate?.price,
    requiredAttestor: selectedCandidate?.preferredAttestors[0] ?? "verification-validation-agent",
    guardrails: [
      "dry-run only: no downstream x402 negotiation executed",
      "no devnet SOL spent",
      "no signer or private-key material used",
      "set ENABLE_AGENT_TO_AGENT_CALLS=true only in a later live-call iteration",
    ],
  };
}

function toCandidate(profile: SpecialistProfile): MarketplaceCandidate {
  const scores = STATIC_REPUTATION[profile.id] ?? { reputationScore: 0.75, freshnessScore: 0.75 };
  return {
    profileId: profile.id,
    displayName: profile.displayName,
    endpointPath: profile.endpointPath,
    capabilities: profile.capabilities,
    roles: profile.roles,
    price: profile.price,
    reputationScore: scores.reputationScore,
    freshnessScore: scores.freshnessScore,
    preferredAttestors: profile.preferredAttestors,
    safetyMode: profile.safetyMode,
  };
}

function rankCandidate(candidate: MarketplaceCandidate, requiredCapabilities: string[]): RankedMarketplaceCandidate {
  const candidateCapabilities = normalizeCapabilities(candidate.capabilities);
  const matchedCapabilities = requiredCapabilities.filter((capability) => candidateCapabilities.includes(capability));
  const missingCapabilities = requiredCapabilities.filter((capability) => !candidateCapabilities.includes(capability));
  const capabilityScore = requiredCapabilities.length === 0 ? 0.5 : matchedCapabilities.length / requiredCapabilities.length;
  const affordabilityScore = Math.max(0, 1 - priceAsNumber(candidate.price));
  const rankScore = Number((capabilityScore * 70 + candidate.reputationScore * 15 + candidate.freshnessScore * 10 + affordabilityScore * 5).toFixed(4));
  return {
    ...candidate,
    matchedCapabilities,
    missingCapabilities,
    rankScore,
    rankRationale: [
      `matched ${matchedCapabilities.length}/${requiredCapabilities.length} required capabilities`,
      `reputation=${candidate.reputationScore.toFixed(2)}`,
      `freshness=${candidate.freshnessScore.toFixed(2)}`,
      `price=${candidate.price.amount} ${candidate.price.currency}/${candidate.price.unit}`,
    ],
  };
}

function priceAsNumber(price: SpecialistPrice): number {
  const parsed = Number.parseFloat(price.amount);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
}
