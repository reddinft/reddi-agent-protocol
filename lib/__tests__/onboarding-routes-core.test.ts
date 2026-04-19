jest.mock("@/lib/onboarding/wallet-sponsorship", () => ({
  createLocalWallet: jest.fn(),
  prepareSponsorship: jest.fn(),
}));

jest.mock("@/lib/onboarding/healthcheck", () => ({
  runSpecialistHealthcheck: jest.fn(),
}));

jest.mock("@/lib/onboarding/specialist-index", () => ({
  updateSpecialistHealthcheck: jest.fn(),
}));

jest.mock("@/lib/onboarding/onchain-attestation", () => ({
  submitOnchainOnboardingAttestation: jest.fn(),
}));

jest.mock("@/lib/onboarding/attestation", () => ({
  recordAttestation: jest.fn(),
}));

describe("onboarding core routes", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("POST /api/onboarding/wallet", () => {
    it("creates local wallet on default action", async () => {
      const { createLocalWallet } = await import("@/lib/onboarding/wallet-sponsorship");
      (createLocalWallet as jest.Mock).mockReturnValue({ walletAddress: "w1" });

      const { POST } = await import("@/app/api/onboarding/wallet/route");
      const req = new Request("http://localhost/api/onboarding/wallet", {
        method: "POST",
        body: JSON.stringify({ backupConfirmed: true, passphrase: "test-pass" }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.result.walletAddress).toBe("w1");
      expect(createLocalWallet).toHaveBeenCalledTimes(1);
    });

    it("runs sponsorship action when requested", async () => {
      const { prepareSponsorship } = await import("@/lib/onboarding/wallet-sponsorship");
      (prepareSponsorship as jest.Mock).mockReturnValue({ maxLamports: 10000 });

      const { POST } = await import("@/app/api/onboarding/wallet/route");
      const req = new Request("http://localhost/api/onboarding/wallet", {
        method: "POST",
        body: JSON.stringify({ action: "sponsorship", walletAddress: "abc" }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(prepareSponsorship).toHaveBeenCalledWith("abc");
    });
  });

  describe("POST /api/onboarding/healthcheck", () => {
    it("writes PASS health status on successful probe", async () => {
      const { runSpecialistHealthcheck } = await import("@/lib/onboarding/healthcheck");
      const { updateSpecialistHealthcheck } = await import("@/lib/onboarding/specialist-index");
      (runSpecialistHealthcheck as jest.Mock).mockResolvedValue({ status: "pass", checks: [] });

      const { POST } = await import("@/app/api/onboarding/healthcheck/route");
      const req = new Request("http://localhost/api/onboarding/healthcheck", {
        method: "POST",
        body: JSON.stringify({ walletAddress: "w1", endpointUrl: "https://example.com" }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(updateSpecialistHealthcheck).toHaveBeenCalledWith("w1", {
        endpointUrl: "https://example.com",
        healthcheckStatus: "pass",
      });
    });

    it("returns 400 when healthcheck throws", async () => {
      const { runSpecialistHealthcheck } = await import("@/lib/onboarding/healthcheck");
      (runSpecialistHealthcheck as jest.Mock).mockRejectedValue(new Error("probe failed"));

      const { POST } = await import("@/app/api/onboarding/healthcheck/route");
      const req = new Request("http://localhost/api/onboarding/healthcheck", {
        method: "POST",
        body: JSON.stringify({ walletAddress: "w1", endpointUrl: "bad" }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toMatch(/probe failed/i);
    });
  });

  describe("POST /api/onboarding/attestation", () => {
    it("blocks attestation when healthcheck is not pass", async () => {
      const { POST } = await import("@/app/api/onboarding/attestation/route");
      const req = new Request("http://localhost/api/onboarding/attestation", {
        method: "POST",
        body: JSON.stringify({ walletAddress: "w1", healthcheckStatus: "fail" }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toMatch(/blocked until healthcheck passes/i);
    });

    it("submits onchain attestation and records audit on pass", async () => {
      const { submitOnchainOnboardingAttestation } = await import("@/lib/onboarding/onchain-attestation");
      const { recordAttestation } = await import("@/lib/onboarding/attestation");

      (submitOnchainOnboardingAttestation as jest.Mock).mockResolvedValue({
        signature: "sig-123",
        jobIdHex: "0xabc",
        operator: "operator-pubkey-xyz",
      });
      (recordAttestation as jest.Mock).mockReturnValue({ stored: true });

      const { POST } = await import("@/app/api/onboarding/attestation/route");
      const req = new Request("http://localhost/api/onboarding/attestation", {
        method: "POST",
        body: JSON.stringify({
          walletAddress: "w1",
          endpointUrl: "https://example.com",
          healthcheckStatus: "pass",
          operator: "wizard-operator",
          scores: [90, 90, 90, 90, 90],
        }),
        headers: { "content-type": "application/json" },
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(submitOnchainOnboardingAttestation).toHaveBeenCalledTimes(1);
      expect(recordAttestation).toHaveBeenCalledTimes(1);
      expect(body.result.onchain.signature).toBe("sig-123");
    });
  });
});
