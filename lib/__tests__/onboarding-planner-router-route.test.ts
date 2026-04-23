jest.mock("@/lib/onboarding/planner-router", () => ({
  routePlannerPolicy: jest.fn(),
}));

describe("onboarding planner router route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("routes with public privacy mode", async () => {
    const { routePlannerPolicy } = await import("@/lib/onboarding/planner-router");
    (routePlannerPolicy as jest.Mock).mockReturnValue({ mode: "public", reason: "ok" });

    const { POST } = await import("@/app/api/onboarding/planner/route");
    const res = await POST(new Request("http://localhost/api/onboarding/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requiredPrivacyMode: "public", requiresAttested: true }),
    }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, result: { mode: "public" } });
    expect(routePlannerPolicy).toHaveBeenCalledWith(expect.objectContaining({
      requiredPrivacyMode: "public",
      requiresAttested: true,
    }));
  });

  it("ignores invalid privacyMode values", async () => {
    const { routePlannerPolicy } = await import("@/lib/onboarding/planner-router");
    (routePlannerPolicy as jest.Mock).mockReturnValue({ mode: "default" });

    const { POST } = await import("@/app/api/onboarding/planner/route");
    const res = await POST(new Request("http://localhost/api/onboarding/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ requiredPrivacyMode: "invalid-mode" }),
    }));

    expect(res.status).toBe(200);
    expect(routePlannerPolicy).toHaveBeenCalledWith(
      expect.objectContaining({ requiredPrivacyMode: undefined })
    );
  });

  it("returns 400 on router failure", async () => {
    const { routePlannerPolicy } = await import("@/lib/onboarding/planner-router");
    (routePlannerPolicy as jest.Mock).mockImplementation(() => {
      throw new Error("router crashed");
    });

    const { POST } = await import("@/app/api/onboarding/planner/route");
    const res = await POST(new Request("http://localhost/api/onboarding/planner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "router crashed" });
  });
});
