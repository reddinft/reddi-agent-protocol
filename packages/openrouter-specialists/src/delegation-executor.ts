import type { LiveDelegationAuditEnvelope } from "./delegation-audit.js";
import type { LiveDelegationIntentPlan } from "./delegation-intent.js";

export interface LiveDelegationExecutorInput {
  intentPlan: LiveDelegationIntentPlan;
  auditEnvelope: LiveDelegationAuditEnvelope;
}

export interface LiveDelegationExecutorEvidence {
  schemaVersion: "reddi.live-delegation-executor-evidence.v1";
  executorId: "disabled-live-delegation-executor-gate" | "noop-live-delegation-executor";
  executionStatus: "not_executed";
  reason: "executor_disabled" | "executor_not_implemented";
  message: string;
  intentId: string;
  auditEnvelopeHash: string;
  downstreamCallsExecuted: 0;
  guardrails: {
    noNetworkCallAttempted: true;
    noSignerMaterialUsed: true;
    noSignatureAttempted: true;
    noExternalPersistence: true;
    noDevnetTransferExecuted: true;
    noDownstreamX402Executed: true;
  };
}

export interface LiveDelegationExecutor {
  execute(input: LiveDelegationExecutorInput): Promise<LiveDelegationExecutorEvidence>;
}

export class NoopLiveDelegationExecutor implements LiveDelegationExecutor {
  async execute(input: LiveDelegationExecutorInput): Promise<LiveDelegationExecutorEvidence> {
    return buildNoopLiveDelegationExecutorEvidence(input);
  }
}

export function buildDisabledLiveDelegationExecutorEvidence(input: LiveDelegationExecutorInput): LiveDelegationExecutorEvidence {
  return {
    schemaVersion: "reddi.live-delegation-executor-evidence.v1",
    executorId: "disabled-live-delegation-executor-gate",
    executionStatus: "not_executed",
    reason: "executor_disabled",
    message: "Live downstream delegation executor invocation is disabled by configuration.",
    intentId: input.intentPlan.intentId,
    auditEnvelopeHash: input.auditEnvelope.envelopeHash,
    downstreamCallsExecuted: 0,
    guardrails: {
      noNetworkCallAttempted: true,
      noSignerMaterialUsed: true,
      noSignatureAttempted: true,
      noExternalPersistence: true,
      noDevnetTransferExecuted: true,
      noDownstreamX402Executed: true,
    },
  };
}

export function buildNoopLiveDelegationExecutorEvidence(input: LiveDelegationExecutorInput): LiveDelegationExecutorEvidence {
  return {
    schemaVersion: "reddi.live-delegation-executor-evidence.v1",
    executorId: "noop-live-delegation-executor",
    executionStatus: "not_executed",
    reason: "executor_not_implemented",
    message: "Live downstream delegation executor is intentionally not implemented in this guarded iteration.",
    intentId: input.intentPlan.intentId,
    auditEnvelopeHash: input.auditEnvelope.envelopeHash,
    downstreamCallsExecuted: 0,
    guardrails: {
      noNetworkCallAttempted: true,
      noSignerMaterialUsed: true,
      noSignatureAttempted: true,
      noExternalPersistence: true,
      noDevnetTransferExecuted: true,
      noDownstreamX402Executed: true,
    },
  };
}
