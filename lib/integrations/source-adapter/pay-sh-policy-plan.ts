import { buildPayShQuotePreview } from "@/lib/integrations/source-adapter/pay-sh-quote-preview";

export type PayShPolicyPlanInput = {
  candidateId: string;
  task: string;
  endpointUrl?: string;
  toolName?: string;
  estimatedUsd?: number;
  spendCapUsd?: number;
  userApprovedLivePayment?: boolean;
  allowlistedEndpoints?: string[];
  requireReceiptCapture?: boolean;
  requireAttestation?: boolean;
};

export type PayShPolicyBlockReason =
  | "candidate_not_found"
  | "tool_not_allowed_for_live_payment"
  | "endpoint_missing"
  | "endpoint_not_allowlisted"
  | "user_approval_missing"
  | "spend_cap_missing"
  | "estimated_cost_exceeds_spend_cap"
  | "receipt_capture_required"
  | "attestation_required";

export type PayShPolicyPlan = {
  ok: boolean;
  mode: "dry-run-paid-call-policy-plan";
  candidateId: string;
  task: string;
  candidate: ReturnType<typeof buildPayShQuotePreview>["candidate"];
  requestedAction: {
    toolName: string;
    endpointUrl: string | null;
    estimatedUsd: number | null;
    spendCapUsd: number | null;
  };
  policy: {
    source: "pay-sh";
    network: "solana";
    currency: "USDC";
    livePaymentAllowed: false;
    eligibleForFutureLivePayment: boolean;
    strictSourceMatch: true;
    allowlistRequired: true;
    userApprovalRequired: true;
    spendCapRequired: true;
    receiptCaptureRequired: true;
    attestationRequired: true;
    maxRecommendedDryRunCapUsd: 1;
  };
  gates: Array<{
    id: string;
    passed: boolean;
    required: boolean;
    detail: string;
  }>;
  blockReasons: PayShPolicyBlockReason[];
  executionBoundary: string;
};

const LIVE_PAYMENT_TOOL_ALLOWLIST = new Set(["curl"]);

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = "";
    return url.toString();
  } catch {
    return value.trim();
  }
}

function endpointIsAllowlisted(endpointUrl: string | undefined, allowlistedEndpoints: string[] | undefined) {
  if (!endpointUrl || !allowlistedEndpoints?.length) return false;
  const normalizedEndpoint = normalizeUrl(endpointUrl);
  return allowlistedEndpoints.some((allowed) => normalizedEndpoint.startsWith(normalizeUrl(allowed)));
}

export function buildPayShPolicyPlan(input: PayShPolicyPlanInput): PayShPolicyPlan {
  const quote = buildPayShQuotePreview({ candidateId: input.candidateId, task: input.task });
  const toolName = input.toolName ?? "curl";
  const endpointUrl = input.endpointUrl?.trim() || null;
  const estimatedUsd = typeof input.estimatedUsd === "number" ? Math.max(0, input.estimatedUsd) : null;
  const spendCapUsd = typeof input.spendCapUsd === "number" ? Math.max(0, input.spendCapUsd) : null;
  const receiptCaptureRequired = input.requireReceiptCapture !== false;
  const attestationRequired = input.requireAttestation !== false;

  const gates = [
    {
      id: "candidate_found",
      passed: quote.ok && quote.candidate !== null,
      required: true,
      detail: quote.ok ? "Pay.sh candidate metadata found." : quote.error ?? "Pay.sh candidate not found.",
    },
    {
      id: "tool_allowed",
      passed: LIVE_PAYMENT_TOOL_ALLOWLIST.has(toolName),
      required: true,
      detail: LIVE_PAYMENT_TOOL_ALLOWLIST.has(toolName)
        ? `${toolName} is the only Pay.sh MCP tool eligible for future paid HTTP invocation.`
        : `${toolName} is not eligible for future live payment invocation.`,
    },
    {
      id: "endpoint_present",
      passed: endpointUrl !== null,
      required: true,
      detail: endpointUrl ? "Endpoint URL supplied." : "Endpoint URL is required before any future live payment.",
    },
    {
      id: "endpoint_allowlisted",
      passed: endpointIsAllowlisted(endpointUrl ?? undefined, input.allowlistedEndpoints),
      required: true,
      detail: endpointUrl
        ? "Endpoint must match an explicit allowlist entry before future live payment."
        : "Cannot evaluate allowlist until endpoint is supplied.",
    },
    {
      id: "user_approval",
      passed: input.userApprovedLivePayment === true,
      required: true,
      detail: "Explicit user approval is required for each future live Pay.sh payment experiment.",
    },
    {
      id: "spend_cap_present",
      passed: spendCapUsd !== null && spendCapUsd > 0 && spendCapUsd <= 1,
      required: true,
      detail: "A tiny spend cap between $0 and $1 USD is required for the first live experiment.",
    },
    {
      id: "estimated_cost_within_cap",
      passed: estimatedUsd !== null && spendCapUsd !== null && estimatedUsd <= spendCapUsd,
      required: true,
      detail: "Estimated cost must be present and less than or equal to the spend cap.",
    },
    {
      id: "receipt_capture",
      passed: receiptCaptureRequired,
      required: true,
      detail: "Receipt/x402/MPP proof capture must stay enabled.",
    },
    {
      id: "attestation",
      passed: attestationRequired,
      required: true,
      detail: "RAP attestation must verify output, receipt, and disclosure before trust credit.",
    },
  ];

  const blockReasons: PayShPolicyBlockReason[] = [];
  if (!gates.find((gate) => gate.id === "candidate_found")?.passed) blockReasons.push("candidate_not_found");
  if (!gates.find((gate) => gate.id === "tool_allowed")?.passed) blockReasons.push("tool_not_allowed_for_live_payment");
  if (!gates.find((gate) => gate.id === "endpoint_present")?.passed) blockReasons.push("endpoint_missing");
  if (!gates.find((gate) => gate.id === "endpoint_allowlisted")?.passed) blockReasons.push("endpoint_not_allowlisted");
  if (!gates.find((gate) => gate.id === "user_approval")?.passed) blockReasons.push("user_approval_missing");
  if (!gates.find((gate) => gate.id === "spend_cap_present")?.passed) blockReasons.push("spend_cap_missing");
  if (!gates.find((gate) => gate.id === "estimated_cost_within_cap")?.passed) blockReasons.push("estimated_cost_exceeds_spend_cap");
  if (!gates.find((gate) => gate.id === "receipt_capture")?.passed) blockReasons.push("receipt_capture_required");
  if (!gates.find((gate) => gate.id === "attestation")?.passed) blockReasons.push("attestation_required");

  const eligibleForFutureLivePayment = blockReasons.length === 0;

  return {
    ok: quote.ok,
    mode: "dry-run-paid-call-policy-plan",
    candidateId: input.candidateId,
    task: input.task,
    candidate: quote.candidate,
    requestedAction: {
      toolName,
      endpointUrl,
      estimatedUsd,
      spendCapUsd,
    },
    policy: {
      source: "pay-sh",
      network: "solana",
      currency: "USDC",
      livePaymentAllowed: false,
      eligibleForFutureLivePayment,
      strictSourceMatch: true,
      allowlistRequired: true,
      userApprovalRequired: true,
      spendCapRequired: true,
      receiptCaptureRequired: true,
      attestationRequired: true,
      maxRecommendedDryRunCapUsd: 1,
    },
    gates,
    blockReasons,
    executionBoundary:
      "Dry-run policy planning only. RAP does not run pay setup, pay topup, pay mcp, create wallets, make paid calls, invoke providers, or store secrets from this plan.",
  };
}
