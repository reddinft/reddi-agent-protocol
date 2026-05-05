import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  getDisclosureLedgerEvidenceStatus,
  getWebpageLiveWorkflowEvidence,
} from "@/lib/economic-demo/webpage-live-workflow-evidence";
import { getWebpageLiveWorkflowEvidence as getServerWebpageLiveWorkflowEvidence } from "@/lib/economic-demo/webpage-live-workflow-evidence-server";

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

  it("uses the latest generated evidence-pack disclosure summary when available", () => {
    const root = mkdtempSync(join(tmpdir(), "reddi-evidence-pack-ui-"));
    const packDir = join(root, "artifacts", "economic-demo-evidence-pack", "20260505T000001Z");
    mkdirSync(packDir, { recursive: true });
    writeFileSync(
      join(packDir, "evidence-pack.json"),
      `${JSON.stringify(
        {
          schemaVersion: "reddi.economic-demo.judge-evidence-pack.v1",
          generatedAt: "2026-05-05T00:00:01.000Z",
          sourceArtifactPath: "artifacts/economic-demo-webpage-live-x402-workflow/synthetic/summary.json",
          disclosureLedgerSummary: {
            schemaVersion: "reddi.economic-demo.disclosure-ledger-summary.v1",
            requiredLedgerSchemaVersion: "reddi.downstream-disclosure-ledger.v1",
            allEdgesHaveDisclosureLedger: true,
            evidenceComplete: true,
            incompleteReason: null,
            edgeCount: 1,
            totalLedgerEntries: 1,
            scopes: ["called_marketplace_agent"],
            edges: [
              {
                step: 1,
                profileId: "planning-agent",
                disclosureScope: "called_marketplace_agent",
                entryCount: 1,
                entries: [
                  {
                    calledProfileId: "research-agent",
                    walletAddress: "11111111111111111111111111111111",
                    endpoint: "https://research.example/v1/chat/completions",
                    payloadSummary: "research brief",
                    payloadHashPresent: true,
                    x402: {
                      state: "paid",
                      amount: "0.01",
                      currency: "USDC",
                      receiptPresent: true,
                      challengePresent: true,
                    },
                    attestorLinks: [],
                    obfuscation: null,
                  },
                ],
              },
            ],
          },
        },
        null,
        2,
      )}\n`,
    );

    const evidence = getServerWebpageLiveWorkflowEvidence(join(root, "artifacts", "economic-demo-evidence-pack"));

    expect(evidence.latestEvidencePack).toMatchObject({
      artifactPath: join(root, "artifacts", "economic-demo-evidence-pack", "20260505T000001Z", "evidence-pack.json"),
      generatedAt: "2026-05-05T00:00:01.000Z",
    });
    expect(evidence.disclosureLedgerSummary).toMatchObject({
      evidenceComplete: true,
      totalLedgerEntries: 1,
      scopes: ["called_marketplace_agent"],
    });
    expect(getDisclosureLedgerEvidenceStatus(evidence.disclosureLedgerSummary)).toMatchObject({
      label: "disclosure ledger complete",
      isComplete: true,
    });
  });
});
