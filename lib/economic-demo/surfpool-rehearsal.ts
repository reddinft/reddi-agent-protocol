import { createHash } from "node:crypto";

import { Keypair } from "@solana/web3.js";
import {
  economicDemoScenarios,
  REDDI_PROTOCOL_RAIL_FEE_BPS,
  REDDI_PROTOCOL_TREASURY_PROFILE_ID,
  type EconomicDemoScenario,
} from "@/lib/economic-demo/fixture";
import type {
  DryRunEconomicPlan,
  PlannedEconomicEdge,
} from "@/lib/economic-demo/dry-run";

export type SurfpoolRehearsalParticipant = {
  profileId: string;
  role: "end-user" | "orchestrator" | "specialist" | "adapter";
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
  category: "upfront_user_funding" | "downstream_agent_payment" | "protocol_rail_fee";
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
  protocolRailFee: {
    bps: number;
    treasuryProfileId: string;
    totalFeeLamports: number;
    feeTransfers: SurfpoolRehearsalTransfer[];
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
    protocolFeeMatchesExpectedBps: boolean;
    protocolTreasuryCreditedLamports: number;
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

function protocolFeeLamportsFor(amountLamports: number) {
  return Math.round((amountLamports * REDDI_PROTOCOL_RAIL_FEE_BPS) / 10_000);
}

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
  participantMap.set(participantKey(REDDI_PROTOCOL_TREASURY_PROFILE_ID), {
    profileId: REDDI_PROTOCOL_TREASURY_PROFILE_ID,
    role: "adapter",
    catalogWalletAddress: "reddi-protocol-treasury-wallet",
    localWalletAddress: deterministicLocalWallet(REDDI_PROTOCOL_TREASURY_PROFILE_ID),
    startingLamports: 0,
    endingLamports: 0,
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
      category: "upfront_user_funding",
      status: "planned",
    },
  ];
  for (const edge of plan.edges) {
    const amountLamports = lamportsForEdge(edge);
    const from = participantMap.get(participantKey(plan.orchestrator.id));
    const to = participantMap.get(participantKey(edge.toProfileId));
    if (!from || !to)
      throw new Error(`missing_rehearsal_participant:${edge.toProfileId}`);
    const treasury = participantMap.get(participantKey(REDDI_PROTOCOL_TREASURY_PROFILE_ID));
    if (!treasury) throw new Error("missing_protocol_treasury_participant");
    const protocolFeeLamports = protocolFeeLamportsFor(amountLamports);

    transfers.push({
      fromProfileId: plan.orchestrator.id,
      toProfileId: edge.toProfileId,
      fromLocalWalletAddress: from.localWalletAddress,
      toLocalWalletAddress: to.localWalletAddress,
      amountLamports,
      category: "downstream_agent_payment",
      status: "planned",
    });
    if (protocolFeeLamports > 0) {
      transfers.push({
        fromProfileId: plan.orchestrator.id,
        toProfileId: REDDI_PROTOCOL_TREASURY_PROFILE_ID,
        fromLocalWalletAddress: from.localWalletAddress,
        toLocalWalletAddress: treasury.localWalletAddress,
        amountLamports: protocolFeeLamports,
        category: "protocol_rail_fee",
        status: "planned",
      });
    }

    from.endingLamports -= amountLamports + protocolFeeLamports;
    to.endingLamports += amountLamports;
    treasury.endingLamports += protocolFeeLamports;
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
          category: "downstream_agent_payment",
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
          category: "downstream_agent_payment",
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
  const totalProtocolFeeLamports = transfers
    .filter((transfer) => transfer.category === "protocol_rail_fee")
    .reduce((sum, transfer) => sum + transfer.amountLamports, 0);
  const expectedProtocolFeeLamports = transfers
    .filter((transfer) => transfer.category === "downstream_agent_payment")
    .reduce((sum, transfer) => sum + protocolFeeLamportsFor(transfer.amountLamports), 0);
  const protocolTreasury = participantMap.get(participantKey(REDDI_PROTOCOL_TREASURY_PROFILE_ID));

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
    protocolRailFee: {
      bps: REDDI_PROTOCOL_RAIL_FEE_BPS,
      treasuryProfileId: REDDI_PROTOCOL_TREASURY_PROFILE_ID,
      totalFeeLamports: transfers
        .filter((transfer) => transfer.category === "protocol_rail_fee")
        .reduce((sum, transfer) => sum + transfer.amountLamports, 0),
      feeTransfers: transfers.filter((transfer) => transfer.category === "protocol_rail_fee"),
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
      protocolFeeMatchesExpectedBps: totalProtocolFeeLamports === expectedProtocolFeeLamports,
      protocolTreasuryCreditedLamports: (protocolTreasury?.endingLamports ?? 0) - (protocolTreasury?.startingLamports ?? 0),
    },
    negativeProof: {
      blockedTransfers,
      totalBlockedDeltaLamports: 0,
    },
    notes: [
      "Surfpool rehearsal plan only: deterministic local wallets, no devnet wallet mutation.",
      "User upfront funding is modeled before downstream orchestration spends occur.",
      "Every agent-to-agent payment through Reddi Agent Protocol rails includes a 0.05% protocol fee credited to the protocol treasury.",
      "SOL payment route records Jupiter quote semantics only here; no swap is executed by this deterministic API report.",
      "Positive proof requires local paid edges to debit orchestrator and credit specialists by the same lamport total.",
      "Negative proof requires non-allowlisted and over-budget edges to produce zero lamport delta.",
    ],
  };
}
