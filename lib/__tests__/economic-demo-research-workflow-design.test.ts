import { buildResearchWorkflowDesign } from "@/lib/economic-demo/research-workflow-design";

describe("economic demo research workflow design", () => {
  it("designs a no-live-call research workflow with evidence requirements before receipt enablement", () => {
    const design = buildResearchWorkflowDesign();

    expect(design.schemaVersion).toBe("reddi.economic-demo.research-workflow-design.v2");
    expect(design.phase).toBe("5");
    expect(design.mode).toBe("dry_run_no_live_calls");
    expect(design.downstreamCallsExecuted).toBe(0);
    expect(design.orchestrator.profileId).toBe("agentic-workflow-system");
    expect(design.orchestrator.separationRationale).toContain("scientific-research-agent can remain a synthesis specialist");
    expect(design.edges.map((edge) => edge.profileId)).toEqual([
      "knowledge-retrieval-agent",
      "scientific-research-agent",
      "content-creation-agent",
      "explainable-agent",
      "verification-validation-agent",
    ]);
    expect(design.edges.map((edge) => edge.payloadClass)).toEqual([
      "source_map",
      "research_synthesis",
      "article_draft",
      "explainability_review",
      "verification_attestation",
    ]);
    expect(design.edges.every((edge) => edge.controlledDemoReceiptReadiness === "not_enabled_yet")).toBe(true);
    expect(design.edges.every((edge) => edge.endpoint.endsWith("/v1/chat/completions"))).toBe(true);
    expect(design.edges.every((edge) => edge.evidenceRequirement.length > 20)).toBe(true);
    expect(design.edges.every((edge) => edge.citationOrEvidenceCaveat.length > 20)).toBe(true);
    expect(design.edges.every((edge) => edge.attestorCriteria.length >= 3)).toBe(true);
    expect(design.edges.every((edge) => edge.refundOrDisputeBehavior.match(/refund|dispute|Release/i))).toBe(true);
    expect(design.edges.every((edge) => edge.disclosureLedgerExpectation.x402State === "planned")).toBe(true);
    expect(design.edges.every((edge) => edge.disclosureLedgerExpectation.downstreamCallsExecuted === 0)).toBe(true);
    expect(design.edges.every((edge) => edge.disclosureLedgerExpectation.requiredSchemaVersion === "reddi.downstream-disclosure-ledger.v1")).toBe(true);
    expect(design.acceptanceCriteria.join(" ")).toContain("citations or explicit evidence caveats");
    expect(design.acceptanceCriteria.join(" ")).toContain("planned downstream-disclosure ledger expectation");
    expect(design.guardrails).toMatchObject({
      noLiveCalls: true,
      noPaidProviderRequests: true,
      noCoolifyMutation: true,
      noSigningOperations: true,
      noWalletMutation: true,
      noDevnetTransfer: true,
      noReceiptEnablementYet: true,
      citationsOrEvidenceCaveatsRequired: true,
      attestorReleaseRefundDisputeRequired: true,
    });
  });
});
