import { buildRapMcpBridgeSurfpoolProof } from "@/lib/mcp-bridge-demo/surfpool-proof";

describe("RAP MCP Bridge Surfpool proof plan", () => {
  it("keeps devnet blocked behind local Surfpool proof boundary", () => {
    const proof = buildRapMcpBridgeSurfpoolProof();
    expect(proof.schemaVersion).toBe("reddi.rap-mcp-bridge.surfpool-proof.v1");
    expect(proof.claimBoundary).toBe("local_validator_only_no_devnet_no_mainnet");
    expect(proof.quote.quoteAuthority).toBe("bridge_synthetic");
    expect(proof.quote.binding).toBe(false);
    expect(proof.verification.devnetSettlement).toBe("not_applicable");
    expect(proof.verification.mainnetSettlement).toBe("not_applicable");
    expect(proof.nextGate).toBe("execute_local_surfpool_transactions_before_devnet");
  });

  it("computes the 0.05% protocol fee on local payment semantics", () => {
    const proof = buildRapMcpBridgeSurfpoolProof();
    expect(proof.localPaymentSemantics.protocolFeeBps).toBe(5);
    expect(proof.localPaymentSemantics.protocolFeeLamports).toBe(625);
    expect(proof.localPaymentSemantics.totalDebitLamports).toBe(1_250_625);
  });

  it("exports safe public disclosure evidence without raw prompt text", () => {
    const proof = buildRapMcpBridgeSurfpoolProof();
    expect(proof.disclosureLedger.safePublicEvidenceOnly).toBe(true);
    expect(proof.disclosureLedger.entries).toHaveLength(1);
    const serialized = JSON.stringify(proof.disclosureLedger);
    expect(serialized).not.toContain("market brief about paid specialist agents");
    expect(proof.disclosureLedger.entries[0].payloadHash).toMatch(/^sha256:/);
  });
});
