import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/planner-feedback", () => ({
  recordPlannerFeedback: jest.fn(),
}));

describe("planner signal route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("forwards consumerWallet for consumer reputation updates", async () => {
    const { recordPlannerFeedback } = await import("@/lib/onboarding/planner-feedback");
    (recordPlannerFeedback as jest.Mock).mockResolvedValue({
      ok: true,
      reputationCommit: { ok: true, txSignature: "sig123" },
    });

    const { POST } = await import("@/app/api/planner/tools/signal/route");
    const req = new NextRequest("http://localhost/api/planner/tools/signal", {
      method: "POST",
      body: JSON.stringify({
        runId: "run_123",
        score: 8,
        consumerWallet: "wallet-consumer",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    expect(recordPlannerFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        runId: "run_123",
        score: 8,
        consumerWallet: "wallet-consumer",
      })
    );
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      reputationCommitted: true,
      reputationTxSignature: "sig123",
    });
  });

  it("returns 400 on invalid score", async () => {
    const { POST } = await import("@/app/api/planner/tools/signal/route");
    const req = new NextRequest("http://localhost/api/planner/tools/signal", {
      method: "POST",
      body: JSON.stringify({ runId: "run_123", score: 11 }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "score must be between 1 and 10",
    });
  });

  it("rejects schema-drift attestor payloads deterministically", async () => {
    const { POST } = await import("@/app/api/planner/tools/signal/route");
    const req = new NextRequest("http://localhost/api/planner/tools/signal", {
      method: "POST",
      body: JSON.stringify({
        runId: "run_123",
        score: 7,
        attestorPayload: {
          schemaVersion: "reddi.attestation.v1",
          runId: "run_123",
          attestorWallet: "wallet_attestor",
          rubric: { coverage: 0.8, accuracy: 0.7 },
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining("rubric.concision"),
    });
  });
});
