import { buildEconomicDemoDryRunPlan, endpointForProfile } from "@/lib/economic-demo/dry-run";

describe("economic demo dry-run planning", () => {
  it("builds a zero-spend webpage plan from deployed specialist profile metadata", () => {
    const plan = buildEconomicDemoDryRunPlan("webpage");

    expect(plan.mode).toBe("delegation_dry_run");
    expect(plan.downstreamCallsExecuted).toBe(0);
    expect(plan.orchestrator.id).toBe("agentic-workflow-system");
    expect(plan.orchestrator.roles).toContain("consumer");
    expect(plan.edges.map((edge) => edge.toProfileId)).toEqual([
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(plan.edges.every((edge) => edge.status === "planned")).toBe(true);
    expect(plan.edges.every((edge) => edge.walletAddress.length > 20)).toBe(true);
    expect(plan.edges.every((edge) => edge.endpoint.endsWith("/v1/chat/completions"))).toBe(true);
    expect(plan.plannedTotalUsd).toBeGreaterThan(0);
  });

  it("keeps the picture path inside the tool-using adapter and validation chain", () => {
    const plan = buildEconomicDemoDryRunPlan("picture");

    expect(plan.orchestrator.id).toBe("tool-using-agent");
    expect(plan.edges.map((edge) => edge.toProfileId)).toEqual([
      "tool-using-agent",
      "vision-language-agent",
      "verification-validation-agent",
    ]);
    expect(plan.notes.join(" ")).toContain("Dry-run only");
  });

  it("uses exact known endpoints for first-five live deployed routes", () => {
    expect(endpointForProfile("code-generation-agent")).toBe("https://reddi-code-generation.preview.reddi.tech/v1/chat/completions");
    expect(endpointForProfile("agentic-workflow-system")).toBe("https://reddi-agentic-workflow-system.preview.reddi.tech/v1/chat/completions");
  });
});
