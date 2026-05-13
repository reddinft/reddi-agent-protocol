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
              environmentCapabilities: {
                sandbox: { supported: true, network: "localnet" },
                devnet: { support: "unknown", network: "devnet" },
                mainnet: { supported: true, network: "mainnet", livePaymentAllowed: false },
              },
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
    expect(plan.environment).toMatchObject({
      requested: "sandbox",
      executionNetwork: "localnet",
      sandboxAvailable: true,
      devnetSupport: "unknown",
      mainnetGated: true,
    });
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

  it("blocks devnet unless provider metadata or challenge support is detected", async () => {
    await mockCandidate(true);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:agentmail:email",
      task: "Call a devnet endpoint",
      environment: "devnet",
      endpointUrl: "https://agentmail.to/api/send",
      allowlistedEndpoints: ["https://agentmail.to/api/"],
      estimatedUsd: 0.01,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.environment).toMatchObject({
      requested: "devnet",
      executionNetwork: "devnet",
      devnetSupport: "unknown",
    });
    expect(plan.blockReasons).toContain("devnet_support_unknown");
    expect(plan.policy.livePaymentAllowed).toBe(false);
  });

  it("allows the devnet environment gate when provider metadata declares devnet", async () => {
    const { buildPayShQuotePreview } = await import("@/lib/integrations/source-adapter/pay-sh-quote-preview");
    (buildPayShQuotePreview as jest.Mock).mockReturnValue({
      ok: true,
      candidate: {
        candidateId: "pay-sh:quicknode:rpc",
        providerName: "QuickNode",
        pricing: { currency: "USDC", network: "solana", minUsd: 0.001, maxUsd: 0.001 },
        environmentCapabilities: {
          sandbox: { supported: true, network: "localnet" },
          devnet: { support: "provider_declared", network: "devnet" },
          mainnet: { supported: true, network: "mainnet", livePaymentAllowed: false },
        },
      },
    });
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:quicknode:rpc",
      task: "Call a devnet RPC endpoint",
      environment: "devnet",
      endpointUrl: "https://x402.quicknode.com/solana-devnet",
      allowlistedEndpoints: ["https://x402.quicknode.com/"],
      estimatedUsd: 0.001,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.environment.devnetSupport).toBe("provider_declared");
    expect(plan.blockReasons).not.toContain("devnet_support_unknown");
    expect(plan.policy.livePaymentAllowed).toBe(false);
  });

  it("keeps mainnet explicit and gated even when planning gates pass", async () => {
    await mockCandidate(true);
    const { buildPayShPolicyPlan } = await import("@/lib/integrations/source-adapter/pay-sh-policy-plan");

    const plan = buildPayShPolicyPlan({
      candidateId: "pay-sh:agentmail:email",
      task: "Plan a mainnet call",
      environment: "mainnet",
      endpointUrl: "https://agentmail.to/api/send",
      allowlistedEndpoints: ["https://agentmail.to/api/"],
      estimatedUsd: 0.01,
      spendCapUsd: 0.1,
      userApprovedLivePayment: true,
    });

    expect(plan.environment).toMatchObject({
      requested: "mainnet",
      executionNetwork: "mainnet",
      livePaymentExperiment: true,
      mainnetGated: true,
    });
    expect(plan.blockReasons).toEqual([]);
    expect(plan.policy.eligibleForFutureLivePayment).toBe(true);
    expect(plan.policy.livePaymentAllowed).toBe(false);
  });
});
