jest.mock("@/lib/onboarding/consumer-registry", () => ({
  listConsumers: jest.fn(),
}));

describe("GET /api/onboarding/consumers", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns consumer list on success", async () => {
    const { listConsumers } = await import("@/lib/onboarding/consumer-registry");
    (listConsumers as jest.Mock).mockReturnValue({ ok: true, results: [{ walletAddress: "w1" }] });

    const { GET } = await import("@/app/api/onboarding/consumers/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.result.results[0].walletAddress).toBe("w1");
  });

  it("returns 400 when consumer list read fails", async () => {
    const { listConsumers } = await import("@/lib/onboarding/consumer-registry");
    (listConsumers as jest.Mock).mockImplementation(() => {
      throw new Error("read failed");
    });

    const { GET } = await import("@/app/api/onboarding/consumers/route");
    const res = await GET();

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/read failed/i);
  });
});
