import type { SpecialistListing } from "@/lib/registry/bridge";

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

jest.mock("@/lib/orchestrator/policy", () => ({
  readPolicy: jest.fn(),
}));

function makeListing(input: {
  wallet: string;
  tags: string[];
  reputation?: number;
}): SpecialistListing {
  return {
    pda: `pda-${input.wallet}`,
    walletAddress: input.wallet,
    onchain: {
      owner: input.wallet,
      agentType: "Primary",
      model: "model",
      rateLamports: 0n,
      minReputation: 0,
      reputationScore: input.reputation ?? 100,
      jobsCompleted: 0n,
      jobsFailed: 0n,
      createdAt: 0n,
      active: true,
      attestationAccuracy: 0,
    },
    capabilities: {
      taskTypes: ["summarize"],
      inputModes: ["text"],
      outputModes: ["text"],
      privacyModes: ["public"],
      tags: input.tags,
      baseUsd: 0,
      perCallUsd: 0.01,
      context_requirements: [],
      runtime_capabilities: [],
    },
    health: {
      status: "pass",
      endpointUrl: `https://${input.wallet}.example`,
      lastCheckedAt: null,
    },
    attestation: {
      attested: false,
      lastAttestedAt: null,
    },
    capabilityHash: null,
    signals: {
      feedbackCount: 0,
      avgFeedbackScore: 0,
      attestationAgreements: 0,
      attestationDisagreements: 0,
    },
    ranking_score: 0,
  };
}

describe("planner resolve route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("prefers source-matching specialists when preferredSource is set", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { readPolicy } = await import("@/lib/orchestrator/policy");

    (readPolicy as jest.Mock).mockReturnValue({
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
      minReputation: 0,
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        makeListing({ wallet: "wallet-hermes", tags: ["source:hermes"] }),
        makeListing({ wallet: "wallet-openclaw", tags: ["source:openclaw"] }),
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new Request("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "summarize",
        policy: { preferredSource: "openclaw" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.candidate.walletAddress).toBe("wallet-openclaw");
    expect(body.candidate.selectionReasons).toContain("source:openclaw");
    expect(body.candidate.sourceRouting).toMatchObject({
      requestedSource: "openclaw",
      candidateSource: "openclaw",
      strictSourceMatch: false,
      scoreDelta: 12,
    });
    expect(body.candidate.sourceRouting.decisionTrace).toEqual(
      expect.arrayContaining([
        "source:requested=openclaw",
        "source:candidate=openclaw",
        "source:strict=false",
        "source:score_delta=12",
        "source:openclaw",
      ])
    );
  });

  it("returns source policy trace when preferred source does not match under non-strict mode", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { readPolicy } = await import("@/lib/orchestrator/policy");

    (readPolicy as jest.Mock).mockReturnValue({
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
      minReputation: 0,
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [makeListing({ wallet: "wallet-hermes", tags: ["source:hermes"] })],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new Request("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "summarize",
        policy: { preferredSource: "openclaw", strictSourceMatch: false },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.candidate.walletAddress).toBe("wallet-hermes");
    expect(body.candidate.sourceRouting).toMatchObject({
      requestedSource: "openclaw",
      candidateSource: "hermes",
      strictSourceMatch: false,
      scoreDelta: -4,
    });
    expect(body.candidate.sourceRouting.decisionTrace).toEqual(
      expect.arrayContaining(["source_penalty:hermes"])
    );
  });

  it("enforces strictSourceMatch guardrail", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { readPolicy } = await import("@/lib/orchestrator/policy");

    (readPolicy as jest.Mock).mockReturnValue({
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
      minReputation: 0,
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [makeListing({ wallet: "wallet-hermes", tags: ["source:hermes"] })],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new Request("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "summarize",
        policy: { preferredSource: "openclaw", strictSourceMatch: true },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toContain("No eligible specialists");
    expect(body.resolveDiagnostics).toMatchObject({
      totalListings: 1,
      acceptedCount: 0,
      rejectedBy: {
        sourcePolicy: 1,
      },
      rejectedWalletSamples: {
        sourcePolicy: ["wallet-hermes"],
      },
    });
  });

  it("returns ranked alternative explainability metadata for supervisor diagnostics", async () => {
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const { readPolicy } = await import("@/lib/orchestrator/policy");

    (readPolicy as jest.Mock).mockReturnValue({
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerTaskUsd: 0,
      minReputation: 0,
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        makeListing({ wallet: "wallet-openclaw", tags: ["source:openclaw"], reputation: 110 }),
        makeListing({ wallet: "wallet-hermes", tags: ["source:hermes"], reputation: 100 }),
        makeListing({ wallet: "wallet-pi", tags: ["source:pi"], reputation: 90 }),
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new Request("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        task: "summarize",
        policy: { preferredSource: "openclaw", strictSourceMatch: false },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.candidate.walletAddress).toBe("wallet-openclaw");
    expect(body.alternativeCount).toBe(2);
    expect(body.alternatives).toHaveLength(2);
    expect(body.resolveDiagnostics).toMatchObject({
      totalListings: 3,
      acceptedCount: 3,
      rejectedBy: {
        sourcePolicy: 0,
      },
      rejectedWalletSamples: {
        sourcePolicy: [],
      },
    });
    expect(body.alternatives[0]).toMatchObject({
      walletAddress: "wallet-hermes",
      sourceRouting: {
        requestedSource: "openclaw",
        candidateSource: "hermes",
        strictSourceMatch: false,
        scoreDelta: -4,
      },
    });
    expect(body.alternatives[0].sourceRouting.decisionTrace).toEqual(
      expect.arrayContaining(["source_penalty:hermes"])
    );
  });
});
