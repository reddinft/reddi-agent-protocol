import { specialistProfiles } from "../../packages/openrouter-specialists/src/profiles/index";
import { buildEconomicDemoDryRunPlan, endpointForProfile } from "@/lib/economic-demo/dry-run";
import { openRouterAll30EndpointEvidence } from "@/lib/economic-demo/openrouter-endpoints";

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

  it("keeps research orchestration separate from synthesis", () => {
    const plan = buildEconomicDemoDryRunPlan("research");

    expect(plan.orchestrator.id).toBe("agentic-workflow-system");
    expect(plan.edges.map((edge) => edge.toProfileId)).toEqual([
      "knowledge-retrieval-agent",
      "scientific-research-agent",
      "content-creation-agent",
      "explainable-agent",
      "verification-validation-agent",
    ]);
    expect(plan.edges.every((edge) => edge.status === "planned")).toBe(true);
    expect(plan.downstreamCallsExecuted).toBe(0);
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

  it("uses smoke-proven endpoint evidence for all 30 deployed specialist routes", () => {
    expect(openRouterAll30EndpointEvidence).toHaveLength(30);
    expect(openRouterAll30EndpointEvidence.map((entry) => entry.profileId).sort()).toEqual(
      specialistProfiles.map((profile) => profile.id).sort(),
    );
    expect(endpointForProfile("code-generation-agent")).toBe("https://reddi-code-generation.preview.reddi.tech/v1/chat/completions");
    expect(endpointForProfile("agentic-workflow-system")).toBe("https://reddi-agentic-workflow-system.preview.reddi.tech/v1/chat/completions");
    expect(openRouterAll30EndpointEvidence.every((entry) => entry.smokePassed && entry.endpoint.endsWith("/v1/chat/completions"))).toBe(true);
  });
});
