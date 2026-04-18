/**
 * BDD: Bucket G — Torque Protocol Retention Layer
 * G1.1: Torque client initialises when TORQUE_API_TOKEN is set
 * G1.2: Torque client returns graceful no-op when token not set
 * G1.3: emitTorqueEvent sends correctly-shaped POST
 * G1.4: emitTorqueEvent fails silently when API unreachable
 */

describe("Torque client", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe("isTorqueEnabled", () => {
    it("returns false when TORQUE_API_TOKEN is not set", async () => {
      delete process.env.TORQUE_API_TOKEN;
      const { isTorqueEnabled } = await import("../torque/config");
      expect(isTorqueEnabled()).toBe(false);
    });

    it("returns true when TORQUE_API_TOKEN is set", async () => {
      process.env.TORQUE_API_TOKEN = "test-token";
      const { isTorqueEnabled } = await import("../torque/config");
      expect(isTorqueEnabled()).toBe(true);
    });
  });

  describe("emitTorqueEvent", () => {
    it("does not throw when TORQUE_API_TOKEN is not set", async () => {
      delete process.env.TORQUE_API_TOKEN;
      const { emitTorqueEvent } = await import("../torque/client");
      await expect(
        emitTorqueEvent({ userPubkey: "abc", eventName: "specialist_job_completed", fields: {} })
      ).resolves.not.toThrow();
    });

    it("does not throw when fetch fails", async () => {
      process.env.TORQUE_API_TOKEN = "test-token";
      global.fetch = jest.fn().mockRejectedValue(new Error("network error"));
      const { emitTorqueEvent } = await import("../torque/client");
      await expect(
        emitTorqueEvent({ userPubkey: "abc", eventName: "specialist_job_completed", fields: {} })
      ).resolves.not.toThrow();
    });

    it("calls fetch with correct Authorization header", async () => {
      process.env.TORQUE_API_TOKEN = "test-token-123";
      process.env.TORQUE_PROJECT_ID = "proj-abc";
      process.env.TORQUE_API_BASE = "https://api.torque.so";
      const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
      global.fetch = mockFetch;
      const { emitTorqueEvent } = await import("../torque/client");
      await emitTorqueEvent({
        userPubkey: "wallet123",
        eventName: "specialist_job_completed",
        fields: { jobId: "job1", lamports: 5000 },
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/events/custom"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token-123",
          }),
          body: expect.stringContaining('"projectId":"proj-abc"'),
        })
      );

      const call = mockFetch.mock.calls[0];
      const requestBody = JSON.parse(call[1].body as string);
      expect(requestBody).toMatchObject({
        projectId: "proj-abc",
        userPubkey: "wallet123",
        eventName: "specialist_job_completed",
      });
    });
  });

  describe("getLeaderboard", () => {
    it("returns empty array when TORQUE_API_TOKEN is not set", async () => {
      delete process.env.TORQUE_API_TOKEN;
      const { getLeaderboard } = await import("../torque/client");
      const result = await getLeaderboard();
      expect(result).toEqual([]);
    });

    it("returns empty array when no campaign ID configured", async () => {
      process.env.TORQUE_API_TOKEN = "test-token";
      delete process.env.TORQUE_LEADERBOARD_CAMPAIGN_ID;
      const { getLeaderboard } = await import("../torque/client");
      const result = await getLeaderboard();
      expect(result).toEqual([]);
    });

    it("returns empty array on fetch failure", async () => {
      process.env.TORQUE_API_TOKEN = "test-token";
      process.env.TORQUE_LEADERBOARD_CAMPAIGN_ID = "camp-123";
      global.fetch = jest.fn().mockRejectedValue(new Error("network error"));
      const { getLeaderboard } = await import("../torque/client");
      const result = await getLeaderboard();
      expect(result).toEqual([]);
    });

    it("returns leaderboard entries on success", async () => {
      process.env.TORQUE_API_TOKEN = "test-token";
      process.env.TORQUE_LEADERBOARD_CAMPAIGN_ID = "camp-123";
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [
            { userPubkey: "wallet1", rank: 1, value: 100 },
            { userPubkey: "wallet2", rank: 2, value: 90 },
          ],
        }),
      } as unknown as Response);

      const { getLeaderboard } = await import("../torque/client");
      const result = await getLeaderboard();
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({ userPubkey: "wallet1", rank: 1, value: 100 });
    });
  });
});
