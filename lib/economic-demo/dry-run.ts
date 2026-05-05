import { specialistProfiles } from "../../packages/openrouter-specialists/src/profiles/index";
import type { EconomicDemoScenarioId } from "@/lib/economic-demo/fixture";
import { openRouterEndpointByProfileId } from "@/lib/economic-demo/openrouter-endpoints";

type Profile = (typeof specialistProfiles)[number];

export type PlannedEconomicEdge = {
  fromProfileId: string;
  toProfileId: string;
  capability: string;
  endpoint: string;
  walletAddress: string;
  price: Profile["price"];
  requiredAttestors: string[];
  payloadSummary: string;
  status: "planned";
};

export type DryRunEconomicPlan = {
  scenarioId: EconomicDemoScenarioId;
  mode: "delegation_dry_run";
  downstreamCallsExecuted: 0;
  orchestrator: Pick<Profile, "id" | "displayName" | "walletAddress" | "capabilities" | "roles" | "price"> & { endpoint: string };
  edges: PlannedEconomicEdge[];
  plannedTotalUsd: number;
  notes: string[];
};

const ORCHESTRATORS: Record<EconomicDemoScenarioId, string> = {
  webpage: "agentic-workflow-system",
  research: "agentic-workflow-system",
  picture: "tool-using-agent",
};

const SCENARIO_EDGE_PROFILES: Record<EconomicDemoScenarioId, Array<{ id: string; capability: string; payloadSummary: string }>> = {
  webpage: [
    { id: "planning-agent", capability: "task-decomposition", payloadSummary: "Clarify page sections, user goal, and acceptance criteria." },
    { id: "content-creation-agent", capability: "marketing-copy", payloadSummary: "Draft page copy, calls-to-action, and positioning." },
    { id: "code-generation-agent", capability: "webpage-code", payloadSummary: "Produce implementation-ready webpage/component code." },
    { id: "verification-validation-agent", capability: "attestation", payloadSummary: "Check final webpage output against user request and receipt chain." },
  ],
  research: [
    { id: "knowledge-retrieval-agent", capability: "knowledge-retrieval", payloadSummary: "Gather source summaries, evidence candidates, and citation map." },
    { id: "scientific-research-agent", capability: "research-synthesis", payloadSummary: "Synthesize evidence into claims, caveats, and structure." },
    { id: "content-creation-agent", capability: "article-drafting", payloadSummary: "Convert synthesis into a reader-ready article draft." },
    { id: "explainable-agent", capability: "explainability-review", payloadSummary: "Check traceability, readability, and reasoning clarity." },
    { id: "verification-validation-agent", capability: "claim-verification", payloadSummary: "Verify claims against evidence and recommend release/refund/dispute." },
  ],
  picture: [
    { id: "tool-using-agent", capability: "image-adapter-orchestration", payloadSummary: "Prepare gated OpenAI/Fal image adapter call with budget and safety constraints." },
    { id: "vision-language-agent", capability: "image-validation", payloadSummary: "Validate generated visual output against the original prompt." },
    { id: "verification-validation-agent", capability: "attestation", payloadSummary: "Verify prompt adherence, receipt chain, and release/refund/dispute guidance." },
  ],
};

function profileById(id: string): Profile {
  const profile = specialistProfiles.find((candidate) => candidate.id === id);
  if (!profile) throw new Error(`unknown_profile:${id}`);
  return profile;
}

export function endpointForProfile(profileId: string): string {
  const endpoint = openRouterEndpointByProfileId[profileId];
  if (!endpoint) throw new Error(`missing_hosted_endpoint_evidence:${profileId}`);
  return endpoint;
}

function priceUsd(profile: Profile): number {
  return Number.parseFloat(profile.price.amount) || 0;
}

export function buildEconomicDemoDryRunPlan(scenarioId: EconomicDemoScenarioId): DryRunEconomicPlan {
  const orchestratorProfile = profileById(ORCHESTRATORS[scenarioId]);
  const edgeInputs = SCENARIO_EDGE_PROFILES[scenarioId];
  const edges = edgeInputs.map((edge): PlannedEconomicEdge => {
    const target = profileById(edge.id);
    return {
      fromProfileId: orchestratorProfile.id,
      toProfileId: target.id,
      capability: edge.capability,
      endpoint: endpointForProfile(target.id),
      walletAddress: target.walletAddress,
      price: target.price,
      requiredAttestors: target.roles.includes("attestor") ? [] : target.preferredAttestors,
      payloadSummary: edge.payloadSummary,
      status: "planned",
    };
  });

  return {
    scenarioId,
    mode: "delegation_dry_run",
    downstreamCallsExecuted: 0,
    orchestrator: {
      id: orchestratorProfile.id,
      displayName: orchestratorProfile.displayName,
      walletAddress: orchestratorProfile.walletAddress,
      capabilities: orchestratorProfile.capabilities,
      roles: orchestratorProfile.roles,
      price: orchestratorProfile.price,
      endpoint: endpointForProfile(orchestratorProfile.id),
    },
    edges,
    plannedTotalUsd: edges.reduce((sum, edge) => sum + priceUsd(profileById(edge.toProfileId)), 0),
    notes: [
      "Dry-run only: no x402 payment header generated.",
      "Dry-run only: downstreamCallsExecuted remains 0.",
      "Prices and wallets come from the deployed 30-profile OpenRouter specialist catalog.",
    ],
  };
}

export function isEconomicDemoScenarioId(value: unknown): value is EconomicDemoScenarioId {
  return value === "webpage" || value === "research" || value === "picture";
}
