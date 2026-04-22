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

  it("rejects malformed sourceAdapter manifests with actionable errors", async () => {
    const { POST } = await import("@/app/api/register/probe/route");
    const req = new NextRequest("http://localhost/api/register/probe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: "https://demo.reddi.tech",
        sourceAdapter: {
          version: "source-adapter.v1",
          source: "openclaw",
          role: "attestor",
          runtime: "ollama",
          capabilities: { taskTypes: ["judge"] },
          paymentPolicy: "x402_required",
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      status: "invalid_source_adapter",
    });
  });

  it("accepts valid sourceAdapter manifests and continues endpoint probe", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [{ name: "qwen3:8b" }] }),
      }) as unknown as typeof fetch;

    const { POST } = await import("@/app/api/register/probe/route");
    const req = new NextRequest("http://localhost/api/register/probe", {
      method: "POST",
      body: JSON.stringify({
        endpoint: "https://demo.reddi.tech",
        sourceAdapter: {
          version: "source-adapter.v1",
          source: "openclaw",
          role: "consumer",
          runtime: "ollama",
          capabilities: { taskTypes: ["resolve", "invoke"], inputModes: ["text"], outputModes: ["text"] },
          paymentPolicy: "x402_required",
          failurePolicy: { maxRetries: 2, refundOnFailure: true },
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      status: "ollama_detected",
      integration: "openclaw",
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
