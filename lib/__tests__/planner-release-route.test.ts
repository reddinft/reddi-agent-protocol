import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/planner-settlement", () => ({
  decidePlannerSettlement: jest.fn(),
}));

describe("planner decide_settlement route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("records release decision", async () => {
    const { decidePlannerSettlement } = await import("@/lib/onboarding/planner-settlement");
    (decidePlannerSettlement as jest.Mock).mockReturnValue({
      ok: true,
      run: { runId: "run_1", settlementState: "released" },
    });

    const { POST } = await import("@/app/api/planner/tools/release/route");
    const req = new NextRequest("http://localhost/api/planner/tools/release", {
      method: "POST",
      body: JSON.stringify({ runId: "run_1", decision: "release" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      settlementState: "released",
    });
  });

  it("rejects invalid decision value", async () => {
    const { POST } = await import("@/app/api/planner/tools/release/route");
    const req = new NextRequest("http://localhost/api/planner/tools/release", {
      method: "POST",
      body: JSON.stringify({ runId: "run_1", decision: "invalid" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "decision must be release or dispute",
    });
  });

  it("returns 400 on settlement guardrail errors", async () => {
    const { decidePlannerSettlement } = await import("@/lib/onboarding/planner-settlement");
    (decidePlannerSettlement as jest.Mock).mockImplementation(() => {
      throw new Error("Settlement decision requires a payment-satisfied run");
    });

    const { POST } = await import("@/app/api/planner/tools/release/route");
    const req = new NextRequest("http://localhost/api/planner/tools/release", {
      method: "POST",
      body: JSON.stringify({ runId: "run_1", decision: "release" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "Settlement decision requires a payment-satisfied run",
    });
  });
});
