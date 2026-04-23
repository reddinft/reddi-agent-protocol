jest.mock("@/lib/orchestrator/policy", () => ({
  readPolicy: jest.fn(),
  updatePolicy: jest.fn(),
}));

describe("orchestrator policy route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns current policy", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    (readPolicy as jest.Mock).mockReturnValue({ enabled: true, maxPerTaskUsd: 1 });

    const { GET } = await import("@/app/api/orchestrator/policy/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, policy: { enabled: true } });
  });

  it("applies only valid patch fields", async () => {
    const { updatePolicy } = await import("@/lib/orchestrator/policy");
    (updatePolicy as jest.Mock).mockImplementation((patch) => ({ ...patch }));

    const { POST } = await import("@/app/api/orchestrator/policy/route");
    const res = await POST(new Request("http://localhost/api/orchestrator/policy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        enabled: true,
        maxPerTaskUsd: 2,
        preferredPrivacyMode: "public",
        allowedTaskTypes: ["summarize", "not-real"],
        fallbackMode: "local",
        unknown: "drop-me",
      }),
    }));

    expect(res.status).toBe(200);
    expect(updatePolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        maxPerTaskUsd: 2,
        preferredPrivacyMode: "public",
        fallbackMode: "local",
      })
    );
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });

  it("returns 400 for invalid json body", async () => {
    const { POST } = await import("@/app/api/orchestrator/policy/route");
    const res = await POST(new Request("http://localhost/api/orchestrator/policy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
  });
});
