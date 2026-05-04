import { buildResearchWorkflowDesign } from "@/lib/economic-demo/research-workflow-design";

describe("economic demo research workflow design", () => {
  it("designs a no-live-call research workflow with evidence requirements before receipt enablement", () => {
    const design = buildResearchWorkflowDesign();

    expect(design.phase).toBe("8A");
    expect(design.mode).toBe("design_only_no_live_calls");
    expect(design.orchestrator.profileId).toBe("scientific-research-agent");
    expect(design.edges.map((edge) => edge.profileId)).toEqual([
      "knowledge-retrieval-agent",
      "scientific-research-agent",
      "content-creation-agent",
      "explainable-agent",
      "verification-validation-agent",
    ]);
    expect(design.edges.every((edge) => edge.controlledDemoReceiptReadiness === "not_enabled_yet")).toBe(true);
    expect(design.edges.every((edge) => edge.endpoint.endsWith("/v1/chat/completions"))).toBe(true);
    expect(design.edges.every((edge) => edge.evidenceRequirement.length > 20)).toBe(true);
    expect(design.acceptanceCriteria.join(" ")).toContain("citations or explicit evidence caveats");
    expect(design.guardrails).toMatchObject({
      noLiveCalls: true,
      noCoolifyMutation: true,
      noReceiptEnablementYet: true,
      citationsOrEvidenceCaveatsRequired: true,
      attestorReleaseRefundDisputeRequired: true,
    });
  });
});
