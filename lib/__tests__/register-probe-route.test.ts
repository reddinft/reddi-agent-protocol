jest.mock("@/lib/onboarding/runtime-probe", () => ({
  probeRuntimeEndpoint: jest.fn(),
}));

describe("POST /api/register/probe runtime normalization", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns legacy ollama_detected status for compatibility", async () => {
    const { probeRuntimeEndpoint } = await import("@/lib/onboarding/runtime-probe");
    (probeRuntimeEndpoint as jest.Mock).mockResolvedValue({
      ok: true,
      status: "runtime_detected",
      detectedRuntime: "ollama",
      models: ["qwen3:8b"],
      hints: [],
    });

    const { POST } = await import("@/app/api/register/probe/route");
    const req = new Request("http://localhost/api/register/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: "https://example.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ollama_detected");
    expect(body.runtimeStatus).toBe("runtime_detected");
    expect(body.detectedRuntime).toBe("ollama");
  });

  it("maps non-ollama runtime_detected to reachable for legacy UI", async () => {
    const { probeRuntimeEndpoint } = await import("@/lib/onboarding/runtime-probe");
    (probeRuntimeEndpoint as jest.Mock).mockResolvedValue({
      ok: true,
      status: "runtime_detected",
      detectedRuntime: "openai_compatible",
      models: ["llama3.1"],
      hints: [],
    });

    const { POST } = await import("@/app/api/register/probe/route");
    const req = new Request("http://localhost/api/register/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: "https://example.com" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("reachable");
    expect(body.runtimeStatus).toBe("runtime_detected");
    expect(body.detectedRuntime).toBe("openai_compatible");
  });

  it("returns 400 for invalid URL status", async () => {
    const { probeRuntimeEndpoint } = await import("@/lib/onboarding/runtime-probe");
    (probeRuntimeEndpoint as jest.Mock).mockResolvedValue({
      ok: false,
      status: "invalid_url",
      detectedRuntime: "unknown",
      models: [],
      hints: [],
      error: "Invalid endpoint URL.",
    });

    const { POST } = await import("@/app/api/register/probe/route");
    const req = new Request("http://localhost/api/register/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: "bad url" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.status).toBe("invalid_url");
  });
});
