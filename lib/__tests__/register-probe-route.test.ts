import { NextRequest } from "next/server";

describe("register probe route", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("blocks private-network targets in hosted context", async () => {
    const { POST } = await import("@/app/api/register/probe/route");
    const req = new NextRequest("http://localhost/api/register/probe", {
      method: "POST",
      body: JSON.stringify({ endpoint: "http://192.168.1.10:11434" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      status: "invalid_url",
    });
  });

  it("returns actionable contract mismatch error for openonion specialist", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ adapter: "openonion", role: "specialist" }),
      }) as unknown as typeof fetch;

    const { POST } = await import("@/app/api/register/probe/route");
    const req = new NextRequest("http://localhost/api/register/probe", {
      method: "POST",
      body: JSON.stringify({ endpoint: "https://demo.openonion.ai", integration: "openonion" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      status: "invalid_contract",
    });
  });
});
