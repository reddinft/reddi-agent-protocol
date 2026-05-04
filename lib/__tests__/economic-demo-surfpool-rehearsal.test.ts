import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";
import { buildSurfpoolRehearsalReport } from "@/lib/economic-demo/surfpool-rehearsal";

describe("economic demo Surfpool rehearsal plan", () => {
  it("builds deterministic local wallet balance deltas for the webpage workflow", () => {
    const plan = buildEconomicDemoDryRunPlan("webpage");
    const report = buildSurfpoolRehearsalReport(plan);

    expect(report.mode).toBe("surfpool_local_rehearsal_plan");
    expect(report.networkProfile).toBe("local-surfpool");
    expect(report.downstreamCallsExecuted).toBe(0);
    expect(report.transfers).toHaveLength(plan.edges.length);
    expect(report.positiveProof).toMatchObject({ balanced: true });
    expect(report.positiveProof.totalDebitedLamports).toBeGreaterThan(0);
    expect(report.positiveProof.totalDebitedLamports).toBe(report.positiveProof.totalCreditedLamports);
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
