import {
  getDisclosureLedgerEvidenceStatus,
  getWebpageLiveWorkflowEvidence,
} from "@/lib/economic-demo/webpage-live-workflow-evidence";

describe("economic demo webpage live workflow evidence", () => {
  it("summarizes the multi-edge controlled paid workflow without live UI calls", () => {
    const evidence = getWebpageLiveWorkflowEvidence();

    expect(evidence.conclusion).toBe("multi_edge_paid_workflow_reached");
    expect(evidence.downstreamCallsExecuted).toBe(8);
    expect(evidence.edges.map((edge) => edge.profileId)).toEqual([
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(evidence.edges.every((edge) => edge.unpaidChallenge.status === 402)).toBe(true);
    expect(evidence.edges.every((edge) => edge.paidCompletion.status === 200)).toBe(true);
    expect(evidence.edges.every((edge) => edge.paidCompletion.paymentSatisfied)).toBe(true);
    expect(evidence.guardrails).toMatchObject({
      exactEndpoints: true,
      noSignerMaterialUsed: true,
      noSignatureAttemptedByHarness: true,
      noDevnetTransferFromHarness: true,
      controlledDemoReceiptsOnly: true,
      boundedMaxDownstreamCalls: 8,
      noLiveCallsFromUi: true,
    });
    expect(evidence.limitations.join(" ")).toContain("controlled demo receipts");
  });

  it("surfaces disclosure ledger completion state for the UI without raw edge parsing", () => {
    const evidence = getWebpageLiveWorkflowEvidence();
    const status = getDisclosureLedgerEvidenceStatus(evidence.disclosureLedgerSummary);

    expect(evidence.disclosureLedgerSummary).toMatchObject({
      schemaVersion: "reddi.economic-demo.disclosure-ledger-summary.v1",
      requiredLedgerSchemaVersion: "reddi.downstream-disclosure-ledger.v1",
      allEdgesHaveDisclosureLedger: false,
      evidenceComplete: false,
      edgeCount: 4,
      totalLedgerEntries: 0,
      scopes: ["missing_pre_ledger_artifact"],
    });
    expect(evidence.disclosureLedgerSummary.edges.map((edge) => edge.profileId)).toEqual([
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(status).toMatchObject({
      label: "disclosure ledger not evidence-complete",
      isComplete: false,
    });
    expect(status.detail).toContain("predates reddi.downstream-disclosure-ledger.v1");
  });
});
