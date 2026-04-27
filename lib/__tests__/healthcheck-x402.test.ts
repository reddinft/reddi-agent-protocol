jest.mock("server-only", () => ({}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(() => {
    throw new Error("no profile");
  }),
}));

describe("specialist healthcheck x402 enforcement", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fails closed when /v1/chat/completions returns an unpaid completion", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() }) as unknown as typeof fetch;

    const { runSpecialistHealthcheck } = await import("@/lib/onboarding/healthcheck");
    const result = await runSpecialistHealthcheck({
      endpointUrl: "https://specialist.example",
      walletAddress: "11111111111111111111111111111111",
    });

    expect(result).toMatchObject({
      status: "fail",
      reachable: true,
      x402Probe: "fail",
    });
    expect(result.note).toMatch(/without an x402 challenge/i);
  });

  it("passes only when /v1/chat/completions returns 402 with x402-request", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({ ok: true, status: 200, headers: new Headers() })
      .mockResolvedValueOnce({
        ok: false,
        status: 402,
        headers: new Headers({ "x402-request": JSON.stringify({ amount: 1 }) }),
      }) as unknown as typeof fetch;

    const { runSpecialistHealthcheck } = await import("@/lib/onboarding/healthcheck");
    const result = await runSpecialistHealthcheck({
      endpointUrl: "https://specialist.example",
      walletAddress: "11111111111111111111111111111111",
    });

    expect(result).toMatchObject({
      status: "pass",
      reachable: true,
      x402Probe: "ok",
    });
  });
});
