import type { LiveDelegationExecutorEvidence } from "./delegation-executor.js";
import type { LiveDelegationIntentPlan } from "./delegation-intent.js";
import type { SpecialistProfile, SpecialistPrice } from "./types.js";

export interface AgentDependencyManifestDisclosure {
  schemaVersion: "reddi.agent-dependency-manifest.v1";
  tools: string[];
  skills: string[];
  marketplaceAgentCalls: string[];
  externalMcpServers: string[];
  nonMarketplaceAgentCalls: string[];
  disclosurePolicy: string;
}

export interface AgenticWorkflowManifestDisclosure {
  schemaVersion: "reddi.agentic-workflow-disclosure.v1";
  mayCallMarketplaceAgents: boolean;
  disclosureRequiredBeforePurchase: true;
  expectedDownstreamCapabilities: string[];
  budgetPolicy: {
    spendGuardRequired: boolean;
    maxDownstreamCalls?: number;
    maxDownstreamLamports?: number;
    liveCallsEnabled: boolean;
  };
  attestorExpectations: {
    preferredAttestors: string[];
    attestationRequiredForDelegatedOutputs: boolean;
  };
  payloadDisclosurePolicy: {
    mustDiscloseCalledAgentIdentity: true;
    mustDisclosePayloadSummaryOrHash: true;
    mustDisclosePaymentEvidence: true;
    mustDiscloseAttestationLinks: true;
    returnedValueAddMayBeObfuscatedForMoatProtection: true;
    obfuscationReasonRequired: true;
  };
}

export interface DownstreamDisclosureLedgerEntry {
  schemaVersion: "reddi.downstream-disclosure-ledger-entry.v1";
  calledProfileId: string;
  endpoint?: string;
  walletAddress?: string;
  payloadSummary: string;
  payloadHash?: string;
  x402: {
    amount?: string;
    currency?: SpecialistPrice["currency"];
    challengeOrReceiptState: "not_attempted" | "challenge_observed" | "controlled_demo_paid" | "real_settlement_verified" | "failed_closed";
    evidenceRef?: string;
  };
  attestorLinks: string[];
  obfuscation?: {
    returnedDetailsObfuscated: boolean;
    reason?: "moat_protection";
  };
}

export interface DownstreamDisclosureLedger {
  schemaVersion: "reddi.downstream-disclosure-ledger.v1";
  disclosureScope: "no_downstream_calls" | "planned_downstream_calls" | "attempted_downstream_calls";
  entries: DownstreamDisclosureLedgerEntry[];
  transparencyGuarantees: string[];
}

export function buildAgenticWorkflowManifestDisclosure(profile: SpecialistProfile, config: { enableAgentToAgentCalls?: boolean; maxDownstreamCalls?: number; maxDownstreamLamports?: number }): AgenticWorkflowManifestDisclosure {
  const mayCallMarketplaceAgents = profile.roles.includes("consumer");
  return {
    schemaVersion: "reddi.agentic-workflow-disclosure.v1",
    mayCallMarketplaceAgents,
    disclosureRequiredBeforePurchase: true,
    expectedDownstreamCapabilities: mayCallMarketplaceAgents ? downstreamCapabilitiesFor(profile) : [],
    budgetPolicy: {
      spendGuardRequired: mayCallMarketplaceAgents,
      maxDownstreamCalls: config.maxDownstreamCalls,
      maxDownstreamLamports: config.maxDownstreamLamports,
      liveCallsEnabled: config.enableAgentToAgentCalls === true,
    },
    attestorExpectations: {
      preferredAttestors: profile.preferredAttestors,
      attestationRequiredForDelegatedOutputs: mayCallMarketplaceAgents,
    },
    payloadDisclosurePolicy: {
      mustDiscloseCalledAgentIdentity: true,
      mustDisclosePayloadSummaryOrHash: true,
      mustDisclosePaymentEvidence: true,
      mustDiscloseAttestationLinks: true,
      returnedValueAddMayBeObfuscatedForMoatProtection: true,
      obfuscationReasonRequired: true,
    },
  };
}

export function buildAgentDependencyManifestDisclosure(profile: SpecialistProfile): AgentDependencyManifestDisclosure {
  const capabilities = profile.capabilities.map((capability) => capability.toLowerCase());
  return {
    schemaVersion: "reddi.agent-dependency-manifest.v1",
    tools: toolsFor(profile, capabilities),
    skills: skillsFor(profile, capabilities),
    marketplaceAgentCalls: marketplaceAgentCallsFor(profile),
    externalMcpServers: externalMcpServersFor(capabilities),
    nonMarketplaceAgentCalls: nonMarketplaceAgentCallsFor(profile, capabilities),
    disclosurePolicy:
      "Public manifest discloses tool, skill, MCP, marketplace-agent, and non-marketplace-agent dependencies before purchase. Paid responses must return reddi.downstream-disclosure-ledger.v1 for attempted downstream calls.",
  };
}

