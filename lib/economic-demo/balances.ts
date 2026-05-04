import { Connection, PublicKey } from "@solana/web3.js";
import type { DryRunEconomicPlan } from "@/lib/economic-demo/dry-run";

export type BalanceSnapshot = {
  profileId: string;
  walletAddress: string;
  lamports: number | null;
  status: "available" | "balance_unavailable";
  error?: string;
};

export type EconomicDemoBalanceReport = {
  mode: "read_only_balance_snapshot";
  scenarioId: DryRunEconomicPlan["scenarioId"];
  downstreamCallsExecuted: 0;
  snapshots: BalanceSnapshot[];
};

type BalanceConnection = Pick<Connection, "getBalance">;

function uniqueParticipants(plan: DryRunEconomicPlan) {
  const byWallet = new Map<string, { profileId: string; walletAddress: string }>();
  byWallet.set(plan.orchestrator.walletAddress, {
    profileId: plan.orchestrator.id,
    walletAddress: plan.orchestrator.walletAddress,
  });
  for (const edge of plan.edges) {
    byWallet.set(edge.walletAddress, { profileId: edge.toProfileId, walletAddress: edge.walletAddress });
  }
  return [...byWallet.values()];
}

export async function buildBalanceSnapshotReport(
  plan: DryRunEconomicPlan,
  connection: BalanceConnection,
): Promise<EconomicDemoBalanceReport> {
  const snapshots = await Promise.all(
    uniqueParticipants(plan).map(async (participant): Promise<BalanceSnapshot> => {
      try {
        const lamports = await connection.getBalance(new PublicKey(participant.walletAddress));
        return { ...participant, lamports, status: "available" };
      } catch (error) {
        return {
          ...participant,
          lamports: null,
          status: "balance_unavailable",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );

  return {
    mode: "read_only_balance_snapshot",
    scenarioId: plan.scenarioId,
    downstreamCallsExecuted: 0,
    snapshots,
  };
}

export function createDevnetConnection(rpcUrl = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com") {
  return new Connection(rpcUrl, "confirmed");
}
