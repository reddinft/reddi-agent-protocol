import { NextRequest } from "next/server";

jest.mock("@/lib/torque/client", () => ({
  getLeaderboard: jest.fn(),
}));

describe("Torque leaderboard API route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns entries from getLeaderboard", async () => {
    const { getLeaderboard } = await import("@/lib/torque/client");
    (getLeaderboard as jest.Mock).mockResolvedValue([
      { userPubkey: "wallet1", rank: 1, value: 100 },
      { userPubkey: "wallet2", rank: 2, value: 90 },
    ]);

    const { GET } = await import("@/app/api/torque/leaderboard/route");
    const req = new NextRequest("http://localhost/api/torque/leaderboard", { method: "GET" });
    const res = await GET(req as unknown as Request);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      entries: [
        { userPubkey: "wallet1", rank: 1, value: 100 },
        { userPubkey: "wallet2", rank: 2, value: 90 },
      ],
    });
  });

  it("returns empty array when no entries", async () => {
    const { getLeaderboard } = await import("@/lib/torque/client");
    (getLeaderboard as jest.Mock).mockResolvedValue([]);

    const { GET } = await import("@/app/api/torque/leaderboard/route");
    const req = new NextRequest("http://localhost/api/torque/leaderboard", { method: "GET" });
    const res = await GET(req as unknown as Request);

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ entries: [] });
  });
});
