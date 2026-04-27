import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/planner-execution", () => ({
  executePlannerSpecialistCall: jest.fn(),
  listPlannerRuns: jest.fn(),
}));

describe("onboarding planner execute route preferred wallet", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("passes selected specialist, consumer wallet, and policy into execution", async () => {
    const { executePlannerSpecialistCall } = await import("@/lib/onboarding/planner-execution");
    (executePlannerSpecialistCall as jest.Mock).mockResolvedValue({
      ok: true,
      result: {
        runId: "run_123",
        status: "completed",
        selectedWallet: "wallet-specialist",
        paymentSatisfied: true,
      },
    });

    const { POST } = await import("@/app/api/onboarding/planner/execute/route");
    const req = new NextRequest("http://localhost/api/onboarding/planner/execute", {
      method: "POST",
      body: JSON.stringify({
        prompt: "summarize this",
        consumerWallet: "wallet-consumer",
        preferredWallet: "wallet-specialist",
        policy: {
          requiredPrivacyMode: "per",
          requiresHealthPass: true,
          requiresAttested: true,
          maxPerCallUsd: 0.01,
          preferredWallet: "wallet-specialist",
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);

    expect(res.status).toBe(200);
    expect(executePlannerSpecialistCall).toHaveBeenCalledWith({
      prompt: "summarize this",
      consumerWallet: "wallet-consumer",
      preferredWallet: "wallet-specialist",
      policy: {
        requiredPrivacyMode: "per",
        requiresHealthPass: true,
        requiresAttested: true,
        maxPerCallUsd: 0.01,
        preferredWallet: "wallet-specialist",
      },
    });
  });
});
