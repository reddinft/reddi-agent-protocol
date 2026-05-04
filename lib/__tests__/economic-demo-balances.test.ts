import { PublicKey } from "@solana/web3.js";
import { buildBalanceSnapshotReport } from "@/lib/economic-demo/balances";
import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";

describe("economic demo balance snapshots", () => {
  it("reads balances for orchestrator and planned downstream participants without executing calls", async () => {
    const plan = buildEconomicDemoDryRunPlan("webpage");
    const getBalance = jest.fn(async (wallet: PublicKey) => wallet.toBase58().length);

    const report = await buildBalanceSnapshotReport(plan, { getBalance });

    expect(report.mode).toBe("read_only_balance_snapshot");
    expect(report.scenarioId).toBe("webpage");
    expect(report.downstreamCallsExecuted).toBe(0);
    expect(report.snapshots.map((snapshot) => snapshot.profileId)).toEqual([
      "agentic-workflow-system",
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(report.snapshots.every((snapshot) => snapshot.status === "available" && snapshot.lamports !== null)).toBe(true);
    expect(getBalance).toHaveBeenCalledTimes(5);
  });

  it("marks unavailable balances without failing the whole report", async () => {
    const plan = buildEconomicDemoDryRunPlan("picture");
    const getBalance = jest.fn(async (wallet: PublicKey) => {
      if (wallet.toBase58() === plan.orchestrator.walletAddress) throw new Error("rpc unavailable");
      return 123;
    });

    const report = await buildBalanceSnapshotReport(plan, { getBalance });

    expect(report.downstreamCallsExecuted).toBe(0);
    expect(report.snapshots.find((snapshot) => snapshot.profileId === "tool-using-agent")?.status).toBe("balance_unavailable");
    expect(report.snapshots.some((snapshot) => snapshot.status === "available")).toBe(true);
  });
});
