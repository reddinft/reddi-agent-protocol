jest.mock("@/lib/dogfood/seed", () => ({
  seedDogfoodAgents: jest.fn(),
}));

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

jest.mock("@/lib/dogfood/constants", () => ({
  DOGFOOD_TAG: "dogfood",
}));

describe("dogfood seed route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("seeds dogfood agents via POST", async () => {
    const { seedDogfoodAgents } = await import("@/lib/dogfood/seed");
    (seedDogfoodAgents as jest.Mock).mockReturnValue({ ok: true, agents: 2 });

    const { POST } = await import("@/app/api/dogfood/seed/route");
    const res = await POST(new Request("http://localhost/api/dogfood/seed", { method: "POST" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.agents).toBe(2);
    expect(body.origin).toBe("http://localhost");
    expect(seedDogfoodAgents).toHaveBeenCalledWith("http://localhost");
  });

  it("seeds dogfood agents via GET too", async () => {
    const { seedDogfoodAgents } = await import("@/lib/dogfood/seed");
    (seedDogfoodAgents as jest.Mock).mockReturnValue({ ok: true, agents: 1 });

    const { GET } = await import("@/app/api/dogfood/seed/route");
    const res = await GET(new Request("http://localhost/api/dogfood/seed"));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
  });

  it("returns 500 on seed failure", async () => {
    const { seedDogfoodAgents } = await import("@/lib/dogfood/seed");
    (seedDogfoodAgents as jest.Mock).mockImplementation(() => { throw new Error("seed fail"); });

    const { POST } = await import("@/app/api/dogfood/seed/route");
    const res = await POST(new Request("http://localhost/api/dogfood/seed", { method: "POST" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
  });
});

describe("dogfood search route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns only dogfood-tagged specialists", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        {
          walletAddress: "wallet-dog",
          capabilities: { tags: ["dogfood"], taskTypes: ["summarize"], perCallUsd: 0.001 },
          health: { status: "pass", endpointUrl: "https://dog.example" },
          attestation: { attested: true },
        },
        {
          walletAddress: "wallet-other",
          capabilities: { tags: ["finance"], taskTypes: ["analyze"], perCallUsd: 0.002 },
          health: { status: "pass", endpointUrl: "https://other.example" },
          attestation: { attested: false },
        },
      ],
    });

    const { GET } = await import("@/app/api/dogfood/search/route");
    const res = await GET();

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
    expect(body.listings[0].walletAddress).toBe("wallet-dog");
    expect(body.tag).toBe("dogfood");
  });

  it("returns 500 on bridge failure", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockRejectedValue(new Error("bridge down"));

    const { GET } = await import("@/app/api/dogfood/search/route");
    const res = await GET();

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "bridge down" });
  });
});
