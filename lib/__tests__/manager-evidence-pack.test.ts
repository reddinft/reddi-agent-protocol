jest.mock("server-only", () => ({}));

jest.mock("fs", () => ({
  existsSync: jest.fn(),
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn(),
}));

describe("manager evidence pack", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("lists judge-safe role-critical artifact summaries", async () => {
    const fs = await import("fs");
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue(["20260427-120000"]);
    (fs.statSync as jest.Mock).mockReturnValue({ mtimeMs: 1 });
    (fs.readFileSync as jest.Mock).mockReturnValue("# Summary\nPASS evidence line\nsecret=should-not-be-parsed");

    const { buildManagerEvidencePack } = await import("@/lib/manager/evidence-pack");
    const pack = buildManagerEvidencePack();

    expect(pack.status).toBe("ready");
    expect(pack.artifacts.map((item) => item.id)).toEqual(["bdd", "onboarding", "attestor", "consumer", "settlement"]);
    expect(pack.privacy).toMatchObject({ rawPromptsIncluded: false, secretsIncluded: false });
    expect(pack.artifacts[0]).toMatchObject({ status: "present", summary: "PASS evidence line" });
  });

  it("calls out missing evidence explicitly", async () => {
    const fs = await import("fs");
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const { buildManagerEvidencePack } = await import("@/lib/manager/evidence-pack");
    const pack = buildManagerEvidencePack();

    expect(pack.status).toBe("incomplete");
    expect(pack.artifacts.every((item) => item.status === "missing")).toBe(true);
    expect(pack.nextAction).toMatch(/Generate missing evidence/i);
  });
});
