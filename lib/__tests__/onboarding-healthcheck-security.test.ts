import { runSpecialistHealthcheck } from "@/lib/onboarding/healthcheck";

describe("onboarding healthcheck security enforcement", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockResponse(status: number, ok: boolean, headers?: Record<string, string | null>) {
    return {
      status,
      ok,
      headers: {
        get: (name: string) => headers?.[name] ?? headers?.[name.toLowerCase()] ?? null,
      },
    } as Response;
  }

  it("passes when x402 challenge is detected", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(402, false, { "x402-request": "{}" }));

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await runSpecialistHealthcheck({
      endpointUrl: "https://specialist.example",
      walletAddress: "11111111111111111111111111111111",
    });

    expect(result.securityStatus).toBe("x402_challenge_detected");
    expect(result.x402Probe).toBe("ok");
    expect(result.status).toBe("pass");
  });

  it("fails when endpoint serves open completion without x402 challenge", async () => {
    const fetchMock = jest.fn()
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(200, true))
      .mockResolvedValueOnce(mockResponse(200, true));

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await runSpecialistHealthcheck({
      endpointUrl: "https://specialist.example",
      walletAddress: "11111111111111111111111111111111",
    });

    expect(result.securityStatus).toBe("insecure_open_completion");
    expect(result.x402Probe).toBe("fail");
    expect(result.status).toBe("fail");
    expect(result.note).toMatch(/without an x402 challenge/i);
  });
});
