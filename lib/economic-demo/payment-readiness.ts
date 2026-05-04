export type EconomicDemoPaymentReadiness = {
  mode: "live_x402_payment_readiness";
  profileId: "code-generation-agent";
  endpoint: string;
  status: "blocked" | "ready";
  blocker?: "demo_payment_disabled" | "real_receipt_verifier_unavailable" | "unknown";
  liveChallenge: {
    reachable: boolean;
    network: "solana-devnet";
    payTo: string;
    amount: string;
    currency: string;
    nonceObserved: boolean;
  };
  paidCompletion: {
    reached: boolean;
    lastAttemptStatus: 402;
    lastAttemptErrorCode: "demo_payment_disabled";
  };
  guardrails: {
    noAutomaticLiveRetry: true;
    noSignerMaterialInProbe: true;
    noDevnetTransferFromProbe: true;
    maxProbeCalls: 2;
  };
  evidence: {
    generatedAt: string;
    localArtifactPath: string;
    pr?: string;
  };
  nextOptions: Array<{
    id: "controlled_demo_receipts" | "real_devnet_receipt_verifier";
    label: string;
    tradeoff: string;
  }>;
};

export function getEconomicDemoPaymentReadiness(): EconomicDemoPaymentReadiness {
  return {
    mode: "live_x402_payment_readiness",
    profileId: "code-generation-agent",
    endpoint: "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
    status: "blocked",
    blocker: "demo_payment_disabled",
    liveChallenge: {
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    },
    paidCompletion: {
      reached: false,
      lastAttemptStatus: 402,
      lastAttemptErrorCode: "demo_payment_disabled",
    },
    guardrails: {
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    },
    evidence: {
      generatedAt: "2026-05-04T08:12:23.130Z",
      localArtifactPath: "artifacts/economic-demo-live-x402-readiness/20260504T081222Z/summary.json",
      pr: "https://github.com/nissan/reddi-agent-protocol/pull/193",
    },
    nextOptions: [
      {
        id: "controlled_demo_receipts",
        label: "Enable controlled demo receipts for the judge deployment",
        tradeoff: "Fastest judge-facing path; must be visibly labeled as demo receipt verification, not production settlement.",
      },
      {
        id: "real_devnet_receipt_verifier",
        label: "Implement real devnet receipt verification",
        tradeoff: "Stronger protocol proof; takes longer because the runtime must verify paid receipt semantics before OpenRouter execution.",
      },
    ],
  };
}
