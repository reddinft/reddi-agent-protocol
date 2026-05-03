import { specialistProfiles } from "../../packages/openrouter-specialists/src/profiles/index";
import type { SpecialistProfile } from "../../packages/openrouter-specialists/src/types";
import { computeCapabilityHash, validateCapabilities, type CapabilityInput } from "@/lib/onboarding/capabilities";
import type { SpecialistIndexEntry } from "@/lib/onboarding/specialist-index";
import { computeFreshnessState, computeSpecialistRankingScore } from "@/lib/onboarding/specialist-index";

const DEFAULT_HEALTH_STREAK = 1;
const SMOKE_EVIDENCE_TIMESTAMP = "2026-05-04T08:05:44.000+10:00";
const SMOKE_EVIDENCE_HEALTHCHECK_STATUS = "pass";

const OPENROUTER_PROFILE_ENDPOINTS: Record<string, string> = {
  "planning-agent": "https://reddi-planning-agent.preview.reddi.tech/v1/chat/completions",
  "document-intelligence-agent": "https://reddi-document-intelligence.preview.reddi.tech/v1/chat/completions",
  "verification-validation-agent": "https://reddi-verification-agent.preview.reddi.tech/v1/chat/completions",
  "code-generation-agent": "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
  "conversational-agent": "https://reddi-conversational.preview.reddi.tech/v1/chat/completions",
};

const hostedOpenRouterProfiles = specialistProfiles.filter((profile) => profile.id in OPENROUTER_PROFILE_ENDPOINTS);

const profileByWallet = new Map(specialistProfiles.map((profile) => [profile.walletAddress, profile]));

export function findOpenRouterProfile(walletAddress: string): SpecialistProfile | undefined {
  return profileByWallet.get(walletAddress);
}

export function buildOpenRouterSpecialistIndexEntry(walletAddress: string): SpecialistIndexEntry | null {
  const profile = findOpenRouterProfile(walletAddress);
  if (!profile) return null;
  const endpointUrl = OPENROUTER_PROFILE_ENDPOINTS[profile.id];
  if (!endpointUrl) return null;

  const capabilities = validateCapabilities(toCapabilityInput(profile));
  const lastSeenAt = SMOKE_EVIDENCE_TIMESTAMP;
  const updatedAt = lastSeenAt;
  const attested = false;
  const routingSignals = {
    feedbackCount: 0,
    avgFeedbackScore: 0,
    attestationAgreements: 0,
    attestationDisagreements: 0,
  };
  const ranking_score = computeSpecialistRankingScore({
    reputationScore: 0,
    healthStreak: DEFAULT_HEALTH_STREAK,
    attested,
    feedbackAvg: routingSignals.avgFeedbackScore,
  });

  return {
    walletAddress,
    updatedAt,
    schema_version: 2,
    ranking_formula_version: 1,
    endpointUrl,
    healthcheckStatus: SMOKE_EVIDENCE_HEALTHCHECK_STATUS,
    freshness_state: computeFreshnessState(lastSeenAt),
    attested,
    capabilityHash: computeCapabilityHash(walletAddress, capabilities),
    capabilities,
    routingSignals,
    last_seen_at: lastSeenAt,
    health_streak: DEFAULT_HEALTH_STREAK,
    ranking_score,
    reputation_score: 0,
  };
}

export function enrichIndexEntryWithOpenRouterProfile(entry: SpecialistIndexEntry): SpecialistIndexEntry {
  const enrichment = buildOpenRouterSpecialistIndexEntry(entry.walletAddress);
  if (!enrichment) return entry;

  return {
    ...enrichment,
    ...entry,
    endpointUrl: entry.endpointUrl ?? enrichment.endpointUrl,
    healthcheckStatus: entry.healthcheckStatus === "pass" || entry.healthcheckStatus === "fail" ? entry.healthcheckStatus : enrichment.healthcheckStatus,
    freshness_state: entry.freshness_state === "fresh" || entry.freshness_state === "warm" || entry.freshness_state === "stale" ? entry.freshness_state : enrichment.freshness_state,
    attested: entry.attested ?? enrichment.attested,
    capabilityHash: entry.capabilityHash ?? enrichment.capabilityHash,
    capabilities: hasMeaningfulCapabilities(entry.capabilities) ? entry.capabilities : enrichment.capabilities,
    routingSignals: hasMeaningfulRoutingSignals(entry.routingSignals) ? entry.routingSignals : enrichment.routingSignals,
    last_seen_at: entry.last_seen_at ?? enrichment.last_seen_at,
    health_streak: entry.health_streak ?? enrichment.health_streak,
    ranking_score: entry.ranking_score ?? enrichment.ranking_score,
    reputation_score: entry.reputation_score ?? enrichment.reputation_score,
  };
}

