import { buildEconomicDemoLedgerReconciliation } from "@/lib/economic-demo/ledger-reconciliation";

describe("economic demo ledger reconciliation", () => {
  it("reconciles controlled x402 challenge amounts against local transfer semantics without claiming real settlement", () => {
    const reconciliation = buildEconomicDemoLedgerReconciliation();

    expect(reconciliation.scenarioId).toBe("webpage");
    expect(reconciliation.edgeCount).toBe(4);
    expect(reconciliation.edges.map((edge) => edge.profileId)).toEqual([
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(reconciliation.totals.challengeAmountUsdc).toBe("0.13");
    expect(reconciliation.totals.challengeAmountMicrousd).toBe(130000);
    expect(reconciliation.totals.controlledPaidCompletions).toBe(4);
    expect(reconciliation.totals.realSettlementsVerified).toBe(0);
    expect(reconciliation.totals.surfpoolLocalTransferLamports).toBe(3500000);
    expect(reconciliation.edges.every((edge) => edge.controlledReceiptStatus === "satisfied_demo_only")).toBe(true);
    expect(reconciliation.edges.every((edge) => edge.realSettlementStatus === "not_verified")).toBe(true);
    expect(reconciliation.guardrails).toMatchObject({
      noLiveCallsFromUi: true,
      noDevnetTransferFromUi: true,
      controlledDemoReceiptsClearlyLabeled: true,
      noProductionSettlementClaim: true,
    });
    expect(reconciliation.proofLayers.find((layer) => layer.id === "real_devnet_receipt_verifier")?.status).toBe("not_implemented");
  });
});
