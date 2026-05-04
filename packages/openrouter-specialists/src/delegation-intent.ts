import { createHash } from "node:crypto";
import type { DelegationBudgetDecisionAllowed } from "./delegation-budget.js";
import type { DelegationPlan, RankedMarketplaceCandidate } from "./marketplace-client.js";

export interface LiveDelegationIntentPlanInput {
  requesterProfileId: string;
  task: string;
  requiredCapabilities: string[];
  selectedCandidate?: RankedMarketplaceCandidate;
  delegationPlan: DelegationPlan;
  budget: DelegationBudgetDecisionAllowed;
  maxDownstreamCalls: number;
  maxDownstreamLamports: number;
}

export interface LiveDelegationIntentPlan {
  schemaVersion: "reddi.live-delegation-intent.v1";
  intentId: string;
  executionStatus: "not_executed";
  requesterProfileId: string;
  selectedCandidate?: {
    profileId: string;
    displayName: string;
    endpointPath: string;
    walletAddress?: string;
    matchedCapabilities: string[];
    price: RankedMarketplaceCandidate["price"];
    safetyMode: string;
  };
  task: string;
  requiredCapabilities: string[];
  estimatedLamports: number;
  budget: DelegationBudgetDecisionAllowed;
  guardrails: {
    liveCallsEnabled: true;
    downstreamCallsExecuted: 0;
    maxDownstreamCalls: number;
    maxDownstreamLamports: number;
    noSignerMaterialUsed: true;
    noDevnetTransferExecuted: true;
    noDownstreamX402Executed: true;
  };
  requiredAttestor?: string;
  candidateCount: number;
}

export function buildLiveDelegationIntentPlan(input: LiveDelegationIntentPlanInput): LiveDelegationIntentPlan {
  const selectedCandidate = input.selectedCandidate;
  const identityPayload = JSON.stringify({
    requesterProfileId: input.requesterProfileId,
    selectedCandidateProfileId: selectedCandidate?.profileId ?? null,
    task: input.task,
    requiredCapabilities: input.requiredCapabilities,
    estimatedLamports: input.budget.estimatedLamports,
    candidateCount: input.delegationPlan.candidates.length,
  });
  const intentId = `intent_${createHash("sha256").update(identityPayload).digest("hex").slice(0, 24)}`;

  return {
    schemaVersion: "reddi.live-delegation-intent.v1",
    intentId,
    executionStatus: "not_executed",
    requesterProfileId: input.requesterProfileId,
    selectedCandidate: selectedCandidate
      ? {
          profileId: selectedCandidate.profileId,
          displayName: selectedCandidate.displayName,
          endpointPath: selectedCandidate.endpointPath,
          walletAddress: selectedCandidate.walletAddress,
          matchedCapabilities: selectedCandidate.matchedCapabilities,
          price: selectedCandidate.price,
          safetyMode: selectedCandidate.safetyMode,
        }
      : undefined,
    task: input.task,
    requiredCapabilities: input.requiredCapabilities,
    estimatedLamports: input.budget.estimatedLamports,
    budget: input.budget,
    guardrails: {
      liveCallsEnabled: true,
      downstreamCallsExecuted: 0,
      maxDownstreamCalls: input.maxDownstreamCalls,
      maxDownstreamLamports: input.maxDownstreamLamports,
      noSignerMaterialUsed: true,
      noDevnetTransferExecuted: true,
      noDownstreamX402Executed: true,
    },
    requiredAttestor: input.delegationPlan.requiredAttestor,
    candidateCount: input.delegationPlan.candidates.length,
  };
}
