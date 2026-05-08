import { createHash, randomUUID } from "node:crypto";

import {
  economicDemoScenarios,
  type EconomicDemoScenarioId,
} from "@/lib/economic-demo/fixture";
import {
  getDisclosureLedgerEvidenceStatus,
  type WebpageLiveWorkflowEvidence,
} from "@/lib/economic-demo/webpage-live-workflow-evidence";
import { getWebpageLiveWorkflowEvidence } from "@/lib/economic-demo/webpage-live-workflow-evidence-server";

export const ECONOMIC_DEMO_LIVE_RUN_SCHEMA_VERSION =
  "reddi.economic-demo.controlled-live-run.v1" as const;
export const ECONOMIC_DEMO_LIVE_RUN_MAX_PROMPT_CHARS = 800;

export type EconomicDemoLiveRunMode = "controlled_hosted_evidence";

export type EconomicDemoLiveRunRequest = {
  scenarioId?: EconomicDemoScenarioId;
  prompt?: string;
  mode?: EconomicDemoLiveRunMode;
  clientRunNonce?: string;
};

export type EconomicDemoLiveRunTimelineStep = {
  id:
    | "prompt_hash_created"
    | "specialists_selected"
    | "x402_challenges_observed"
    | "controlled_receipts_satisfied"
    | "outputs_returned"
    | "attestor_verdict_returned"
    | "evidence_pack_attached";
  label: string;
  status: "complete";
  timestamp: string;
  detail: string;
};

export type EconomicDemoLiveRun = {
  schemaVersion: typeof ECONOMIC_DEMO_LIVE_RUN_SCHEMA_VERSION;
  runId: string;
  generatedAt: string;
  mode: EconomicDemoLiveRunMode;
  scenarioId: EconomicDemoScenarioId;
  prompt: string;
  promptHash: string;
  clientRunNonce: string | null;
  selectedSpecialists: Array<{
    step: number;
    profileId: string;
    capability: string;
    endpoint: string;
    challengeStatus: 402;
    completionStatus: 200;
    outputPreview: string;
  }>;
  timeline: EconomicDemoLiveRunTimelineStep[];
  output: {
    type: "webpage" | "article" | "image-brief";
    summary: string;
    previews: string[];
  };
  evidence: WebpageLiveWorkflowEvidence;
  disclosureLedger: ReturnType<typeof getDisclosureLedgerEvidenceStatus>;
  guardrails: {
    exactAllowlistedEndpointsOnly: true;
    noSignerMaterialUsed: true;
    noSignatureAttemptedByRoute: true;
    noDevnetTransferFromRoute: true;
    noPaidProviderCallFromRoute: true;
    controlledDemoReceiptsOnly: true;
    noProductionSettlementClaim: true;
  };
  claimBoundary: string;
};

function hashPrompt(prompt: string) {
  return `sha256:${createHash("sha256").update(prompt).digest("hex")}`;
}

function sanitizePrompt(prompt: unknown, fallback: string) {
  if (typeof prompt !== "string") return fallback;
  const trimmed = prompt.trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, ECONOMIC_DEMO_LIVE_RUN_MAX_PROMPT_CHARS);
}

function scenarioFor(id: unknown) {
  if (typeof id === "string") {
    const found = economicDemoScenarios.find((scenario) => scenario.id === id);
    if (found) return found;
  }
  return economicDemoScenarios[0];
}

export function buildEconomicDemoLiveRun(
  request: EconomicDemoLiveRunRequest = {},
): EconomicDemoLiveRun {
  const scenario = scenarioFor(request.scenarioId);
  const prompt = sanitizePrompt(request.prompt, scenario.prompt);
  const generatedAt = new Date().toISOString();
  const evidence = getWebpageLiveWorkflowEvidence();
  const disclosureLedger = getDisclosureLedgerEvidenceStatus(
    evidence.disclosureLedgerSummary,
  );
  const selectedSpecialists = evidence.edges.map((edge) => ({
    step: edge.step,
    profileId: edge.profileId,
    capability: edge.capability,
    endpoint: edge.endpoint,
    challengeStatus: edge.unpaidChallenge.status,
    completionStatus: edge.paidCompletion.status,
    outputPreview: edge.paidCompletion.outputPreview,
  }));

  const timeline: EconomicDemoLiveRunTimelineStep[] = [
    {
      id: "prompt_hash_created",
      label: "Prompt hash created",
      status: "complete",
      timestamp: generatedAt,
      detail: hashPrompt(prompt),
    },
    {
      id: "specialists_selected",
      label: "Specialists selected",
      status: "complete",
      timestamp: generatedAt,
      detail: selectedSpecialists.map((edge) => edge.profileId).join(" → "),
    },
    {
      id: "x402_challenges_observed",
      label: "x402 challenges observed",
      status: "complete",
      timestamp: generatedAt,
      detail: `${selectedSpecialists.length} allowlisted hosted specialist endpoints returned recorded HTTP 402 challenge evidence.`,
    },
    {
      id: "controlled_receipts_satisfied",
      label: "Controlled receipts satisfied",
      status: "complete",
      timestamp: generatedAt,
      detail:
        "Controlled demo receipts reached paid completions in the evidence pack; this is not production settlement.",
    },
    {
      id: "outputs_returned",
      label: "Specialist outputs returned",
      status: "complete",
      timestamp: generatedAt,
      detail: `${selectedSpecialists.length} output previews attached for the judge-facing run envelope.`,
    },
    {
      id: "attestor_verdict_returned",
      label: "Attestor verdict returned",
      status: "complete",
      timestamp: generatedAt,
      detail:
        evidence.edges.at(-1)?.paidCompletion.outputPreview ??
        "Verification specialist returned release guidance.",
    },
    {
      id: "evidence_pack_attached",
      label: "Evidence pack attached",
      status: "complete",
      timestamp: generatedAt,
      detail:
        evidence.latestEvidencePack?.artifactPath ??
        evidence.sourceArtifactPath,
    },
  ];

  return {
    schemaVersion: ECONOMIC_DEMO_LIVE_RUN_SCHEMA_VERSION,
    runId: `economic-demo-${randomUUID()}`,
    generatedAt,
    mode: request.mode ?? "controlled_hosted_evidence",
    scenarioId: scenario.id,
    prompt,
    promptHash: hashPrompt(prompt),
    clientRunNonce:
      typeof request.clientRunNonce === "string"
        ? request.clientRunNonce.slice(0, 120)
        : null,
    selectedSpecialists,
    timeline,
    output: {
      type: scenario.finalOutputType,
      summary: scenario.finalOutputSummary,
      previews: selectedSpecialists.map((edge) => edge.outputPreview),
    },
    evidence,
    disclosureLedger,
    guardrails: {
      exactAllowlistedEndpointsOnly: true,
      noSignerMaterialUsed: true,
      noSignatureAttemptedByRoute: true,
      noDevnetTransferFromRoute: true,
      noPaidProviderCallFromRoute: true,
      controlledDemoReceiptsOnly: true,
      noProductionSettlementClaim: true,
    },
    claimBoundary:
      "Controlled hosted evidence run: no signer material, no devnet/mainnet transfer, no paid provider call, and no production settlement claim. Historical evidence is labeled separately from fresh route execution.",
  };
}
