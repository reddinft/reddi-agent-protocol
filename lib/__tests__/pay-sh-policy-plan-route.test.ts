jest.mock("@/lib/integrations/source-adapter/pay-sh-policy-plan", () => ({
  buildPayShPolicyPlan: jest.fn(),
}));

describe("Pay.sh policy-plan route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns a dry-run policy plan", async () => {
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");
    (buildPayShPolicyPlan as jest.Mock).mockReturnValue({
      ok: true,
      mode: "dry-run-paid-call-policy-plan",
      policy: { livePaymentAllowed: false, eligibleForFutureLivePayment: true },
      blockReasons: [],
    });

    const { POST } = await import("@/app/api/source-adapters/pay-sh/policy-plan/route");
    const res = await POST(
      new Request("http://localhost/api/source-adapters/pay-sh/policy-plan", {
        method: "POST",
        body: JSON.stringify({
          candidateId: "pay-sh:agentmail:email",
          task: "Send email",
          environment: "sandbox",
          endpointUrl: "https://agentmail.to/api/send",
          allowlistedEndpoints: ["https://agentmail.to/api/"],
          estimatedUsd: 0.05,
          spendCapUsd: 0.1,
          userApprovedLivePayment: true,
        }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(buildPayShPolicyPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: "pay-sh:agentmail:email",
        task: "Send email",
        environment: "sandbox",
        endpointUrl: "https://agentmail.to/api/send",
        allowlistedEndpoints: ["https://agentmail.to/api/"],
      })
    );
    expect(data.policy.livePaymentAllowed).toBe(false);
  });

  it("requires candidateId and task", async () => {
    const { POST } = await import("@/app/api/source-adapters/pay-sh/policy-plan/route");
    const res = await POST(
      new Request("http://localhost/api/source-adapters/pay-sh/policy-plan", {
        method: "POST",
        body: JSON.stringify({ candidateId: "pay-sh:agentmail:email" }),
      })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("candidateId and task");
  });
});
