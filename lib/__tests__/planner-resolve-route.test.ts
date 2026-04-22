import { NextRequest } from "next/server";

jest.mock("@/lib/registry/bridge", () => ({
  fetchSpecialistListings: jest.fn(),
}));

jest.mock("@/lib/orchestrator/policy", () => ({
  readPolicy: jest.fn(),
}));

describe("planner resolve route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 400 when task is missing", async () => {
    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({ task: "" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "task is required",
    });
  });

  it("returns 400 when no eligible specialists are found", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");

    (readPolicy as jest.Mock).mockReturnValue({
      maxPerTaskUsd: 0,
      requireAttestation: false,
      minReputation: 0,
      preferredPrivacyMode: "public",
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({ listings: [] });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({ task: "summarize this" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      candidate: null,
      appliedFilters: {
        sortBy: "ranking",
      },
      error: "No eligible specialists found matching your policy.",
    });
  });

  it("returns top candidate with expected shape on success", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");

    (readPolicy as jest.Mock).mockReturnValue({
      maxPerTaskUsd: 0,
      requireAttestation: false,
      minReputation: 0,
      preferredPrivacyMode: "public",
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "So11111111111111111111111111111111111111112",
          health: { status: "pass", endpointUrl: "https://specialist.test" },
          attestation: { attested: true },
          onchain: { reputationScore: 42 },
          capabilities: {
            perCallUsd: 0.5,
            taskTypes: ["summarize"],
            privacyModes: ["public"],
            runtime_capabilities: ["summarization"],
          },
          signals: { feedbackCount: 4, avgFeedbackScore: 8.5 },
        },
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({ task: "summarize this" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        walletAddress: "So11111111111111111111111111111111111111112",
        endpointUrl: "https://specialist.test",
        healthStatus: "pass",
      },
      alternativeCount: 0,
    });
  });

  it("applies discovery filters and supports cost sorting", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");

    (readPolicy as jest.Mock).mockReturnValue({
      maxPerTaskUsd: 0,
      requireAttestation: false,
      minReputation: 0,
      preferredPrivacyMode: "public",
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "So11111111111111111111111111111111111111112",
          health: { status: "pass", endpointUrl: "https://a.test", lastCheckedAt: "2026-04-23T00:00:00.000Z" },
          attestation: { attested: true },
          onchain: { reputationScore: 50 },
          capabilities: {
            perCallUsd: 0.8,
            taskTypes: ["summarize"],
            inputModes: ["text"],
            privacyModes: ["public"],
            runtime_capabilities: ["stateful"],
            tags: ["finance"],
          },
          signals: { feedbackCount: 10, avgFeedbackScore: 9 },
        },
        {
          walletAddress: "So11111111111111111111111111111111111111113",
          health: { status: "pass", endpointUrl: "https://b.test", lastCheckedAt: "2026-04-23T00:00:00.000Z" },
          attestation: { attested: true },
          onchain: { reputationScore: 45 },
          capabilities: {
            perCallUsd: 0.3,
            taskTypes: ["summarize"],
            inputModes: ["text"],
            privacyModes: ["public"],
            runtime_capabilities: ["stateful"],
            tags: ["finance", "realtime"],
          },
          signals: { feedbackCount: 8, avgFeedbackScore: 8.7 },
        },
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({
        task: "summarize this",
        sortBy: "cost",
        runtimeCap: "stateful",
        tag: "finance",
        health: "pass",
        attested: true,
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        walletAddress: "So11111111111111111111111111111111111111113",
      },
      appliedFilters: {
        sortBy: "cost",
        runtimeCap: "stateful",
        tag: "finance",
        health: "pass",
        attested: true,
      },
    });
  });

  it("supports reputation sorting", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");

    (readPolicy as jest.Mock).mockReturnValue({
      maxPerTaskUsd: 0,
      requireAttestation: false,
      minReputation: 0,
      preferredPrivacyMode: "public",
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "So11111111111111111111111111111111111111114",
          health: { status: "pass", endpointUrl: "https://c.test" },
          attestation: { attested: true },
          onchain: { reputationScore: 80 },
          capabilities: { perCallUsd: 0.7, taskTypes: ["summarize"], privacyModes: ["public"] },
          signals: { feedbackCount: 1, avgFeedbackScore: 7.5 },
        },
        {
          walletAddress: "So11111111111111111111111111111111111111115",
          health: { status: "pass", endpointUrl: "https://d.test" },
          attestation: { attested: true },
          onchain: { reputationScore: 20 },
          capabilities: { perCallUsd: 0.2, taskTypes: ["summarize"], privacyModes: ["public"] },
          signals: { feedbackCount: 20, avgFeedbackScore: 9.8 },
        },
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({ task: "summarize this", sortBy: "reputation" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        walletAddress: "So11111111111111111111111111111111111111114",
      },
      appliedFilters: {
        sortBy: "reputation",
      },
    });
  });

  it("supports feedback sorting", async () => {
    const { readPolicy } = await import("@/lib/orchestrator/policy");
    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");

    (readPolicy as jest.Mock).mockReturnValue({
      maxPerTaskUsd: 0,
      requireAttestation: false,
      minReputation: 0,
      preferredPrivacyMode: "public",
    });

    (fetchSpecialistListings as jest.Mock).mockResolvedValue({
      listings: [
        {
          walletAddress: "So11111111111111111111111111111111111111116",
          health: { status: "pass", endpointUrl: "https://e.test" },
          attestation: { attested: true },
          onchain: { reputationScore: 90 },
          capabilities: { perCallUsd: 1, taskTypes: ["summarize"], privacyModes: ["public"] },
          signals: { feedbackCount: 2, avgFeedbackScore: 7.1 },
        },
        {
          walletAddress: "So11111111111111111111111111111111111111117",
          health: { status: "pass", endpointUrl: "https://f.test" },
          attestation: { attested: true },
          onchain: { reputationScore: 10 },
          capabilities: { perCallUsd: 1.2, taskTypes: ["summarize"], privacyModes: ["public"] },
          signals: { feedbackCount: 35, avgFeedbackScore: 9.4 },
        },
      ],
    });

    const { POST } = await import("@/app/api/planner/tools/resolve/route");
    const req = new NextRequest("http://localhost/api/planner/tools/resolve", {
      method: "POST",
      body: JSON.stringify({ task: "summarize this", sortBy: "feedback" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      candidate: {
        walletAddress: "So11111111111111111111111111111111111111117",
      },
      appliedFilters: {
        sortBy: "feedback",
      },
    });
  });
});
