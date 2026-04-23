import {
  openClawInvokeSpecialist,
  openClawResolveSpecialist,
  openClawSupervisorOrchestrate,
} from "@/lib/integrations/source-adapter/openclaw/connector";

describe("openclaw source connector", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("calls planner resolve endpoint with configured api key", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, candidate: { walletAddress: "abc", endpointUrl: "https://x" }, alternativeCount: 0 }),
    }) as unknown as typeof fetch;

    const out = await openClawResolveSpecialist(
      { baseUrl: "https://agent-protocol.reddi.tech", apiKey: "secret" },
      { task: "summarize" }
    );

    expect(out.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://agent-protocol.reddi.tech/api/planner/tools/resolve",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "x-reddi-agent-key": "secret" }),
      })
    );

    const payload = JSON.parse(((global.fetch as jest.Mock).mock.calls[0]?.[1]?.body ?? "{}") as string);
    expect(payload.policy?.preferredSource).toBe("openclaw");
  });

  it("runs supervisor resolve->invoke flow", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          candidate: { walletAddress: "wallet_1", endpointUrl: "https://spec.example" },
          alternativeCount: 0,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true, runId: "run_1", specialistWallet: "wallet_1", paymentSatisfied: true }),
      }) as unknown as typeof fetch;

    const out = await openClawSupervisorOrchestrate(
      { baseUrl: "https://agent-protocol.reddi.tech" },
      { task: "summarize docs", prompt: "summarize this", consumerWallet: "consumer_1" }
    );

    expect(out.ok).toBe(true);
    expect(out.phase).toBe("invoke");
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("surfaces route errors from invoke endpoint", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "bad invoke" }),
    }) as unknown as typeof fetch;

    await expect(
      openClawInvokeSpecialist(
        { baseUrl: "https://agent-protocol.reddi.tech" },
        { prompt: "ping" }
      )
    ).rejects.toThrow("bad invoke");
  });
});
