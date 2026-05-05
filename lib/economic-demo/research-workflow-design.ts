import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";

export type ResearchWorkflowPayloadClass =
  | "source_map"
  | "research_synthesis"
  | "article_draft"
  | "explainability_review"
  | "verification_attestation";

export type ResearchWorkflowDisclosureLedgerExpectation = {
  requiredSchemaVersion: "reddi.downstream-disclosure-ledger.v1";
  x402State: "planned";
  disclosureScope: "planned_downstream_calls";
  downstreamCallsExecuted: 0;
  requiredFields: Array<
    | "calledAgentProfileId"
    | "calledAgentWalletAddress"
    | "calledAgentEndpoint"
    | "payloadSummary"
    | "payloadHash"
    | "x402State"
    | "attestorLinks"
    | "obfuscationReason"
  >;
};

export type ResearchWorkflowDesignEdge = {
  step: number;
  profileId: string;
  capability: string;
  endpoint: string;
  walletAddress: string;
  priceUsdc: string;
  payloadClass: ResearchWorkflowPayloadClass;
  scopedPayload: string;
  expectedOutput: string;
  evidenceRequirement: string;
  citationOrEvidenceCaveat: string;
  attestorCriteria: string[];
  refundOrDisputeBehavior: string;
  disclosureLedgerExpectation: ResearchWorkflowDisclosureLedgerExpectation;
  controlledDemoReceiptReadiness: "not_enabled_yet";
};

export type ResearchWorkflowDesign = {
  schemaVersion: "reddi.economic-demo.research-workflow-design.v2";
  generatedAt: string;
  phase: "5";
  scenarioId: "research";
  mode: "dry_run_no_live_calls";
  userRequest: string;
  downstreamCallsExecuted: 0;
  orchestrator: {
    profileId: string;
    endpoint: string;
    walletAddress: string;
    separationRationale: string;
  };
  edges: ResearchWorkflowDesignEdge[];
  acceptanceCriteria: string[];
  guardrails: {
    noLiveCalls: true;
    noPaidProviderRequests: true;
    noCoolifyMutation: true;
    noSigningOperations: true;
    noWalletMutation: true;
    noDevnetTransfer: true;
    noReceiptEnablementYet: true;
    citationsOrEvidenceCaveatsRequired: true;
    attestorReleaseRefundDisputeRequired: true;
  };
  retrospectiveQuestions: string[];
  nextStep: string;
};

type ResearchWorkflowScope = Pick<
  ResearchWorkflowDesignEdge,
  | "payloadClass"
  | "scopedPayload"
  | "expectedOutput"
  | "evidenceRequirement"
  | "citationOrEvidenceCaveat"
  | "attestorCriteria"
  | "refundOrDisputeBehavior"
>;

const requiredDisclosureFields: ResearchWorkflowDisclosureLedgerExpectation["requiredFields"] = [
  "calledAgentProfileId",
  "calledAgentWalletAddress",
  "calledAgentEndpoint",
  "payloadSummary",
  "payloadHash",
  "x402State",
  "attestorLinks",
  "obfuscationReason",
];

