jest.mock("server-only", () => ({}));

jest.mock("@/lib/onboarding/planner-execution", () => ({
  executePlannerSpecialistCall: jest.fn(),
}));

describe("ReddiAgents APP Adapter Slice A", () => {
  const originalDispatchMode = process.env.REDDI_APP_ADAPTER_DISPATCH;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    if (originalDispatchMode === undefined) {
      delete process.env.REDDI_APP_ADAPTER_DISPATCH;
    } else {
      process.env.REDDI_APP_ADAPTER_DISPATCH = originalDispatchMode;
    }
  });

  it("serves a well-known APP discovery manifest with one enabled demo specialist", async () => {
    const { GET } = await import("@/app/.well-known/app-agent.json/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      name: "ReddiAgents",
      version: "0.1.0",
      protocol: "app",
    });
    expect(body.agents).toHaveLength(1);
    expect(body.agents[0]).toMatchObject({
      id: "reddi.qa-testing-specialist",
      status: "available",
      input_schema_url: "/app/agents/reddi.qa-testing-specialist/schema",
      run_url: "/app/runs",
    });
  });

  it("lists enabled and staged APP adapter agents with Reddi readiness metadata", async () => {
    const { GET } = await import("@/app/app/agents/route");

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.agents.map((agent: { id: string }) => agent.id)).toEqual([
      "reddi.qa-testing-specialist",
      "reddi.ux-testing-specialist",
      "reddi.integration-testing-specialist",
    ]);
    expect(body.agents[0]).toMatchObject({
      status: "available",
      reddi: {
        source: "openclaw",
        strict_source_match: true,
        specialist_endpoint: "https://reddi-qa.preview.reddi.tech",
        x402_required: true,
        attestation_supported: true,
        evidence_routes: ["/manager", "/testers"],
      },
    });
    expect(body.agents.slice(1).every((agent: { status: string }) => agent.status === "disabled")).toBe(true);
  });

  it("serves the normalized task schema for a known APP adapter agent", async () => {
    const { GET } = await import("@/app/app/agents/[agentId]/schema/route");

    const res = await GET(new Request("http://localhost/app/agents/reddi.qa-testing-specialist/schema"), {
      params: { agentId: "reddi.qa-testing-specialist" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      agent_id: "reddi.qa-testing-specialist",
      schema: {
        type: "object",
        required: ["task"],
      },
    });
    expect(body.schema.properties.evidence_preference.enum).toEqual(["summary", "links", "full_receipt"]);
  });

  it("returns a safe 404 for unknown APP adapter agent schemas", async () => {
    const { GET } = await import("@/app/app/agents/[agentId]/schema/route");

    const res = await GET(new Request("http://localhost/app/agents/unknown/schema"), {
      params: { agentId: "unknown" },
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({ ok: false, error: "Unknown APP adapter agent" });
  });

  it("creates and retrieves a mock APP adapter run with a safe receipt envelope", async () => {
    const { clearAppAdapterRunsForTest } = await import("@/lib/app-adapter/store");
    clearAppAdapterRunsForTest();
    const createRun = await import("@/app/app/runs/route");
    const getRun = await import("@/app/app/runs/[runId]/route");

    const createRes = await createRun.POST(
      new Request("http://localhost/app/runs", {
        method: "POST",
        body: JSON.stringify({
          agent_id: "reddi.qa-testing-specialist",
          input: {
            task: "Review this x402 integration plan.",
            constraints: ["Be concise"],
            evidence_preference: "full_receipt",
          },
          context: {
            conversation_id: "thread-1",
            user_id: "user-1",
            trace_id: "trace-demo",
          },
        }),
      })
    );
    const createBody = await createRes.json();

    expect(createRes.status).toBe(200);
    expect(createBody).toMatchObject({
      agent_id: "reddi.qa-testing-specialist",
      status: "succeeded",
    });
    expect(createBody.run_id).toMatch(/^app_run_/);
    expect(createBody.status_url).toBe(`/app/runs/${createBody.run_id}`);

    const getRes = await getRun.GET(new Request(`http://localhost/app/runs/${createBody.run_id}`), {
      params: { runId: createBody.run_id },
    });
    const getBody = await getRes.json();

    expect(getRes.status).toBe(200);
    expect(getBody).toMatchObject({
      ok: true,
      runId: createBody.run_id,
      agentId: "reddi.qa-testing-specialist",
      status: "succeeded",
      context: { traceId: "trace-demo" },
      receipt: {
        adapter: "reddiagents-app-adapter",
        adapter_version: "0.1.0",
        trace_id: "trace-demo",
        x402_required: true,
        x402_satisfied: true,
        safe_public_evidence_only: true,
      },
    });
    expect(getBody.output.content).toContain("Review this x402 integration plan");
    expect(getBody.output.evidence).toEqual([
      { label: "Manager evidence surface", url: "/manager" },
      { label: "Volunteer tester evidence surface", url: "/testers" },
    ]);
  });

  it("can dispatch through the real planner bridge behind an explicit env flag", async () => {
    process.env.REDDI_APP_ADAPTER_DISPATCH = "planner";
    const { executePlannerSpecialistCall } = await import("@/lib/onboarding/planner-execution");
    (executePlannerSpecialistCall as jest.Mock).mockResolvedValue({
      ok: true,
      result: {
        runId: "planner_run_1",
        responsePreview: "planner completed",
        paymentSatisfied: true,
      },
    });
    const { clearAppAdapterRunsForTest } = await import("@/lib/app-adapter/store");
    clearAppAdapterRunsForTest();
    const createRun = await import("@/app/app/runs/route");
    const getRun = await import("@/app/app/runs/[runId]/route");

    const createRes = await createRun.POST(
      new Request("http://localhost/app/runs", {
        method: "POST",
        body: JSON.stringify({
          agent_id: "reddi.qa-testing-specialist",
          input: { task: "Call the planner bridge" },
          context: { trace_id: "trace-planner" },
        }),
      })
    );
    const createBody = await createRes.json();

    expect(createRes.status).toBe(200);
    expect(executePlannerSpecialistCall).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "Call the planner bridge",
        policy: expect.objectContaining({ requiresAttested: true, requiresHealthPass: true }),
      })
    );

    const getRes = await getRun.GET(new Request(`http://localhost/app/runs/${createBody.run_id}`), {
      params: { runId: createBody.run_id },
    });
    const getBody = await getRes.json();
    expect(getBody).toMatchObject({
      status: "succeeded",
      output: { content: "planner completed" },
      receipt: {
        trace_id: "trace-planner",
        x402_satisfied: true,
        attestation_status: "pending",
        escrow_status: "released",
      },
    });
  });

  it("rejects disabled agents and invalid run inputs safely", async () => {
    const createRun = await import("@/app/app/runs/route");

    const disabledRes = await createRun.POST(
      new Request("http://localhost/app/runs", {
        method: "POST",
        body: JSON.stringify({ agent_id: "reddi.ux-testing-specialist", input: { task: "test" } }),
      })
    );
    expect(disabledRes.status).toBe(404);
    expect(await disabledRes.json()).toEqual({ ok: false, error: "Unknown or disabled APP adapter agent" });

    const invalidRes = await createRun.POST(
      new Request("http://localhost/app/runs", {
        method: "POST",
        body: JSON.stringify({ agent_id: "reddi.qa-testing-specialist", input: { task: "" } }),
      })
    );
    expect(invalidRes.status).toBe(400);
    expect(await invalidRes.json()).toEqual({ ok: false, error: "input.task must be a non-empty string" });
  });
});
