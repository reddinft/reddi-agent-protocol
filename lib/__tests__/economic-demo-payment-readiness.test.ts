import { getEconomicDemoPaymentReadiness } from "@/lib/economic-demo/payment-readiness";

describe("economic demo payment readiness", () => {
  it("records the controlled paid-completion success without triggering live retries", () => {
    const readiness = getEconomicDemoPaymentReadiness();

    expect(readiness.status).toBe("ready");
    expect(readiness.blocker).toBeUndefined();
    expect(readiness.liveChallenge).toMatchObject({
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    });
    expect(readiness.paidCompletion).toMatchObject({
      reached: true,
      lastAttemptStatus: 200,
      paymentSatisfied: true,
    });
    expect(readiness.guardrails).toMatchObject({
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    });
    expect(readiness.evidence.localArtifactPath).toContain("20260504T085951Z");
  });
});
