jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

type ListingLike = {
  walletAddress: string;
  ranking_score: number;
  onchainReputation?: number;
  perCallUsd?: number;
  tags?: string[];
  lastCheckedAt?: string | null;
};

function mkListing(input: ListingLike) {
  return {
    pda: "",
    walletAddress: input.walletAddress,
    onchain: {
      owner: input.walletAddress,
      agentType: "Primary",
      model: "",
      rateLamports: 0,
      minReputation: 0,
      reputationScore: input.onchainReputation ?? 0,
      jobsCompleted: 0,
      jobsFailed: 0,
      createdAt: 0,
      active: true,
      attestationAccuracy: 0,
    },
    capabilities: {
      taskTypes: [],
      inputModes: [],
      outputModes: [],
      privacyModes: [],
      tags: input.tags ?? [],
      baseUsd: 0,
      perCallUsd: input.perCallUsd ?? 0,
      context_requirements: [],
      runtime_capabilities: [],
    },
    health: {
      status: "pass",
      endpointUrl: null,
      lastCheckedAt: input.lastCheckedAt ?? null,
    },
    attestation: {
      attested: true,
      lastAttestedAt: null,
    },
    capabilityHash: null,
    signals: {
      feedbackCount: 0,
      avgFeedbackScore: 0,
      attestationAgreements: 0,
      attestationDisagreements: 0,
    },
    ranking_score: input.ranking_score,
  };
}

describe("registry route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("filters by single tag", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        mkListing({ walletAddress: "wallet-a", ranking_score: 1, tags: ["vision", "tooling"] }),
        mkListing({ walletAddress: "wallet-b", ranking_score: 1, tags: ["finance"] }),
      ],
      onchainCount: 2,
      indexedCount: 2,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry?tag=vision"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.listings).toHaveLength(1);
    expect(data.listings[0].walletAddress).toBe("wallet-a");
  });

  it("filters by tags CSV (any match)", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        mkListing({ walletAddress: "wallet-a", ranking_score: 1, tags: ["vision"] }),
        mkListing({ walletAddress: "wallet-b", ranking_score: 1, tags: ["finance"] }),
        mkListing({ walletAddress: "wallet-c", ranking_score: 1, tags: ["tooling"] }),
      ],
      onchainCount: 3,
      indexedCount: 3,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry?tags=vision,finance"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.listings.map((l: { walletAddress: string }) => l.walletAddress)).toEqual([
      "wallet-a",
      "wallet-b",
    ]);
  });

  it("applies ranking tie-breakers: freshness then cost", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        mkListing({
          walletAddress: "wallet-old-cheap",
          ranking_score: 100,
          lastCheckedAt: "2026-04-20T08:00:00.000Z",
          perCallUsd: 0.1,
        }),
        mkListing({
          walletAddress: "wallet-new-expensive",
          ranking_score: 100,
          lastCheckedAt: "2026-04-20T09:00:00.000Z",
          perCallUsd: 0.5,
        }),
        mkListing({
          walletAddress: "wallet-new-cheap",
          ranking_score: 100,
          lastCheckedAt: "2026-04-20T09:00:00.000Z",
          perCallUsd: 0.2,
        }),
      ],
      onchainCount: 3,
      indexedCount: 3,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry?sortBy=ranking"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.listings.map((l: { walletAddress: string }) => l.walletAddress)).toEqual([
      "wallet-new-cheap",
      "wallet-new-expensive",
      "wallet-old-cheap",
    ]);
  });

  it("keeps default bridge order when sortBy is unsupported", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        mkListing({ walletAddress: "wallet-a", ranking_score: 2 }),
        mkListing({ walletAddress: "wallet-b", ranking_score: 3 }),
        mkListing({ walletAddress: "wallet-c", ranking_score: 1 }),
      ],
      onchainCount: 3,
      indexedCount: 3,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry?sortBy=unknown"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.listings.map((l: { walletAddress: string }) => l.walletAddress)).toEqual([
      "wallet-a",
      "wallet-b",
      "wallet-c",
    ]);
  });
});
