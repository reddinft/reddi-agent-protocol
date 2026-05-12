jest.mock("@/lib/integrations/source-adapter/pay-sh-quote-preview", () => ({
  buildPayShQuotePreview: jest.fn(),
}));

describe("Pay.sh dry-run paid-call policy plan", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  async function mockCandidate(ok = true) {
    const { buildPayShQuotePreview } = await import("@/lib/integrations/source-adapter/pay-sh-quote-preview");
    (buildPayShQuotePreview as jest.Mock).mockReturnValue(
      ok
        ? {
            ok: true,
            candidate: {
              candidateId: "pay-sh:agentmail:email",
              providerName: "AgentMail",
              pricing: { currency: "USDC", network: "solana", minUsd: 0.01, maxUsd: 0.25 },
            },
          }
        : { ok: false, candidate: null, error: "not found" }
    );
  }

  it("keeps live payment disabled even when future-live gates pass", async () => {
    await mockCandidate(true);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:agentmail:email",
      task: "Send a test email",
      endpointUrl: "https://agentmail.to/api/send",
      allowlistedEndpoints: ["https://agentmail.to/api/"],
      estimatedUsd: 0.05,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.ok).toBe(true);
    expect(plan.mode).toBe("dry-run-paid-call-policy-plan");
    expect(plan.policy.livePaymentAllowed).toBe(false);
    expect(plan.policy.eligibleForFutureLivePayment).toBe(true);
    expect(plan.blockReasons).toEqual([]);
    expect(plan.executionBoundary).toContain("Dry-run policy planning only");
  });

  it("blocks missing approval, missing endpoint allowlist, and excessive spend", async () => {
    await mockCandidate(true);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:agentmail:email",
      task: "Send a test email",
      endpointUrl: "https://agentmail.to/api/send",
      allowlistedEndpoints: ["https://example.com/"],
      estimatedUsd: 2,
      spendCapUsd: 0.5,
    });

    expect(plan.policy.eligibleForFutureLivePayment).toBe(false);
    expect(plan.blockReasons).toEqual(
      expect.arrayContaining([
        "endpoint_not_allowlisted",
        "user_approval_missing",
        "estimated_cost_exceeds_spend_cap",
      ])
    );
  });

  it("blocks non-curl tools for future live payment", async () => {
    await mockCandidate(true);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:agentmail:email",
      task: "Check balance",
      toolName: "get_balance",
      endpointUrl: "https://agentmail.to/api/send",
      allowlistedEndpoints: ["https://agentmail.to/api/"],
      estimatedUsd: 0.01,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.blockReasons).toContain("tool_not_allowed_for_live_payment");
    expect(plan.policy.livePaymentAllowed).toBe(false);
  });

  it("blocks missing candidate", async () => {
    await mockCandidate(false);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:missing",
      task: "Call missing provider",
      endpointUrl: "https://example.com/",
      allowlistedEndpoints: ["https://example.com/"],
      estimatedUsd: 0.01,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.ok).toBe(false);
    expect(plan.blockReasons).toContain("candidate_not_found");
  });
});
