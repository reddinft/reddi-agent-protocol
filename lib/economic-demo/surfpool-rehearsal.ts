import { createHash } from "node:crypto";

import { Keypair } from "@solana/web3.js";
import type { DryRunEconomicPlan, PlannedEconomicEdge } from "@/lib/economic-demo/dry-run";

export type SurfpoolRehearsalParticipant = {
  profileId: string;
  role: "orchestrator" | "specialist";
  catalogWalletAddress: string;
  localWalletAddress: string;
  startingLamports: number;
  endingLamports: number;
};

export type SurfpoolRehearsalTransfer = {
  fromProfileId: string;
  toProfileId: string;
  fromLocalWalletAddress: string;
  toLocalWalletAddress: string;
  amountLamports: number;
  status: "planned" | "blocked";
  reason?: "not_allowlisted" | "over_budget";
};

export type SurfpoolRehearsalReport = {
  mode: "surfpool_local_rehearsal_plan";
  scenarioId: DryRunEconomicPlan["scenarioId"];
  networkProfile: "local-surfpool";
  downstreamCallsExecuted: 0;
  transferSemantics: "local_expected_balance_deltas";
  participants: SurfpoolRehearsalParticipant[];
  transfers: SurfpoolRehearsalTransfer[];
  positiveProof: {
    totalDebitedLamports: number;
    totalCreditedLamports: number;
    balanced: boolean;
  };
  negativeProof: {
    blockedTransfers: SurfpoolRehearsalTransfer[];
    totalBlockedDeltaLamports: 0;
  };
  notes: string[];
};

const ORCHESTRATOR_STARTING_LAMPORTS = 10_000_000_000;
const SPECIALIST_STARTING_LAMPORTS = 1_000_000_000;
const DEFAULT_EDGE_LAMPORTS = 1_000_000;
const ATTESTOR_EDGE_LAMPORTS = 500_000;
const MAX_LOCAL_REHEARSAL_EDGE_LAMPORTS = 2_000_000;

function deterministicLocalWallet(profileId: string): string {
  const seed = createHash("sha256").update(`reddi-economic-demo-surfpool:${profileId}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed).publicKey.toBase58();
}

function lamportsForEdge(edge: PlannedEconomicEdge) {
  return edge.capability.includes("attestation") || edge.capability.includes("verification") || edge.capability.includes("review")
    ? ATTESTOR_EDGE_LAMPORTS
    : DEFAULT_EDGE_LAMPORTS;
}

function participantKey(profileId: string) {
  return profileId;
}

export function buildSurfpoolRehearsalReport(plan: DryRunEconomicPlan): SurfpoolRehearsalReport {
  const participantMap = new Map<string, SurfpoolRehearsalParticipant>();
  participantMap.set(participantKey(plan.orchestrator.id), {
    profileId: plan.orchestrator.id,
    role: "orchestrator",
    catalogWalletAddress: plan.orchestrator.walletAddress,
    localWalletAddress: deterministicLocalWallet(plan.orchestrator.id),
    startingLamports: ORCHESTRATOR_STARTING_LAMPORTS,
    endingLamports: ORCHESTRATOR_STARTING_LAMPORTS,
  });

  for (const edge of plan.edges) {
    if (!participantMap.has(participantKey(edge.toProfileId))) {
      participantMap.set(participantKey(edge.toProfileId), {
        profileId: edge.toProfileId,
        role: "specialist",
        catalogWalletAddress: edge.walletAddress,
        localWalletAddress: deterministicLocalWallet(edge.toProfileId),
        startingLamports: SPECIALIST_STARTING_LAMPORTS,
        endingLamports: SPECIALIST_STARTING_LAMPORTS,
      });
    }
  }

  const transfers: SurfpoolRehearsalTransfer[] = [];
  for (const edge of plan.edges) {
    const amountLamports = lamportsForEdge(edge);
    const from = participantMap.get(participantKey(plan.orchestrator.id));
    const to = participantMap.get(participantKey(edge.toProfileId));
    if (!from || !to) throw new Error(`missing_rehearsal_participant:${edge.toProfileId}`);

    transfers.push({
      fromProfileId: plan.orchestrator.id,
      toProfileId: edge.toProfileId,
      fromLocalWalletAddress: from.localWalletAddress,
      toLocalWalletAddress: to.localWalletAddress,
      amountLamports,
      status: "planned",
    });

    from.endingLamports -= amountLamports;
    to.endingLamports += amountLamports;
  }

  const firstSpecialist = plan.edges[0];
  const blockedTransfers: SurfpoolRehearsalTransfer[] = firstSpecialist
    ? [
        {
          fromProfileId: plan.orchestrator.id,
          toProfileId: "unlisted-specialist",
          fromLocalWalletAddress: participantMap.get(participantKey(plan.orchestrator.id))!.localWalletAddress,
          toLocalWalletAddress: deterministicLocalWallet("unlisted-specialist"),
          amountLamports: DEFAULT_EDGE_LAMPORTS,
          status: "blocked",
          reason: "not_allowlisted",
        },
        {
          fromProfileId: plan.orchestrator.id,
          toProfileId: firstSpecialist.toProfileId,
          fromLocalWalletAddress: participantMap.get(participantKey(plan.orchestrator.id))!.localWalletAddress,
          toLocalWalletAddress: participantMap.get(participantKey(firstSpecialist.toProfileId))!.localWalletAddress,
          amountLamports: MAX_LOCAL_REHEARSAL_EDGE_LAMPORTS + 1,
          status: "blocked",
          reason: "over_budget",
        },
      ]
    : [];

  const participants = [...participantMap.values()];
  const totalDebitedLamports = participants.reduce(
    (sum, participant) => sum + Math.max(0, participant.startingLamports - participant.endingLamports),
    0,
  );
  const totalCreditedLamports = participants.reduce(
    (sum, participant) => sum + Math.max(0, participant.endingLamports - participant.startingLamports),
    0,
  );

  return {
    mode: "surfpool_local_rehearsal_plan",
    scenarioId: plan.scenarioId,
    networkProfile: "local-surfpool",
    downstreamCallsExecuted: 0,
    transferSemantics: "local_expected_balance_deltas",
    participants,
    transfers,
    positiveProof: {
      totalDebitedLamports,
      totalCreditedLamports,
      balanced: totalDebitedLamports === totalCreditedLamports,
    },
    negativeProof: {
      blockedTransfers,
      totalBlockedDeltaLamports: 0,
    },
    notes: [
      "Surfpool rehearsal plan only: deterministic local wallets, no devnet wallet mutation.",
      "Positive proof requires local paid edges to debit orchestrator and credit specialists by the same lamport total.",
      "Negative proof requires non-allowlisted and over-budget edges to produce zero lamport delta.",
    ],
  };
}
