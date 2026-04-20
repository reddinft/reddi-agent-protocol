import { NextRequest } from "next/server";

jest.mock("@/lib/dogfood/seed", () => ({
  seedDogfoodAgents: jest.fn(),
}));

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

jest.mock("@/lib/dogfood/escrow", () => ({
  createEscrow: jest.fn(),
  settleEscrow: jest.fn(),
}));

describe("dogfood consumer-run route", () => {
  const specialistEndpoint = "http://localhost/api/dogfood/testing-specialist";
  const attestorEndpoint = "http://localhost/api/dogfood/testing-attestor";

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("releases escrow on attestor pass", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { createEscrow, settleEscrow } = await import("@/lib/dogfood/escrow");

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "dogfoodSpec11111111111111111111111111111111",
          health: { endpointUrl: specialistEndpoint },
          capabilities: { tags: ["dogfood-ping-haiku"] },
        },
        {
          walletAddress: "dogfoodAttest111111111111111111111111111111",
          health: { endpointUrl: attestorEndpoint },
          capabilities: { tags: ["attestor"] },
        },
      ],
    });

    (createEscrow as jest.Mock).mockReturnValue({ escrowId: "escrow_1", status: "held" });
    (settleEscrow as jest.Mock).mockReturnValue({ escrowId: "escrow_1", status: "released" });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ payload: { reply: "pong", haiku: ["a", "b", "c"] } }) })
      .mockResolvedValueOnce({ json: async () => ({ verdict: { pass: true } }) });

    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/dogfood/consumer-run/route");
    const req = new NextRequest("http://localhost/api/dogfood/consumer-run", {
      method: "POST",
      body: JSON.stringify({ message: "ping", force: "pass" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      flow: {
        escrow: { status: "released" },
      },
    });
    expect(settleEscrow).toHaveBeenCalledWith(expect.objectContaining({ decision: "release" }));
  });

  it("refunds escrow on attestor fail", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { createEscrow, settleEscrow } = await import("@/lib/dogfood/escrow");

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "dogfoodSpec11111111111111111111111111111111",
          health: { endpointUrl: specialistEndpoint },
          capabilities: { tags: ["dogfood-ping-haiku"] },
        },
        {
          walletAddress: "dogfoodAttest111111111111111111111111111111",
          health: { endpointUrl: attestorEndpoint },
          capabilities: { tags: ["attestor"] },
        },
      ],
    });

    (createEscrow as jest.Mock).mockReturnValue({ escrowId: "escrow_2", status: "held" });
    (settleEscrow as jest.Mock).mockReturnValue({ escrowId: "escrow_2", status: "refunded" });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ payload: { reply: "ping" } }) })
      .mockResolvedValueOnce({ json: async () => ({ verdict: { pass: false } }) });

    global.fetch = fetchMock as unknown as typeof fetch;

    const { POST } = await import("@/app/api/dogfood/consumer-run/route");
    const req = new NextRequest("http://localhost/api/dogfood/consumer-run", {
      method: "POST",
      body: JSON.stringify({ message: "ping", force: "fail" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      flow: {
        escrow: { status: "refunded" },
      },
    });
    expect(settleEscrow).toHaveBeenCalledWith(expect.objectContaining({ decision: "refund" }));
  });
});

