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
});