export function buildNoDownstreamDisclosureLedger(): DownstreamDisclosureLedger {
  return {
    schemaVersion: "reddi.downstream-disclosure-ledger.v1",
    disclosureScope: "no_downstream_calls",
    entries: [],
    transparencyGuarantees: transparencyGuarantees(),
  };
}

export function buildDownstreamDisclosureLedger(input: { intentPlan: LiveDelegationIntentPlan; executorEvidence: LiveDelegationExecutorEvidence }): DownstreamDisclosureLedger {
  const selected = input.intentPlan.selectedCandidate;
  if (!selected) return buildNoDownstreamDisclosureLedger();
  const attempted = input.executorEvidence.downstreamCallsExecuted > 0;
  return {
    schemaVersion: "reddi.downstream-disclosure-ledger.v1",
    disclosureScope: attempted ? "attempted_downstream_calls" : "planned_downstream_calls",
    entries: [
      {
        schemaVersion: "reddi.downstream-disclosure-ledger-entry.v1",
        calledProfileId: selected.profileId,
        endpoint: input.executorEvidence.target?.endpoint ?? selected.endpointPath,
        walletAddress: input.executorEvidence.target?.walletAddress ?? selected.walletAddress,
        payloadSummary: summarizePayload(input.intentPlan.task),
        x402: {
          amount: selected.price.amount,
          currency: selected.price.currency,
          challengeOrReceiptState: classifyEvidence(input.executorEvidence),
          evidenceRef: input.executorEvidence.auditEnvelopeHash,
        },
        attestorLinks: input.intentPlan.requiredAttestor ? [input.intentPlan.requiredAttestor] : [],
        obfuscation: {
          returnedDetailsObfuscated: attempted,
          reason: attempted ? "moat_protection" : undefined,
        },
      },
    ],
    transparencyGuarantees: transparencyGuarantees(),
  };
}

function downstreamCapabilitiesFor(profile: SpecialistProfile): string[] {
  return [...new Set([...profile.capabilities, "marketplace-discovery", "x402-payment", "delegated-attestation"])].sort();
}

function toolsFor(profile: SpecialistProfile, capabilities: string[]): string[] {
  const tools = new Set<string>(["chat_completion"]);
  if (profile.roles.includes("consumer")) tools.add("marketplace_discovery");
  if (profile.roles.includes("consumer")) tools.add("x402_specialist_call");
  if (profile.roles.includes("attestor")) tools.add("receipt_review");
  if (profile.roles.includes("attestor")) tools.add("evidence_checks");
  if (capabilities.some((capability) => /document|evidence|classification|summarization/.test(capability))) tools.add("document_parser");
  if (capabilities.some((capability) => /code|debug|test/.test(capability))) tools.add("code_review_workspace");
  return [...tools];
}

function skillsFor(profile: SpecialistProfile, capabilities: string[]): string[] {
  return [...new Set([...profile.tags, ...capabilities])];
}

function marketplaceAgentCallsFor(profile: SpecialistProfile): string[] {
  return [...new Set(profile.preferredAttestors)];
}

function externalMcpServersFor(capabilities: string[]): string[] {
  const servers = new Set<string>();
  if (capabilities.some((capability) => /document|evidence|classification|summarization/.test(capability))) {
    servers.add("reddi.document-context-mcp");
  }
  if (capabilities.some((capability) => /code|debug|test/.test(capability))) {
    servers.add("reddi.code-workspace-mcp");
  }
  return [...servers];
}

function nonMarketplaceAgentCallsFor(profile: SpecialistProfile, capabilities: string[]): string[] {
  const calls = new Set<string>();
  if (profile.model) calls.add(`openrouter:${profile.model}`);
  if (capabilities.some((capability) => /document|evidence|classification|summarization/.test(capability))) {
    calls.add("non-marketplace:document-parser");
  }
  if (capabilities.some((capability) => /code|debug|test/.test(capability))) {
    calls.add("non-marketplace:static-analysis-worker");
  }
  return [...calls];
}

function summarizePayload(task: string): string {
  const normalized = task.replace(/\s+/g, " ").trim();
  if (!normalized) return "Downstream task payload was empty or omitted.";
  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized;
}

function classifyEvidence(evidence: LiveDelegationExecutorEvidence): DownstreamDisclosureLedgerEntry["x402"]["challengeOrReceiptState"] {
  if (evidence.downstreamCallsExecuted === 0) return evidence.executionStatus === "not_executed" ? "not_attempted" : "failed_closed";
  if (evidence.downstreamResponse?.status === 200) return "controlled_demo_paid";
  if (evidence.downstreamResponse?.status === 402) return "challenge_observed";
  return "failed_closed";
}

function transparencyGuarantees(): string[] {
  return [
    "called-agent identity is disclosed",
    "payload summary or hash is disclosed",
    "payment/challenge/receipt state is disclosed",
    "attestor links are disclosed",
    "proprietary returned value-add may be obfuscated only with an explicit moat_protection reason",
  ];
}
