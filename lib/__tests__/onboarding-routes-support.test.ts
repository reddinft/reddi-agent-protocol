jest.mock("@/lib/onboarding/runtime-bootstrap", () => ({
  runRuntimeBootstrap: jest.fn(),
}));

jest.mock("@/lib/onboarding/endpoint-manager", () => ({
  createOrRotateEndpoint: jest.fn(),
  heartbeatEndpoint: jest.fn(),
}));

jest.mock("@/lib/onboarding/capabilities", () => ({
  upsertCapabilities: jest.fn(),
}));

jest.mock("@/lib/onboarding/specialist-index", () => ({
  listSpecialistIndex: jest.fn(),
  upsertSpecialistIndex: jest.fn(),
}));

jest.mock("fs", () => ({
  readFileSync: jest.fn(),
}));

describe("onboarding support routes", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe("POST /api/onboarding/runtime", () => {
    it("returns bootstrap result on success", async () => {
      const { runRuntimeBootstrap } = await import("@/lib/onboarding/runtime-bootstrap");
      (runRuntimeBootstrap as jest.Mock).mockResolvedValue({ ready: true });

      const { POST } = await import("@/app/api/onboarding/runtime/route");
      const req = new Request("http://localhost/api/onboarding/runtime", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          platform: "darwin",
          port: 11434,
          consentExposeEndpoint: true,
          consentProtocolOps: true,
          protocolDomain: "example.com",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(runRuntimeBootstrap).toHaveBeenCalledTimes(1);
    });

    it("returns 400 on bootstrap failure", async () => {
      const { runRuntimeBootstrap } = await import("@/lib/onboarding/runtime-bootstrap");
      (runRuntimeBootstrap as jest.Mock).mockRejectedValue(new Error("bootstrap failed"));

      const { POST } = await import("@/app/api/onboarding/runtime/route");
      const req = new Request("http://localhost/api/onboarding/runtime", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ platform: "darwin", port: 11434 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toMatch(/bootstrap failed/i);
    });
  });

  describe("POST /api/onboarding/endpoint", () => {
    it("runs create action by default", async () => {
      const { createOrRotateEndpoint } = await import("@/lib/onboarding/endpoint-manager");
      (createOrRotateEndpoint as jest.Mock).mockResolvedValue({ endpointUrl: "https://a.example" });

      const { POST } = await import("@/app/api/onboarding/endpoint/route");
      const req = new Request("http://localhost/api/onboarding/endpoint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ consentExposeEndpoint: true, port: 3334 }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(createOrRotateEndpoint).toHaveBeenCalledTimes(1);
    });

    it("runs heartbeat action when requested", async () => {
      const { heartbeatEndpoint } = await import("@/lib/onboarding/endpoint-manager");
      (heartbeatEndpoint as jest.Mock).mockResolvedValue({ status: "online" });

      const { POST } = await import("@/app/api/onboarding/endpoint/route");
      const req = new Request("http://localhost/api/onboarding/endpoint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "heartbeat", endpointUrl: "https://a.example" }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(heartbeatEndpoint).toHaveBeenCalledTimes(1);
    });
  });

  describe("/api/onboarding/capabilities", () => {
    it("GET returns specialist index list", async () => {
      const { listSpecialistIndex } = await import("@/lib/onboarding/specialist-index");
      (listSpecialistIndex as jest.Mock).mockReturnValue({ ok: true, results: [{ walletAddress: "w1" }] });

      const { GET } = await import("@/app/api/onboarding/capabilities/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.result.results[0].walletAddress).toBe("w1");
    });

    it("POST validates capabilities and upserts specialist index", async () => {
      const { upsertCapabilities } = await import("@/lib/onboarding/capabilities");
      const { upsertSpecialistIndex } = await import("@/lib/onboarding/specialist-index");

      (upsertCapabilities as jest.Mock).mockReturnValue({
        ok: true,
        record: {
          capabilities: {
            taskTypes: ["summarize"],
            inputModes: ["text"],
            outputModes: ["text"],
            pricing: { baseUsd: 1, perCallUsd: 2 },
            privacyModes: ["public"],
            tags: ["onboarding"],
            context_requirements: [],
            runtime_capabilities: ["web_search"],
          },
        },
      });

      const { POST } = await import("@/app/api/onboarding/capabilities/route");
      const req = new Request("http://localhost/api/onboarding/capabilities", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: "w1",
          taskTypes: ["summarize"],
          inputModes: ["text"],
          outputModes: ["text"],
          pricing: { baseUsd: 1, perCallUsd: 2 },
          privacyModes: ["public"],
          tags: ["onboarding"],
          context_requirements: [],
          runtime_capabilities: ["web_search"],
          endpointUrl: "https://a.example",
          healthcheckStatus: "pass",
          attested: true,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(upsertCapabilities).toHaveBeenCalledTimes(1);
      expect(upsertSpecialistIndex).toHaveBeenCalledTimes(1);
    });
  });

  describe("GET /api/onboarding/audit", () => {
    it("returns attestations and heartbeat summaries", async () => {
      const { readFileSync } = await import("fs");
      (readFileSync as unknown as jest.Mock).mockImplementation((path: string) => {
        if (path.includes("attestations.json")) {
          return JSON.stringify([
            {
              recordedAt: "2026-04-19T00:00:00.000Z",
              jobIdHex: "0xabc",
              operatorPubkeySuffix: "1234abcd",
              txSignature: "sig-1",
              walletAddress: "w1",
              endpointUrl: "https://a.example",
            },
          ]);
        }
        if (path.includes("heartbeat-poll.json")) {
          return JSON.stringify([
            {
              polled_at: "2026-04-19T00:01:00.000Z",
              specialists_checked: 1,
              results: [{ wallet: "w1", status: "pass" }],
            },
          ]);
        }
        return JSON.stringify([]);
      });

      const { GET } = await import("@/app/api/onboarding/audit/route");
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.attestations.length).toBe(1);
      expect(body.heartbeat_polls.length).toBe(1);
      expect(body.heartbeat_polls[0].results_summary).toMatch(/w1: pass/i);
    });
  });
});