const scopedPayloadByProfile: Record<string, ResearchWorkflowScope> = {
  "knowledge-retrieval-agent": {
    payloadClass: "source_map",
    scopedPayload:
      "Gather source/evidence candidates about decentralized agent marketplaces, x402 payment-gated APIs, agent attestations, and protocol limitations. Do not draft the article.",
    expectedOutput: "Source map with candidate claims, citations/evidence placeholders, and uncertainty notes.",
    evidenceRequirement: "Every major claim must have a source/caveat placeholder; unsupported claims must be labeled as hypotheses.",
    citationOrEvidenceCaveat:
      "If a source is inaccessible or weak, return a caveat instead of inventing citation detail.",
    attestorCriteria: [
      "Sources are attributable or explicitly marked as missing.",
      "Claims are separated from hypotheses.",
      "No provider output or secrets are included raw.",
    ],
    refundOrDisputeBehavior:
      "Dispute if source map contains uncited factual claims or fabricated citation metadata.",
  },
  "scientific-research-agent": {
    payloadClass: "research_synthesis",
    scopedPayload:
      "Synthesize retrieved evidence into a neutral thesis, outline, caveats, and claim hierarchy. Do not write marketing copy.",
    expectedOutput: "Research synthesis with thesis, outline, claim/evidence table, and limitations.",
    evidenceRequirement: "Claims must trace back to retrieval output or be marked as assumptions requiring verification.",
    citationOrEvidenceCaveat:
      "Every synthesized claim carries either a source-map reference or an explicit 'needs verification' caveat.",
    attestorCriteria: [
      "Synthesis preserves uncertainty from retrieval.",
      "No unsupported claims are promoted to facts.",
      "Claim hierarchy distinguishes protocol facts from positioning.",
    ],
    refundOrDisputeBehavior:
      "Refund if synthesis drops material caveats or asserts unsupported protocol capabilities.",
  },
  "content-creation-agent": {
    payloadClass: "article_draft",
    scopedPayload:
      "Turn the synthesis into a readable article draft while preserving citations/caveats and avoiding unsupported hype.",
    expectedOutput: "Article draft with headline, intro, sections, conclusion, and inline citation/caveat markers.",
    evidenceRequirement: "Draft must retain evidence markers and must not invent citations.",
    citationOrEvidenceCaveat:
      "Any fluent narrative claim without a citation marker must be labeled as interpretation or removed.",
    attestorCriteria: [
      "Draft preserves citation/caveat markers.",
      "No fabricated citations or ungrounded numerical claims.",
      "Moat/marketing language does not hide payment or dependency disclosure.",
    ],
    refundOrDisputeBehavior:
      "Dispute if draft converts caveats into definitive claims or fabricates citations.",
  },
  "explainable-agent": {
    payloadClass: "explainability_review",
    scopedPayload:
      "Review the draft for traceability, readability, reasoning gaps, and places where caveats should be clearer.",
    expectedOutput: "Explainability review with suggested edits and traceability notes.",
    evidenceRequirement: "Every flagged issue must reference a section or claim from the draft.",
    citationOrEvidenceCaveat:
      "Flag any section whose evidence chain is opaque, incomplete, or dependent on obfuscated value-add.",
    attestorCriteria: [
      "Traceability gaps are tied to concrete draft sections.",
      "Obfuscation is limited to proprietary value-add, never called-agent identity or payment evidence.",
      "Recommended edits improve judge readability.",
    ],
    refundOrDisputeBehavior:
      "Dispute if explainability review cannot trace claims to source-map or synthesis inputs.",
  },
  "verification-validation-agent": {
    payloadClass: "verification_attestation",
    scopedPayload:
      "Verify the article evidence chain and return release/refund/dispute guidance for the research workflow.",
    expectedOutput: "Attestation verdict with release/refund/dispute recommendation and reasons.",
    evidenceRequirement: "Verdict must explicitly assess citation/caveat adequacy and scoped-payload compliance.",
    citationOrEvidenceCaveat:
      "Release requires citation/caveat adequacy; refund/dispute must identify exact failing claims or edges.",
    attestorCriteria: [
      "Verdict names release, refund, or dispute.",
      "Verdict checks every upstream payload class.",
      "Verdict confirms downstream ledger expectations are satisfied before live receipt promotion.",
    ],
    refundOrDisputeBehavior:
      "Release only if evidence chain is adequate; otherwise return refund/dispute with failing edge IDs.",
  },
};

function plannedDisclosureLedgerExpectation(): ResearchWorkflowDisclosureLedgerExpectation {
  return {
    requiredSchemaVersion: "reddi.downstream-disclosure-ledger.v1",
    x402State: "planned",
    disclosureScope: "planned_downstream_calls",
    downstreamCallsExecuted: 0,
    requiredFields: requiredDisclosureFields,
  };
}

export function buildResearchWorkflowDesign(): ResearchWorkflowDesign {
  const plan = buildEconomicDemoDryRunPlan("research");
  return {
    schemaVersion: "reddi.economic-demo.research-workflow-design.v2",
    generatedAt: "2026-05-05T02:40:00.000Z",
    phase: "5",
    scenarioId: "research",
    mode: "dry_run_no_live_calls",
    userRequest: "Write me a research article on decentralized agent marketplaces and x402-paid specialist workflows.",
    downstreamCallsExecuted: 0,
    orchestrator: {
      profileId: plan.orchestrator.id,
      endpoint: plan.orchestrator.endpoint,
      walletAddress: plan.orchestrator.walletAddress,
      separationRationale:
        "agentic-workflow-system coordinates the research graph so scientific-research-agent can remain a synthesis specialist instead of self-orchestrating its own paid edge.",
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
        disclosureLedgerExpectation: plannedDisclosureLedgerExpectation(),
        ...scoped,
      };
    }),
    acceptanceCriteria: [
      "Research workflow remains dry-run only in Phase 5: no live specialist calls, no paid provider requests, and no Coolify/env mutation.",
      "Every planned edge declares payload class, citation/evidence caveats, attestor criteria, refund/dispute behavior, and a planned downstream-disclosure ledger expectation.",
      "The orchestrator is separated from research synthesis unless a later retrospective justifies a self-loop.",
      "Final article path requires citations or explicit evidence caveats; fluent unsupported prose is not enough.",
      "Verification agent must produce release/refund/dispute guidance based on the evidence chain before any live receipt enablement.",
    ],
    guardrails: {
      noLiveCalls: true,
      noPaidProviderRequests: true,
      noCoolifyMutation: true,
      noSigningOperations: true,
      noWalletMutation: true,
      noDevnetTransfer: true,
      noReceiptEnablementYet: true,
      citationsOrEvidenceCaveatsRequired: true,
      attestorReleaseRefundDisputeRequired: true,
    },
    retrospectiveQuestions: [
      "Are citations/evidence meaningful, or is the article just fluent text?",
      "Are specialist boundaries clear enough to prevent duplicated or invented work?",
      "Does this add a genuinely new proof category beyond the webpage workflow?",
      "Does the planned disclosure ledger make payment/dependency transparency clear before live calls?",
      "Should the next validation stay local Surfpool-only, or request separate approval for hosted/devnet controlled receipts?",
    ],
    nextStep:
      "Implement a no-live-call research dry-run artifact generator that serializes this graph, then optionally rehearse local Surfpool transfer semantics before any hosted/devnet live workflow.",
  };
}
