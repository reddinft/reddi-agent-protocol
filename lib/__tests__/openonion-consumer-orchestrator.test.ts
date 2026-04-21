jest.mock("@/lib/onboarding/planner-execution", () => ({
  executePlannerSpecialistCall: jest.fn(),
}));

describe("openonion consumer orchestrator", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("triggers refund disposition when specialist remains unreachable", async () => {
    const { executePlannerSpecialistCall } = await import("@/lib/onboarding/planner-execution");
    (executePlannerSpecialistCall as jest.Mock).mockResolvedValue({
      ok: false,
      result: {
        runId: "run_123",
        error: "fetch failed",
        paymentSatisfied: false,
      },
    });

    const { runOpenOnionConsumerFlow } = await import("@/lib/integrations/openonion/consumer/orchestrator");
    const result = await runOpenOnionConsumerFlow({
      prompt: "hello",
      retryBudget: 1,
    });

    expect(result.ok).toBe(false);
    expect(result.settlementDisposition).toBe("refund");
    expect(executePlannerSpecialistCall).toHaveBeenCalledTimes(2);
  });
});
