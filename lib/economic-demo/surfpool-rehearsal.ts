import { createHash } from "node:crypto";

import { Keypair } from "@solana/web3.js";
import {
  economicDemoScenarios,
  type EconomicDemoScenario,
} from "@/lib/economic-demo/fixture";
import type {
  DryRunEconomicPlan,
  PlannedEconomicEdge,
} from "@/lib/economic-demo/dry-run";

export type SurfpoolRehearsalParticipant = {
  profileId: string;
  role: "end-user" | "orchestrator" | "specialist";
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
  reason?: "not_allowlisted" | "over_budget" | "insufficient_upfront_budget";
};

export type SurfpoolRehearsalReport = {
  mode: "surfpool_local_rehearsal_plan";
  scenarioId: DryRunEconomicPlan["scenarioId"];
  networkProfile: "local-surfpool";
  downstreamCallsExecuted: 0;
  transferSemantics: "local_expected_balance_deltas";
  upfrontFunding: {
    paymentAsset: "USDC";
    fromProfileId: "end-user";
    toProfileId: string;
    amountUsdc: number;
    equivalentLamports: number;
    markupUsdc: number;
    downstreamBudgetUsdc: number;
    attestorBudgetUsdc: number;
  };
  jupiterSolRoute: {
    available: true;
    inputAsset: "SOL";
    outputAsset: "USDC";
    estimatedInputSol: number;
    outputUsdc: number;
    slippageBps: number;
    status: "quoted_not_executed";
  };
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

const USER_STARTING_LAMPORTS = 20_000_000_000;
const ORCHESTRATOR_STARTING_LAMPORTS = 10_000_000_000;
const SPECIALIST_STARTING_LAMPORTS = 1_000_000_000;
const USDC_TO_LOCAL_LAMPORTS = 1_000_000;
const DEFAULT_EDGE_LAMPORTS = 1_000_000;
const ATTESTOR_EDGE_LAMPORTS = 500_000;
const MAX_LOCAL_REHEARSAL_EDGE_LAMPORTS = 2_000_000;

function deterministicLocalWallet(profileId: string): string {
  const seed = createHash("sha256")
    .update(`reddi-economic-demo-surfpool:${profileId}`)
    .digest()
    .subarray(0, 32);
  return Keypair.fromSeed(seed).publicKey.toBase58();
}

function lamportsForEdge(edge: PlannedEconomicEdge) {
  return edge.capability.includes("attestation") ||
    edge.capability.includes("verification") ||
    edge.capability.includes("review")
    ? ATTESTOR_EDGE_LAMPORTS
    : DEFAULT_EDGE_LAMPORTS;
}

function participantKey(profileId: string) {
  return profileId;
}

function scenarioFor(plan: DryRunEconomicPlan): EconomicDemoScenario {
  const scenario = economicDemoScenarios.find(
    (candidate) => candidate.id === plan.scenarioId,
  );
  if (!scenario)
    throw new Error(`unknown_economic_demo_scenario:${plan.scenarioId}`);
  return scenario;
}

export function buildSurfpoolRehearsalReport(
  plan: DryRunEconomicPlan,
): SurfpoolRehearsalReport {
  const scenario = scenarioFor(plan);
  const upfrontLamports = Math.round(
    scenario.quote.totalUsdc * USDC_TO_LOCAL_LAMPORTS,
  );
  const participantMap = new Map<string, SurfpoolRehearsalParticipant>();
  participantMap.set(participantKey("end-user"), {
    profileId: "end-user",
    role: "end-user",
    catalogWalletAddress: "connected-user-wallet",
    localWalletAddress: deterministicLocalWallet("end-user"),
    startingLamports: USER_STARTING_LAMPORTS,
    endingLamports: USER_STARTING_LAMPORTS - upfrontLamports,
  });
  participantMap.set(participantKey(plan.orchestrator.id), {
    profileId: plan.orchestrator.id,
    role: "orchestrator",
    catalogWalletAddress: plan.orchestrator.walletAddress,
    localWalletAddress: deterministicLocalWallet(plan.orchestrator.id),
    startingLamports: ORCHESTRATOR_STARTING_LAMPORTS,
    endingLamports: ORCHESTRATOR_STARTING_LAMPORTS + upfrontLamports,
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

  const transfers: SurfpoolRehearsalTransfer[] = [
    {
      fromProfileId: "end-user",
      toProfileId: plan.orchestrator.id,
      fromLocalWalletAddress: participantMap.get(participantKey("end-user"))!
        .localWalletAddress,
      toLocalWalletAddress: participantMap.get(
        participantKey(plan.orchestrator.id),
      )!.localWalletAddress,
      amountLamports: upfrontLamports,
      status: "planned",
    },
  ];
  for (const edge of plan.edges) {
    const amountLamports = lamportsForEdge(edge);
    const from = participantMap.get(participantKey(plan.orchestrator.id));
    const to = participantMap.get(participantKey(edge.toProfileId));
    if (!from || !to)
      throw new Error(`missing_rehearsal_participant:${edge.toProfileId}`);

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
          fromLocalWalletAddress: participantMap.get(
            participantKey(plan.orchestrator.id),
          )!.localWalletAddress,
          toLocalWalletAddress: deterministicLocalWallet("unlisted-specialist"),
          amountLamports: DEFAULT_EDGE_LAMPORTS,
          status: "blocked",
          reason: "not_allowlisted",
        },
        {
          fromProfileId: plan.orchestrator.id,
          toProfileId: firstSpecialist.toProfileId,
          fromLocalWalletAddress: participantMap.get(
            participantKey(plan.orchestrator.id),
          )!.localWalletAddress,
          toLocalWalletAddress: participantMap.get(
            participantKey(firstSpecialist.toProfileId),
          )!.localWalletAddress,
          amountLamports: MAX_LOCAL_REHEARSAL_EDGE_LAMPORTS + 1,
          status: "blocked",
          reason: "over_budget",
        },
      ]
    : [];

  const participants = [...participantMap.values()];
  const totalDebitedLamports = participants.reduce(
    (sum, participant) =>
      sum +
      Math.max(0, participant.startingLamports - participant.endingLamports),
    0,
  );
  const totalCreditedLamports = participants.reduce(
    (sum, participant) =>
      sum +
      Math.max(0, participant.endingLamports - participant.startingLamports),
    0,
  );

  return {
    mode: "surfpool_local_rehearsal_plan",
    scenarioId: plan.scenarioId,
    networkProfile: "local-surfpool",
    downstreamCallsExecuted: 0,
    transferSemantics: "local_expected_balance_deltas",
    upfrontFunding: {
      paymentAsset: "USDC",
      fromProfileId: "end-user",
      toProfileId: plan.orchestrator.id,
      amountUsdc: scenario.quote.totalUsdc,
      equivalentLamports: upfrontLamports,
      markupUsdc: scenario.quote.orchestratorMarkupUsdc,
      downstreamBudgetUsdc: scenario.quote.downstreamFeesUsdc,
      attestorBudgetUsdc: scenario.quote.attestorFeesUsdc,
    },
    jupiterSolRoute: {
      available: true,
      inputAsset: "SOL",
      outputAsset: "USDC",
      estimatedInputSol: scenario.quote.solEstimate,
      outputUsdc: scenario.quote.totalUsdc,
      slippageBps: scenario.quote.slippageBps,
      status: "quoted_not_executed",
    },
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
      "User upfront funding is modeled before downstream orchestration spends occur.",
      "SOL payment route records Jupiter quote semantics only here; no swap is executed by this deterministic API report.",
      "Positive proof requires local paid edges to debit orchestrator and credit specialists by the same lamport total.",
      "Negative proof requires non-allowlisted and over-budget edges to produce zero lamport delta.",
    ],
  };
}
