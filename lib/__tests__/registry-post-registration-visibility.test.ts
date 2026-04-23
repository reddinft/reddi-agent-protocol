/**
 * Registry post-registration visibility tests.
 *
 * Core regression suite born from the bigint serialisation bug (Apr 2026):
 * a successfully registered agent with on-chain bigint fields was not
 * appearing in the Marketplace because /api/registry returned 500.
 *
 * Every new serialization concern, shape change, or onchain-to-API path
 * should get a test case here.
 */

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

function makeOnchainListing(wallet: string) {
  return {
    pda: `pda-${wallet}`,
    walletAddress: wallet,
    onchain: {
      owner: wallet,
      agentType: "Primary" as const,
      model: "qwen3:8b",
      // These are bigint — the exact shape returned by decodeAgentAccount
      rateLamports: 1_000_000n,
      minReputation: 0,
      reputationScore: 42,
      jobsCompleted: 5n,
      jobsFailed: 1n,
      createdAt: 1_713_868_800n,
      active: true,
      attestationAccuracy: 80,
    },
    capabilities: {
      taskTypes: ["summarize"],
      inputModes: ["text"],
      outputModes: ["text"],
      privacyModes: ["public"],
      tags: ["finance"],
      baseUsd: 0,
      perCallUsd: 0.001,
      context_requirements: [],
      runtime_capabilities: [],
      attestor_checkpoints: [],
      quality_claims: [],
    },
    health: {
      status: "pass" as const,
      freshnessState: "fresh" as const,
      endpointUrl: `https://${wallet}.example`,
      lastCheckedAt: "2026-04-23T10:00:00.000Z",
    },
    attestation: { attested: true, lastAttestedAt: "2026-04-23T08:00:00.000Z" },
    capabilityHash: null,
    signals: { feedbackCount: 3, avgFeedbackScore: 8.5, attestationAgreements: 2, attestationDisagreements: 0 },
    ranking_score: 85,
    indexSemantics: { schemaVersion: 2, rankingFormulaVersion: 1 },
  };
}

describe("registry post-registration visibility", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("newly registered agent with bigint fields appears in Marketplace without 500", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [makeOnchainListing("new-wallet-after-registration")],
      onchainCount: 1,
      indexedCount: 1,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry"));

    // Must not 500 — key regression
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.total).toBe(1);
    expect(body.listings[0].walletAddress).toBe("new-wallet-after-registration");

    // BigInt fields must be serialized as strings, not throw
    const listing = body.listings[0];
    expect(typeof listing.onchain.rateLamports).toBe("string");
    expect(listing.onchain.rateLamports).toBe("1000000");
    expect(listing.onchain.jobsCompleted).toBe("5");
    expect(listing.onchain.jobsFailed).toBe("1");
    expect(listing.onchain.createdAt).toBe("1713868800");
  });

  it("multiple newly registered agents all appear in Marketplace listing", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [
        makeOnchainListing("wallet-a"),
        makeOnchainListing("wallet-b"),
        makeOnchainListing("wallet-c"),
      ],
      onchainCount: 3,
      indexedCount: 3,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(3);
    expect(body.listings.map((l: { walletAddress: string }) => l.walletAddress)).toEqual([
      "wallet-a", "wallet-b", "wallet-c",
    ]);
  });

  it("registry returns live on-chain data (not stale cache) after registration", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    // Simulate a second call after registration (bridge now sees 1 more agent)
    (fetchSpecialistListings as jest.Mock)
      .mockResolvedValueOnce({ ok: true, listings: [], onchainCount: 0, indexedCount: 0 })
      .mockResolvedValueOnce({ ok: true, listings: [makeOnchainListing("wallet-new")], onchainCount: 1, indexedCount: 1 });

    const { GET } = await import("@/app/api/registry/route");

    const before = await (await GET(new Request("http://localhost/api/registry"))).json();
    expect(before.total).toBe(0);

    const after = await (await GET(new Request("http://localhost/api/registry"))).json();
    expect(after.total).toBe(1);
    expect(after.listings[0].walletAddress).toBe("wallet-new");
  });

  it("registry does not omit agents with zero jobs or reputation", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const freshAgent = makeOnchainListing("fresh-agent");
    freshAgent.onchain.jobsCompleted = 0n;
    freshAgent.onchain.jobsFailed = 0n;
    freshAgent.onchain.reputationScore = 0;

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      ok: true,
      listings: [freshAgent],
      onchainCount: 1,
      indexedCount: 1,
    });

    const { GET } = await import("@/app/api/registry/route");
    const res = await GET(new Request("http://localhost/api/registry"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(1);
    expect(body.listings[0].onchain.jobsCompleted).toBe("0");
    expect(body.listings[0].onchain.reputationScore).toBe(0);
  });
});
