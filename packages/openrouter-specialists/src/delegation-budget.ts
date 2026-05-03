export type DelegationBudgetDenialReason =
  | "budget_policy_required"
  | "invalid_budget_policy"
  | "invalid_estimated_cost"
  | "request_budget_exceeded"
  | "session_budget_exceeded"
  | "agent_budget_exceeded"
  | "downstream_call_limit_exceeded";

export interface DelegationBudgetPolicy {
  /** Maximum lamports this single delegation request may spend. */
  maxLamportsPerRequest: number;
  /** Maximum total lamports allowed for the caller's current session. */
  maxLamportsPerSession: number;
  /** Maximum total lamports allowed for the caller agent within the policy window. */
  maxLamportsPerAgent: number;
  /** Maximum downstream calls allowed for the caller's current session. */
  maxDownstreamCallsPerSession: number;
}

export interface DelegationBudgetUsage {
  sessionLamportsSpent: number;
  agentLamportsSpent: number;
  downstreamCallsUsed: number;
}

export interface DelegationBudgetEvaluationInput {
  policy?: Partial<DelegationBudgetPolicy> | null;
  estimatedLamports: number;
  usage?: Partial<DelegationBudgetUsage> | null;
}

export interface DelegationBudgetDecisionAllowed {
  allowed: true;
  policy: DelegationBudgetPolicy;
  usage: DelegationBudgetUsage;
  estimatedLamports: number;
  remaining: {
    requestLamports: number;
    sessionLamports: number;
    agentLamports: number;
    downstreamCalls: number;
  };
}

export interface DelegationBudgetDecisionDenied {
  allowed: false;
  reason: DelegationBudgetDenialReason;
  message: string;
  details: Record<string, unknown>;
}

export type DelegationBudgetDecision = DelegationBudgetDecisionAllowed | DelegationBudgetDecisionDenied;

const POLICY_FIELDS: Array<keyof DelegationBudgetPolicy> = ["maxLamportsPerRequest", "maxLamportsPerSession", "maxLamportsPerAgent", "maxDownstreamCallsPerSession"];

function deny(reason: DelegationBudgetDenialReason, message: string, details: Record<string, unknown> = {}): DelegationBudgetDecisionDenied {
  return { allowed: false, reason, message, details };
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function validateDelegationBudgetPolicy(policy?: Partial<DelegationBudgetPolicy> | null): DelegationBudgetPolicy | DelegationBudgetDecisionDenied {
  if (!policy) {
    return deny("budget_policy_required", "Live delegation requires an explicit budget policy.");
  }

  const invalidFields = POLICY_FIELDS.filter((field) => !isNonNegativeSafeInteger(policy[field]));
  if (invalidFields.length > 0) {
    return deny("invalid_budget_policy", "Budget policy fields must be non-negative safe integers.", { invalidFields });
  }

  return {
    maxLamportsPerRequest: policy.maxLamportsPerRequest as number,
    maxLamportsPerSession: policy.maxLamportsPerSession as number,
    maxLamportsPerAgent: policy.maxLamportsPerAgent as number,
    maxDownstreamCallsPerSession: policy.maxDownstreamCallsPerSession as number,
  };
}

export function normalizeDelegationBudgetUsage(usage?: Partial<DelegationBudgetUsage> | null): DelegationBudgetUsage | DelegationBudgetDecisionDenied {
  const normalized = {
    sessionLamportsSpent: usage?.sessionLamportsSpent ?? 0,
    agentLamportsSpent: usage?.agentLamportsSpent ?? 0,
    downstreamCallsUsed: usage?.downstreamCallsUsed ?? 0,
  };
  const invalidFields = (Object.keys(normalized) as Array<keyof DelegationBudgetUsage>).filter((field) => !isNonNegativeSafeInteger(normalized[field]));
  if (invalidFields.length > 0) {
    return deny("invalid_budget_policy", "Budget usage fields must be non-negative safe integers.", { invalidFields });
  }
  return normalized;
}

export function evaluateDelegationBudget(input: DelegationBudgetEvaluationInput): DelegationBudgetDecision {
  if (!isNonNegativeSafeInteger(input.estimatedLamports)) {
    return deny("invalid_estimated_cost", "Estimated downstream cost must be a non-negative safe integer.", { estimatedLamports: input.estimatedLamports });
  }

  const policy = validateDelegationBudgetPolicy(input.policy);
  if ("allowed" in policy) return policy;

  const usage = normalizeDelegationBudgetUsage(input.usage);
  if ("allowed" in usage) return usage;

  if (input.estimatedLamports > policy.maxLamportsPerRequest) {
    return deny("request_budget_exceeded", "Estimated downstream cost exceeds the per-request budget.", {
      estimatedLamports: input.estimatedLamports,
      maxLamportsPerRequest: policy.maxLamportsPerRequest,
    });
  }

  const projectedSessionLamports = usage.sessionLamportsSpent + input.estimatedLamports;
  if (projectedSessionLamports > policy.maxLamportsPerSession) {
    return deny("session_budget_exceeded", "Estimated downstream cost exceeds the remaining session budget.", {
      estimatedLamports: input.estimatedLamports,
      sessionLamportsSpent: usage.sessionLamportsSpent,
      maxLamportsPerSession: policy.maxLamportsPerSession,
      projectedSessionLamports,
    });
  }

  const projectedAgentLamports = usage.agentLamportsSpent + input.estimatedLamports;
  if (projectedAgentLamports > policy.maxLamportsPerAgent) {
    return deny("agent_budget_exceeded", "Estimated downstream cost exceeds the remaining agent budget.", {
      estimatedLamports: input.estimatedLamports,
      agentLamportsSpent: usage.agentLamportsSpent,
      maxLamportsPerAgent: policy.maxLamportsPerAgent,
      projectedAgentLamports,
    });
  }

  const projectedDownstreamCalls = usage.downstreamCallsUsed + 1;
  if (projectedDownstreamCalls > policy.maxDownstreamCallsPerSession) {
    return deny("downstream_call_limit_exceeded", "Live delegation would exceed the session downstream call limit.", {
      downstreamCallsUsed: usage.downstreamCallsUsed,
      maxDownstreamCallsPerSession: policy.maxDownstreamCallsPerSession,
      projectedDownstreamCalls,
    });
  }

  return {
    allowed: true,
    policy,
    usage,
    estimatedLamports: input.estimatedLamports,
    remaining: {
      requestLamports: policy.maxLamportsPerRequest - input.estimatedLamports,
      sessionLamports: policy.maxLamportsPerSession - projectedSessionLamports,
      agentLamports: policy.maxLamportsPerAgent - projectedAgentLamports,
      downstreamCalls: policy.maxDownstreamCallsPerSession - projectedDownstreamCalls,
    },
  };
}
