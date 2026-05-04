import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";

export type ResearchWorkflowDesignEdge = {
  step: number;
  profileId: string;
  capability: string;
  endpoint: string;
  walletAddress: string;
  priceUsdc: string;
  scopedPayload: string;
  expectedOutput: string;
  evidenceRequirement: string;
  controlledDemoReceiptReadiness: "not_enabled_yet";
};

export type ResearchWorkflowDesign = {
  schemaVersion: "reddi.economic-demo.research-workflow-design.v1";
  generatedAt: string;
  phase: "8A";
  scenarioId: "research";
  mode: "design_only_no_live_calls";
  userRequest: string;
  orchestrator: {
    profileId: string;
    endpoint: string;
    walletAddress: string;
  };
  edges: ResearchWorkflowDesignEdge[];
  acceptanceCriteria: string[];
  guardrails: {
    noLiveCalls: true;
    noCoolifyMutation: true;
    noReceiptEnablementYet: true;
    citationsOrEvidenceCaveatsRequired: true;
    attestorReleaseRefundDisputeRequired: true;
  };
  retrospectiveQuestions: string[];
  nextStep: string;
};

const scopedPayloadByProfile: Record<string, Pick<ResearchWorkflowDesignEdge, "scopedPayload" | "expectedOutput" | "evidenceRequirement">> = {
  "knowledge-retrieval-agent": {
    scopedPayload:
      "Gather source/evidence candidates about decentralized agent marketplaces, x402 payment-gated APIs, agent attestations, and protocol limitations. Do not draft the article.",
    expectedOutput: "Source map with candidate claims, citations/evidence placeholders, and uncertainty notes.",
    evidenceRequirement: "Every major claim must have a source/caveat placeholder; unsupported claims must be labeled as hypotheses.",
  },
  "scientific-research-agent": {
    scopedPayload:
      "Synthesize retrieved evidence into a neutral thesis, outline, caveats, and claim hierarchy. Do not write marketing copy.",
    expectedOutput: "Research synthesis with thesis, outline, claim/evidence table, and limitations.",
    evidenceRequirement: "Claims must trace back to retrieval output or be marked as assumptions requiring verification.",
  },
  "content-creation-agent": {
    scopedPayload:
      "Turn the synthesis into a readable article draft while preserving citations/caveats and avoiding unsupported hype.",
    expectedOutput: "Article draft with headline, intro, sections, conclusion, and inline citation/caveat markers.",
    evidenceRequirement: "Draft must retain evidence markers and must not invent citations.",
  },
  "explainable-agent": {
    scopedPayload:
      "Review the draft for traceability, readability, reasoning gaps, and places where caveats should be clearer.",
    expectedOutput: "Explainability review with suggested edits and traceability notes.",
    evidenceRequirement: "Every flagged issue must reference a section or claim from the draft.",
  },
  "verification-validation-agent": {
    scopedPayload:
      "Verify the article evidence chain and return release/refund/dispute guidance for the research workflow.",
    expectedOutput: "Attestation verdict with release/refund/dispute recommendation and reasons.",
    evidenceRequirement: "Verdict must explicitly assess citation/caveat adequacy and scoped-payload compliance.",
  },
};

export function buildResearchWorkflowDesign(): ResearchWorkflowDesign {
  const plan = buildEconomicDemoDryRunPlan("research");
  return {
    schemaVersion: "reddi.economic-demo.research-workflow-design.v1",
    generatedAt: "2026-05-04T10:50:00.000Z",
    phase: "8A",
    scenarioId: "research",
    mode: "design_only_no_live_calls",
    userRequest: "Write me a research article on decentralized agent marketplaces and x402-paid specialist workflows.",
    orchestrator: {
      profileId: plan.orchestrator.id,
      endpoint: plan.orchestrator.endpoint,
      walletAddress: plan.orchestrator.walletAddress,
    },
    edges: plan.edges.map((edge, index) => {
      const scoped = scopedPayloadByProfile[edge.toProfileId];
      if (!scoped) throw new Error(`missing_research_scope:${edge.toProfileId}`);
      return {
        step: index + 1,
        profileId: edge.toProfileId,
        capability: edge.capability,
        endpoint: edge.endpoint,
        walletAddress: edge.walletAddress,
        priceUsdc: edge.price.amount,
        controlledDemoReceiptReadiness: "not_enabled_yet",
        ...scoped,
      };
    }),
    acceptanceCriteria: [
      "Research workflow remains design-only in Phase 8A: no live specialist calls and no Coolify/env mutation.",
      "Every specialist receives a scoped payload with clear boundaries and expected output.",
      "Final article path requires citations or explicit evidence caveats; fluent unsupported prose is not enough.",
      "Verification agent must produce release/refund/dispute guidance based on the evidence chain.",
      "Phase 8B may only begin after this design is reviewed and controlled receipt readiness is intentionally enabled for selected research path specialists.",
    ],
    guardrails: {
      noLiveCalls: true,
      noCoolifyMutation: true,
      noReceiptEnablementYet: true,
      citationsOrEvidenceCaveatsRequired: true,
      attestorReleaseRefundDisputeRequired: true,
    },
    retrospectiveQuestions: [
      "Are citations/evidence meaningful, or is the article just fluent text?",
      "Are specialist boundaries clear enough to prevent duplicated or invented work?",
      "Does this add a genuinely new proof category beyond the webpage workflow?",
      "Should Phase 8B proceed with controlled demo receipts, or should real receipt verification come first?",
    ],
    nextStep:
      "If this design passes review, prepare Phase 8B controlled research live x402 workflow smoke with exact endpoints, bounded calls, and evidence-caveat checks.",
  };
}
