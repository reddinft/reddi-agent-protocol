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
    lastAttemptStatus: number;
    lastAttemptErrorCode?: "demo_payment_disabled" | "http_502" | "unknown";
    paymentSatisfied: boolean;
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
    operationalChange?: string;
  };
  nextOptions: Array<{
    id: "multi_edge_webpage_workflow" | "real_devnet_receipt_verifier";
    label: string;
    tradeoff: string;
  }>;
};

export function getEconomicDemoPaymentReadiness(): EconomicDemoPaymentReadiness {
  return {
    mode: "live_x402_payment_readiness",
    profileId: "code-generation-agent",
    endpoint: "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
    status: "ready",
    liveChallenge: {
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    },
    paidCompletion: {
      reached: true,
      lastAttemptStatus: 200,
      paymentSatisfied: true,
    },
    guardrails: {
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    },
    evidence: {
      generatedAt: "2026-05-04T09:00:02.570Z",
      localArtifactPath: "artifacts/economic-demo-live-x402-readiness/20260504T085951Z/summary.json",
      pr: "https://github.com/nissan/reddi-agent-protocol/pull/195",
      operationalChange: "Controlled demo receipts enabled for the hosted code-generation specialist in Coolify; code-generation model slug corrected from unavailable anthropic/claude-3.5-sonnet to openai/gpt-4.1-mini.",
    },
    nextOptions: [
      {
        id: "multi_edge_webpage_workflow",
        label: "Promote the webpage path from single paid edge to multi-edge economic workflow",
        tradeoff: "Fastest judge-facing proof now that the first controlled paid completion reaches HTTP 200; still label receipts as controlled demo receipts until real settlement verification lands.",
      },
      {
        id: "real_devnet_receipt_verifier",
        label: "Implement real devnet receipt verification",
        tradeoff: "Stronger protocol proof; takes longer because the runtime must verify paid receipt semantics before OpenRouter execution.",
      },
    ],
  };
}
