jest.mock("@/lib/manager/evidence-pack", () => ({
  buildManagerEvidencePack: jest.fn(),
}));

describe("manager evidence route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns evidence pack result", async () => {
    const { buildManagerEvidencePack } = await import("@/lib/manager/evidence-pack");
    (buildManagerEvidencePack as jest.Mock).mockReturnValue({
      generatedAt: "2026-04-27T00:00:00.000Z",
      status: "ready",
      command: "npm run test:bdd:status && npm run test:bdd:sweep",
      artifacts: [],
      privacy: { rawPromptsIncluded: false, secretsIncluded: false, note: "safe" },
      nextAction: "Attach evidence.",
    });

    const { GET } = await import("@/app/api/manager/evidence/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      result: { status: "ready", command: expect.stringContaining("test:bdd:status") },
    });
  });
});
