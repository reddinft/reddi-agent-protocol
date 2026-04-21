import { probeRuntimeEndpoint } from "@/lib/onboarding/runtime-probe";

describe("runtime probe foundation (I1)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("detects OpenAI-compatible runtime via /v1/models", async () => {
    (global.fetch as unknown as jest.Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: [{ id: "Qwen/Qwen2.5-7B-Instruct" }] }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    const out = await probeRuntimeEndpoint("https://example.com");

    expect(out.ok).toBe(true);
    expect(out.status).toBe("runtime_detected");
    expect(out.detectedRuntime).toBe("openai_compatible");
    expect(out.models).toEqual(["Qwen/Qwen2.5-7B-Instruct"]);
    expect((global.fetch as unknown as jest.Mock).mock.calls[0][0]).toContain("/v1/models");
  });

  it("falls back to Ollama detection via /api/tags", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ models: [{ name: "qwen3:8b" }] }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      );

    const out = await probeRuntimeEndpoint("https://example.com");

    expect(out.ok).toBe(true);
    expect(out.status).toBe("runtime_detected");
    expect(out.detectedRuntime).toBe("ollama");
    expect(out.models).toEqual(["qwen3:8b"]);
    expect((global.fetch as unknown as jest.Mock).mock.calls[1][0]).toContain("/api/tags");
  });

  it("returns reachable when only /healthz works", async () => {
    (global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));

    const out = await probeRuntimeEndpoint("https://example.com");

    expect(out.ok).toBe(true);
    expect(out.status).toBe("reachable");
    expect(out.detectedRuntime).toBe("unknown");
    expect(out.models).toEqual([]);
  });

  it("returns invalid_url for malformed endpoint", async () => {
    const out = await probeRuntimeEndpoint("::not-a-url::");

    expect(out.ok).toBe(false);
    expect(out.status).toBe("invalid_url");
  });
});
