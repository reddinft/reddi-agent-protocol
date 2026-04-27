import { summarizeAttestorRole } from "@/lib/attestor/role-readiness";

describe("attestor role readiness", () => {
  it("requires an eligible attestor candidate before role is ready", () => {
    const summary = summarizeAttestorRole({
      attestationRecords: 0,
      onchainAttestations: 0,
      revealCommits: 0,
      availableAttestors: 0,
    });

    expect(summary.status).toBe("needs_attestor");
    expect(summary.nextAction).toMatch(/Register or attest/i);
    expect(summary.checks.find((check) => check.id === "profile")?.status).toBe("fail");
  });

  it("marks discoverable attestor role as needing activity when no jobs exist", () => {
    const summary = summarizeAttestorRole({
      attestationRecords: 0,
      onchainAttestations: 0,
      revealCommits: 0,
      availableAttestors: 1,
    });

    expect(summary.status).toBe("needs_activity");
    expect(summary.headline).toMatch(/discoverable/i);
  });

  it("marks attestor role ready when verification and audit evidence exist", () => {
    const summary = summarizeAttestorRole({
      attestationRecords: 3,
      onchainAttestations: 2,
      revealCommits: 1,
      availableAttestors: 1,
    }, {
      walletAddress: "wallet-attestor",
      attestationAccuracy: 95,
      reasons: ["attested", "health:pass"],
    });

    expect(summary.status).toBe("ready");
    expect(summary.checks.map((check) => check.status)).toEqual(["pass", "pass", "pass", "pass"]);
    expect(summary.nextAction).toMatch(/release\/refund/i);
  });
});
