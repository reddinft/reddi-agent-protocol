import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/attestor-resolver", () => ({
  resolveAttestor: jest.fn(),
}));

describe("planner resolve_attestor route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns candidate on success", async () => {
    const { resolveAttestor } = await import("@/lib/onboarding/attestor-resolver");
    (resolveAttestor as jest.Mock).mockResolvedValue({
      ok: true,
      candidate: { walletAddress: "So11111111111111111111111111111111111111112" },
      alternatives: [],
      count: 1,
    });

    const { POST } = await import("@/app/api/planner/tools/resolve-attestor/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve-attestor", {
      method: "POST",
      body: JSON.stringify({ taskTypeHint: "review" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      count: 1,
      candidate: { walletAddress: "So11111111111111111111111111111111111111112" },
    });
  });

  it("returns 400 when no eligible attestor", async () => {
    const { resolveAttestor } = await import("@/lib/onboarding/attestor-resolver");
    (resolveAttestor as jest.Mock).mockResolvedValue({
      ok: false,
      candidate: null,
      alternatives: [],
      count: 0,
      error: "No eligible attestors found.",
    });

    const { POST } = await import("@/app/api/planner/tools/resolve-attestor/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve-attestor", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "No eligible attestors found.",
    });
  });
});
