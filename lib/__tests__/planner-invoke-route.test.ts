import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/planner-execution", () => ({
  executePlannerSpecialistCall: jest.fn(),
}));

jest.mock("@/lib/integrations/openonion/consumer/orchestrator", () => ({
  runOpenOnionConsumerFlow: jest.fn(),
}));

jest.mock("@/lib/orchestrator/policy", () => ({
  readPolicy: jest.fn(),
  recordSpend: jest.fn(),
  readTodaySpend: jest.fn(),
}));

jest.mock("@/lib/jupiter-client", () => ({
  getJupiterClient: jest.fn(),
  getJupiterSlippageBps: jest.fn().mockReturnValue(100),
}));

describe("planner invoke route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("passes targetWallet through as preferredWallet", async () => {
    const { readPolicy, readTodaySpend } = await import("@/lib/orchestrator/policy");
    const { executePlannerSpecialistCall } = await import("@/lib/onboarding/planner-execution");

    (readPolicy as jest.Mock).mockReturnValue({
      enabled: true,
      dailyBudgetUsd: 100,
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
    });
    (readTodaySpend as jest.Mock).mockReturnValue({ totalUsd: 0 });
    (executePlannerSpecialistCall as jest.Mock).mockResolvedValue({
      ok: true,
      result: {
        runId: "run_123",
        responsePreview: "done",
        selectedWallet: "wallet-specialist",
        paymentSatisfied: false,
      },
    });

    const { POST } = await import("@/app/api/planner/tools/invoke/route");
    const req = new NextRequest("http://localhost/api/planner/tools/invoke", {
      method: "POST",
      body: JSON.stringify({
        prompt: "summarize this",
        targetWallet: "wallet-target",
        consumerWallet: "wallet-consumer",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    expect(executePlannerSpecialistCall).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredWallet: "wallet-target",
        consumerWallet: "wallet-consumer",
      })
    );
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      runId: "run_123",
      specialistWallet: "wallet-specialist",
    });
  });

  it("returns 429 when daily budget is exhausted", async () => {
    const { readPolicy, readTodaySpend } = await import("@/lib/orchestrator/policy");
    (readPolicy as jest.Mock).mockReturnValue({
      enabled: true,
      dailyBudgetUsd: 1,
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
    });
    (readTodaySpend as jest.Mock).mockReturnValue({ totalUsd: 1 });

    const { POST } = await import("@/app/api/planner/tools/invoke/route");
    const req = new NextRequest("http://localhost/api/planner/tools/invoke", {
      method: "POST",
      body: JSON.stringify({ prompt: "hello" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(429);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("Daily budget"),
    });
  });

  it("uses openonion consumer flow when integrationMode=openonion", async () => {
    const { readPolicy, readTodaySpend } = await import("@/lib/orchestrator/policy");
    const { runOpenOnionConsumerFlow } = await import("@/lib/integrations/openonion/consumer/orchestrator");

    (readPolicy as jest.Mock).mockReturnValue({
      enabled: true,
      dailyBudgetUsd: 100,
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
    });
    (readTodaySpend as jest.Mock).mockReturnValue({ totalUsd: 0 });
    (runOpenOnionConsumerFlow as jest.Mock).mockResolvedValue({
      ok: false,
      settlementDisposition: "refund",
      result: {
        runId: "run_fail",
        selectedWallet: "wallet-specialist",
        paymentSatisfied: false,
        error: "specialist unreachable",
      },
    });

    const { POST } = await import("@/app/api/planner/tools/invoke/route");
    const req = new NextRequest("http://localhost/api/planner/tools/invoke", {
      method: "POST",
      body: JSON.stringify({
        prompt: "summarize",
        integrationMode: "openonion",
        retryBudget: 2,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(runOpenOnionConsumerFlow).toHaveBeenCalledWith(
      expect.objectContaining({ retryBudget: 2 })
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      runId: "run_fail",
    });
  });
});
