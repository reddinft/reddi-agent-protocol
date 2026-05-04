import { getEconomicDemoPaymentReadiness } from "@/lib/economic-demo/payment-readiness";

describe("economic demo payment readiness", () => {
  it("records the current paid-completion blocker without triggering live retries", () => {
    const readiness = getEconomicDemoPaymentReadiness();

    expect(readiness.status).toBe("blocked");
    expect(readiness.blocker).toBe("demo_payment_disabled");
    expect(readiness.liveChallenge).toMatchObject({
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    });
    expect(readiness.paidCompletion).toMatchObject({
      reached: false,
      lastAttemptStatus: 402,
      lastAttemptErrorCode: "demo_payment_disabled",
    });
    expect(readiness.guardrails).toMatchObject({
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    });
  });
});
