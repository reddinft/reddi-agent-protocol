import { Keypair } from "@solana/web3.js";

describe("onboarding operator status routes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("reports missing key on /api/onboarding/operator-key", async () => {
    delete process.env.ONBOARDING_ATTEST_OPERATOR_SECRET_KEY;

    const { GET } = await import("@/app/api/onboarding/operator-key/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      result: {
        present: false,
        valid: false,
        state: "missing",
      },
    });
  });

  it("reports readiness on /api/onboarding/attestation-operator with valid key", async () => {
    const kp = Keypair.generate();
    process.env.ONBOARDING_ATTEST_OPERATOR_SECRET_KEY = JSON.stringify(Array.from(kp.secretKey));

    const { GET } = await import("@/app/api/onboarding/attestation-operator/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      result: {
        ready: true,
        state: "ready",
        operatorPubkey: kp.publicKey.toBase58(),
      },
    });
  });

  it("returns guidance fields on /api/onboarding/attestation-operator when key is missing", async () => {
    delete process.env.ONBOARDING_ATTEST_OPERATOR_SECRET_KEY;

    const { GET } = await import("@/app/api/onboarding/attestation-operator/route");
    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      result: {
        ready: false,
        state: "missing",
        envTemplate: expect.stringContaining("ONBOARDING_ATTEST_OPERATOR_SECRET_KEY"),
        nextAction: expect.stringContaining("restart"),
      },
    });
  });
});
