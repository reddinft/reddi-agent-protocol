jest.mock("@/lib/onboarding/planner-execution", () => ({
  listPlannerRuns: jest.fn(),
}));

describe("planner runs route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns run list", async () => {
    const { listPlannerRuns } = await import("@/lib/onboarding/planner-execution");
    (listPlannerRuns as jest.Mock).mockReturnValue([{ runId: "run_1", status: "completed" }]);

    const { GET } = await import("@/app/api/planner/runs/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, result: [{ runId: "run_1" }] });
  });

  it("returns 400 on failure", async () => {
    const { listPlannerRuns } = await import("@/lib/onboarding/planner-execution");
    (listPlannerRuns as jest.Mock).mockImplementation(() => {
      throw new Error("boom");
    });

    const { GET } = await import("@/app/api/planner/runs/route");
    const res = await GET();

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "boom" });
  });
});
