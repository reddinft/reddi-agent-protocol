jest.mock("server-only", () => ({}));

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

jest.mock("@/lib/onboarding/consumer-registry", () => ({
  listConsumers: jest.fn(),
}));

jest.mock("@/lib/onboarding/operator-key", () => ({
  checkOperatorKeyStatus: jest.fn(),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

describe("manager readiness route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("summarizes Specialist, Attestor, Consumer, and Agent Manager role readiness", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { listConsumers } = await import("@/lib/onboarding/consumer-registry");
    const { checkOperatorKeyStatus } = await import("@/lib/onboarding/operator-key");
    const { readFileSync } = await import("fs");

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      indexedCount: 2,
      listings: [
        {
          health: { status: "pass" },
          capabilities: { taskTypes: ["summarize"] },
          attestation: { attested: true },
        },
        {
          health: { status: "fail" },
          capabilities: { taskTypes: ["code"] },
          attestation: { attested: false },
        },
      ],
    });
    (listConsumers as jest.Mock).mockReturnValue({ ok: true, results: [{ walletAddress: "consumer" }] });
    (checkOperatorKeyStatus as jest.Mock).mockReturnValue({ state: "ready" });
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify([{ txSignature: "tx1", localOnly: false }]));

    const { GET } = await import("@/app/api/manager/readiness/route");
    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      result: {
        status: "ready",
        counts: {
          specialists: 2,
          liveSpecialists: 1,
          insecureOrUnhealthySpecialists: 1,
          attestationRecords: 1,
          onchainAttestations: 1,
          consumers: 1,
          operatorReady: true,
        },
      },
    });
    expect(body.result.roles.map((r: { id: string }) => r.id)).toEqual([
      "specialist",
      "attestor",
      "consumer",
      "manager",
    ]);
  });

  it("surfaces the highest priority blocker when no specialist is live", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { listConsumers } = await import("@/lib/onboarding/consumer-registry");
    const { checkOperatorKeyStatus } = await import("@/lib/onboarding/operator-key");
    const { readFileSync } = await import("fs");

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({ ok: true, indexedCount: 0, listings: [] });
    (listConsumers as jest.Mock).mockReturnValue({ ok: true, results: [] });
    (checkOperatorKeyStatus as jest.Mock).mockReturnValue({ state: "missing" });
    (readFileSync as jest.Mock).mockReturnValue(JSON.stringify([]));

    const { GET } = await import("@/app/api/manager/readiness/route");
    const res = await GET();
    const body = await res.json();

    expect(body.result.status).toBe("action_needed");
    expect(body.result.highestPriorityAction).toMatch(/Register the first specialist/i);
    expect(body.result.roles.find((r: { id: string }) => r.id === "attestor").nextAction).toMatch(/ONBOARDING_ATTEST_OPERATOR_SECRET_KEY/);
  });
});