export function enrichCapabilityIndexWithOpenRouterProfiles(entries: SpecialistIndexEntry[]): SpecialistIndexEntry[] {
  const byWallet = new Map(entries.map((entry) => [entry.walletAddress, enrichIndexEntryWithOpenRouterProfile(entry)]));
  for (const profile of hostedOpenRouterProfiles) {
    if (!byWallet.has(profile.walletAddress)) {
      const entry = buildOpenRouterSpecialistIndexEntry(profile.walletAddress);
      if (entry) byWallet.set(profile.walletAddress, entry);
    }
  }
  return [...byWallet.values()];
}

function toCapabilityInput(profile: SpecialistProfile): CapabilityInput {
  const normalizedCapabilities = profile.capabilities.map((capability) => capability.toLowerCase());
  return {
    taskTypes: mapTaskTypes(normalizedCapabilities),
    inputModes: mapInputModes(profile, normalizedCapabilities),
    outputModes: ["text", "json", "markdown"],
    privacyModes: profile.roles.includes("consumer") ? ["public", "per"] : ["public"],
    pricing: { baseUsd: 0, perCallUsd: Number.parseFloat(profile.price.amount) || 0 },
    tags: [...new Set([...profile.tags, ...normalizedCapabilities, profile.id, profile.safetyMode])],
    context_requirements: [
      { key: "messages", type: "json", required: true, description: "OpenAI-compatible chat messages for the specialist." },
      { key: "metadata", type: "json", required: false, description: "Optional Reddi routing, receipt, and attestation metadata." },
    ],
    runtime_capabilities: runtimeCapabilitiesFor(profile, normalizedCapabilities),
    agent_composition: {
      llm: profile.model,
      control_loop: "openrouter-x402-specialist-runtime",
      tools: profile.roles.includes("attestor") ? ["receipt_review", "evidence_checks"] : ["chat_completion"],
      memory: ["request_scoped"],
      goals: profile.capabilities,
    },
    quality_claims: [profile.description],
    attestor_checkpoints: profile.roles.includes("attestor")
      ? ["receipt_integrity", "output_completeness", "evidence_quality", "safety_boundary"]
      : ["requires-verification-validation-agent"],
  };
}

function mapTaskTypes(capabilities: string[]): CapabilityInput["taskTypes"] {
  const taskTypes = new Set<CapabilityInput["taskTypes"][number]>();
  const addWhen = (needles: string[], taskType: CapabilityInput["taskTypes"][number]) => {
    if (capabilities.some((capability) => needles.some((needle) => capability.includes(needle)))) taskTypes.add(taskType);
  };
  addWhen(["planning", "task-decomposition", "orchestration"], "plan");
  addWhen(["risk-analysis", "document-analysis", "validation", "verification"], "analyze");
  addWhen(["summarization", "handoff-summary"], "summarize");
  addWhen(["evidence-extraction"], "extract");
  addWhen(["classification"], "classify");
  addWhen(["code", "debugging", "test-writing", "technical-design"], "code");
  addWhen(["quality-review", "safety-review", "attestation", "test-writing", "technical-design"], "review");
  addWhen(["conversation", "intake", "clarification"], "qa");
  if (taskTypes.size === 0) taskTypes.add("custom");
  return [...taskTypes];
}

function mapInputModes(profile: SpecialistProfile, capabilities: string[]): CapabilityInput["inputModes"] {
  const inputModes = new Set<CapabilityInput["inputModes"][number]>(["text", "json"]);
  if (capabilities.some((capability) => /document|evidence|summary|code|design/.test(capability)) || profile.tags.includes("documents")) {
    inputModes.add("markdown");
    inputModes.add("file");
  }
  return [...inputModes];
}

function runtimeCapabilitiesFor(profile: SpecialistProfile, capabilities: string[]): CapabilityInput["runtime_capabilities"] {
  const runtime = new Set<NonNullable<CapabilityInput["runtime_capabilities"]>[number]>(["streaming", "stateful"]);
  if (capabilities.some((capability) => /code|debug|test/.test(capability))) runtime.add("code_execution");
  if (capabilities.some((capability) => /document|evidence|classification|summarization/.test(capability))) runtime.add("file_read");
  if (profile.model.includes("claude")) runtime.add("long_running");
  return [...runtime];
}

function hasMeaningfulCapabilities(capabilities: CapabilityInput | undefined): boolean {
  return Boolean(capabilities?.taskTypes?.length || capabilities?.tags?.length || capabilities?.runtime_capabilities?.length);
}

function hasMeaningfulRoutingSignals(signals: SpecialistIndexEntry["routingSignals"]): boolean {
  return Boolean(signals && (signals.feedbackCount > 0 || signals.avgFeedbackScore > 0 || signals.attestationAgreements > 0));
}
