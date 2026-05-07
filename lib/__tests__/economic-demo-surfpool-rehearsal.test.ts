import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";
import { REDDI_PROTOCOL_RAIL_FEE_BPS, REDDI_PROTOCOL_TREASURY_PROFILE_ID } from "@/lib/economic-demo/fixture";
import { buildSurfpoolRehearsalReport } from "@/lib/economic-demo/surfpool-rehearsal";

describe("economic demo Surfpool rehearsal plan", () => {
  it("builds deterministic local wallet balance deltas for the webpage workflow", () => {
    const plan = buildEconomicDemoDryRunPlan("webpage");
    const report = buildSurfpoolRehearsalReport(plan);

    expect(report.mode).toBe("surfpool_local_rehearsal_plan");
    expect(report.networkProfile).toBe("local-surfpool");
    expect(report.downstreamCallsExecuted).toBe(0);
    expect(report.transfers.filter((transfer) => transfer.category === "downstream_agent_payment")).toHaveLength(plan.edges.length);
    expect(report.positiveProof).toMatchObject({ balanced: true });
    expect(report.positiveProof.totalDebitedLamports).toBeGreaterThan(0);
    expect(report.positiveProof.totalDebitedLamports).toBe(report.positiveProof.totalCreditedLamports);
  });

  it("charges a 0.05% Reddi Agent Protocol fee on every agent-to-agent rail payment", () => {
    const plan = buildEconomicDemoDryRunPlan("webpage");
    const report = buildSurfpoolRehearsalReport(plan);

    const downstreamTotal = report.transfers
      .filter((transfer) => transfer.category === "downstream_agent_payment")
      .reduce((sum, transfer) => sum + transfer.amountLamports, 0);
    const expectedProtocolFee = Math.round((downstreamTotal * REDDI_PROTOCOL_RAIL_FEE_BPS) / 10_000);
    const treasury = report.participants.find((participant) => participant.profileId === REDDI_PROTOCOL_TREASURY_PROFILE_ID);

    expect(report.protocolRailFee).toMatchObject({
      bps: 5,
      treasuryProfileId: REDDI_PROTOCOL_TREASURY_PROFILE_ID,
      totalFeeLamports: expectedProtocolFee,
    });
    expect(report.protocolRailFee.feeTransfers).toHaveLength(plan.edges.length);
    expect(treasury?.endingLamports).toBe(expectedProtocolFee);
  });

  it("keeps blocked negative-proof transfers at zero balance delta", () => {
    const report = buildSurfpoolRehearsalReport(buildEconomicDemoDryRunPlan("research"));

    expect(report.negativeProof.totalBlockedDeltaLamports).toBe(0);
    expect(report.negativeProof.blockedTransfers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: "blocked", reason: "not_allowlisted" }),
        expect.objectContaining({ status: "blocked", reason: "over_budget" }),
      ]),
    );
  });

  it("deduplicates local wallet derivation by profile id across repeated builds", () => {
    const first = buildSurfpoolRehearsalReport(buildEconomicDemoDryRunPlan("picture"));
    const second = buildSurfpoolRehearsalReport(buildEconomicDemoDryRunPlan("picture"));

    expect(first.participants.map((participant) => participant.localWalletAddress)).toEqual(
      second.participants.map((participant) => participant.localWalletAddress),
    );
  });
});
