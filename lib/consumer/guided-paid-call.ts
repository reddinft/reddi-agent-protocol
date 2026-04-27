export type ConsumerGuidedPolicy = {
  requiredPrivacyMode: "public" | "per" | "vanish";
  requiresHealthPass: boolean;
  requiresAttested: boolean;
  maxPerCallUsd?: number;
  preferredWallet?: string;
};

export type ConsumerPolicySummary = {
  status: "ready" | "needs_selection" | "blocked";
  maxSpendLabel: string;
  privacyLabel: string;
  attestationLabel: string;
  nextAction: string;
  safeguards: string[];
};

export type ConsumerReceiptSummary = {
  status: "paid" | "blocked" | "failed";
  txSignature: string | null;
  nonce: string | null;
  specialistWallet: string | null;
  amountLabel: string;
  promptStorage: "sha256_only";
  message: string;
};

export function summarizeConsumerPolicy(policy: ConsumerGuidedPolicy): ConsumerPolicySummary {
  const maxSpendLabel = policy.maxPerCallUsd === undefined ? "Protocol/default budget" : `$${policy.maxPerCallUsd.toFixed(4)} max`;
  const privacyLabel = policy.requiredPrivacyMode === "per" ? "Private PER mode" : policy.requiredPrivacyMode === "vanish" ? "Vanish/no-retention mode" : "Public mode";
  const attestationLabel = policy.requiresAttested ? "Attested specialists only" : "Attestation optional";

  if (!policy.preferredWallet) {
    return {
      status: "needs_selection",
      maxSpendLabel,
      privacyLabel,
      attestationLabel,
      nextAction: "Select a resolved specialist before executing the paid call.",
      safeguards: [
        "Healthcheck pass is required before invocation.",
        "First response must be HTTP 402 + x402-request before any completion is accepted.",
      ],
    };
  }

  if (policy.maxPerCallUsd !== undefined && policy.maxPerCallUsd <= 0) {
    return {
      status: "blocked",
      maxSpendLabel,
      privacyLabel,
      attestationLabel,
      nextAction: "Set a max spend greater than $0 before execution.",
      safeguards: ["No paid call will start with an invalid spend cap."],
    };
  }

  return {
    status: "ready",
    maxSpendLabel,
    privacyLabel,
    attestationLabel,
    nextAction: "Execute only after reviewing specialist, budget, privacy, and attestation policy.",
    safeguards: [
      "Healthcheck pass is required before invocation.",
      "Unpaid 200 completions are refused as bypass risk.",
      "Receipt stores tx/nonce and prompt hash; raw prompt is not required for audit.",
    ],
  };
}

export function summarizeConsumerReceipt(run: {
  status: "completed" | "failed";
  paymentSatisfied: boolean;
  paymentAttempted: boolean;
  selectedWallet?: string;
  x402TxSignature?: string;
  x402ReceiptNonce?: string;
  error?: string;
}, maxPerCallUsd?: number): ConsumerReceiptSummary {
  if (run.status === "completed" && run.paymentSatisfied) {
    return {
      status: "paid",
      txSignature: run.x402TxSignature ?? null,
      nonce: run.x402ReceiptNonce ?? null,
      specialistWallet: run.selectedWallet ?? null,
      amountLabel: maxPerCallUsd === undefined ? "Within protocol/default budget" : `≤ $${maxPerCallUsd.toFixed(4)}`,
      promptStorage: "sha256_only",
      message: "Paid x402 retry completed; receipt is safe to show without raw prompt storage.",
    };
  }

  if (run.error?.toLowerCase().includes("without an x402 challenge")) {
    return {
      status: "blocked",
      txSignature: null,
      nonce: null,
      specialistWallet: run.selectedWallet ?? null,
      amountLabel: "No payment accepted",
      promptStorage: "sha256_only",
      message: "Specialist returned an unpaid completion. The consumer flow failed closed and did not accept it as success.",
    };
  }

  return {
    status: "failed",
    txSignature: run.x402TxSignature ?? null,
    nonce: run.x402ReceiptNonce ?? null,
    specialistWallet: run.selectedWallet ?? null,
    amountLabel: run.paymentAttempted ? "Payment attempted" : "No payment accepted",
    promptStorage: "sha256_only",
    message: run.error ?? "Specialist call did not complete.",
  };
}
