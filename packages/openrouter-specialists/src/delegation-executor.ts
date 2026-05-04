import type { LiveDelegationAuditEnvelope } from "./delegation-audit.js";
import type { LiveDelegationIntentPlan } from "./delegation-intent.js";

export interface LiveDelegationExecutorInput {
  intentPlan: LiveDelegationIntentPlan;
  auditEnvelope: LiveDelegationAuditEnvelope;
}

export interface LiveDelegationExecutorTarget {
  profileId: string;
  endpoint: string;
  walletAddress?: string;
}

export interface LiveDelegationExecutorEvidence {
  schemaVersion: "reddi.live-delegation-executor-evidence.v1";
  executorId: "disabled-live-delegation-executor-gate" | "noop-live-delegation-executor" | "fetch-live-delegation-executor";
  executionStatus: "not_executed" | "attempted";
  reason:
    | "executor_disabled"
    | "executor_not_implemented"
    | "missing_selected_candidate"
    | "endpoint_not_allowlisted"
    | "downstream_call_limit_exceeded"
    | "downstream_lamport_limit_exceeded"
    | "payment_provider_missing"
    | "downstream_call_attempted";
  message: string;
  intentId: string;
  auditEnvelopeHash: string;
  downstreamCallsExecuted: 0 | 1;
  target?: LiveDelegationExecutorTarget;
  downstreamResponse?: {
    status: number;
    ok: boolean;
    contentType?: string;
  };
  guardrails: {
    noNetworkCallAttempted: boolean;
    noSignerMaterialUsed: true;
    noSignatureAttempted: true;
    noExternalPersistence: true;
    noDevnetTransferExecuted: true;
    noDownstreamX402Executed: boolean;
  };
}

export interface LiveDelegationExecutor {
  execute(input: LiveDelegationExecutorInput): Promise<LiveDelegationExecutorEvidence>;
}

export interface DownstreamPaymentHeaderProviderInput {
  intentPlan: LiveDelegationIntentPlan;
  auditEnvelope: LiveDelegationAuditEnvelope;
  target: LiveDelegationExecutorTarget;
}

export interface DownstreamPaymentHeaderProvider {
  paymentHeader(input: DownstreamPaymentHeaderProviderInput): Promise<string>;
}

export interface FetchLiveDelegationExecutorOptions {
  allowlistedEndpoints: Record<string, string>;
  paymentHeaderProvider?: DownstreamPaymentHeaderProvider;
  fetchImpl?: typeof fetch;
}

export class NoopLiveDelegationExecutor implements LiveDelegationExecutor {
  async execute(input: LiveDelegationExecutorInput): Promise<LiveDelegationExecutorEvidence> {
    return buildNoopLiveDelegationExecutorEvidence(input);
  }
}

export class FetchLiveDelegationExecutor implements LiveDelegationExecutor {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly options: FetchLiveDelegationExecutorOptions) {
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async execute(input: LiveDelegationExecutorInput): Promise<LiveDelegationExecutorEvidence> {
    const selected = input.intentPlan.selectedCandidate;
    if (!selected) {
      return buildFetchExecutorNotExecutedEvidence(input, "missing_selected_candidate", "Live delegation intent has no selected candidate.");
    }

    const allowlistedEndpoint = this.options.allowlistedEndpoints[selected.profileId];
    const candidateEndpoint = allowlistedEndpoint ? new URL(selected.endpointPath, allowlistedEndpoint).toString() : selected.endpointPath;
    if (!allowlistedEndpoint || candidateEndpoint !== allowlistedEndpoint) {
      return buildFetchExecutorNotExecutedEvidence(input, "endpoint_not_allowlisted", `Selected candidate ${selected.profileId} endpoint is not exactly allowlisted for live delegation.`, {
        profileId: selected.profileId,
        endpoint: candidateEndpoint,
        walletAddress: selected.walletAddress,
      });
    }

    if (input.intentPlan.guardrails.maxDownstreamCalls !== 1) {
      return buildFetchExecutorNotExecutedEvidence(input, "downstream_call_limit_exceeded", "First live delegation smoke requires maxDownstreamCalls to be exactly 1.", {
        profileId: selected.profileId,
        endpoint: allowlistedEndpoint,
        walletAddress: selected.walletAddress,
      });
    }

    if (input.intentPlan.estimatedLamports > input.intentPlan.guardrails.maxDownstreamLamports) {
      return buildFetchExecutorNotExecutedEvidence(input, "downstream_lamport_limit_exceeded", "Estimated downstream lamports exceed configured live delegation limit.", {
        profileId: selected.profileId,
        endpoint: allowlistedEndpoint,
        walletAddress: selected.walletAddress,
      });
    }

    const target = {
      profileId: selected.profileId,
      endpoint: allowlistedEndpoint,
      walletAddress: selected.walletAddress,
    };

    if (!this.options.paymentHeaderProvider) {
      return buildFetchExecutorNotExecutedEvidence(input, "payment_provider_missing", "Downstream payment header provider is required before any live network call.", target);
    }

    const paymentHeader = await this.options.paymentHeaderProvider.paymentHeader({ ...input, target });
    const response = await this.fetchImpl(target.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x402-payment": paymentHeader,
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: input.intentPlan.task }],
        metadata: {
          mode: "delegated_live_smoke",
          intentId: input.intentPlan.intentId,
          auditEnvelopeHash: input.auditEnvelope.envelopeHash,
          requesterProfileId: input.intentPlan.requesterProfileId,
        },
      }),
    });

    return {
      schemaVersion: "reddi.live-delegation-executor-evidence.v1",
      executorId: "fetch-live-delegation-executor",
      executionStatus: "attempted",
      reason: "downstream_call_attempted",
      message: "Exactly one allowlisted downstream live delegation call was attempted.",
      intentId: input.intentPlan.intentId,
      auditEnvelopeHash: input.auditEnvelope.envelopeHash,
      downstreamCallsExecuted: 1,
      target,
      downstreamResponse: {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type") ?? undefined,
      },
      guardrails: {
        noNetworkCallAttempted: false,
        noSignerMaterialUsed: true,
        noSignatureAttempted: true,
        noExternalPersistence: true,
        noDevnetTransferExecuted: true,
        noDownstreamX402Executed: false,
      },
    };
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
    guardrails: nonExecutingGuardrails(),
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
    guardrails: nonExecutingGuardrails(),
  };
}

function buildFetchExecutorNotExecutedEvidence(
  input: LiveDelegationExecutorInput,
  reason: LiveDelegationExecutorEvidence["reason"],
  message: string,
  target?: LiveDelegationExecutorTarget,
): LiveDelegationExecutorEvidence {
  return {
    schemaVersion: "reddi.live-delegation-executor-evidence.v1",
    executorId: "fetch-live-delegation-executor",
    executionStatus: "not_executed",
    reason,
    message,
    intentId: input.intentPlan.intentId,
    auditEnvelopeHash: input.auditEnvelope.envelopeHash,
    downstreamCallsExecuted: 0,
    target,
    guardrails: nonExecutingGuardrails(),
  };
}

function nonExecutingGuardrails(): LiveDelegationExecutorEvidence["guardrails"] {
  return {
    noNetworkCallAttempted: true,
    noSignerMaterialUsed: true,
    noSignatureAttempted: true,
    noExternalPersistence: true,
    noDevnetTransferExecuted: true,
    noDownstreamX402Executed: true,
  };
}
