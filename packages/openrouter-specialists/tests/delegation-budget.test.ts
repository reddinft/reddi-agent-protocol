import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDelegationBudget, validateDelegationBudgetPolicy } from "../src/delegation-budget.js";

const policy = {
  maxLamportsPerRequest: 100_000,
  maxLamportsPerSession: 300_000,
  maxLamportsPerAgent: 1_000_000,
  maxDownstreamCallsPerSession: 3,
};

test("missing live delegation budget policy fails closed", () => {
  const decision = evaluateDelegationBudget({ estimatedLamports: 1_000 });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "budget_policy_required");
});

test("malformed budget policy fails closed with invalid fields", () => {
  const decision = validateDelegationBudgetPolicy({
    maxLamportsPerRequest: 100,
    maxLamportsPerSession: -1,
    maxLamportsPerAgent: Number.NaN,
  });

  assert.ok("allowed" in decision);
  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "invalid_budget_policy");
  assert.deepEqual(decision.details.invalidFields, ["maxLamportsPerSession", "maxLamportsPerAgent", "maxDownstreamCallsPerSession"]);
});

test("invalid estimated cost fails closed", () => {
  const decision = evaluateDelegationBudget({ policy, estimatedLamports: 1.5 });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "invalid_estimated_cost");
});

test("request over per-request spend cap fails closed", () => {
  const decision = evaluateDelegationBudget({ policy, estimatedLamports: 100_001 });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "request_budget_exceeded");
  assert.equal(decision.details.maxLamportsPerRequest, 100_000);
});

test("request over remaining session budget fails closed", () => {
  const decision = evaluateDelegationBudget({
    policy,
    estimatedLamports: 75_000,
    usage: { sessionLamportsSpent: 250_001 },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "session_budget_exceeded");
  assert.equal(decision.details.projectedSessionLamports, 325_001);
});

test("request over remaining agent budget fails closed", () => {
  const decision = evaluateDelegationBudget({
    policy,
    estimatedLamports: 75_000,
    usage: { agentLamportsSpent: 950_001 },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "agent_budget_exceeded");
  assert.equal(decision.details.projectedAgentLamports, 1_025_001);
});

test("request over downstream call count fails closed", () => {
  const decision = evaluateDelegationBudget({
    policy,
    estimatedLamports: 1_000,
    usage: { downstreamCallsUsed: 3 },
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.reason, "downstream_call_limit_exceeded");
  assert.equal(decision.details.projectedDownstreamCalls, 4);
});

test("request within all budget limits is allowed with remaining budget snapshot", () => {
  const decision = evaluateDelegationBudget({
    policy,
    estimatedLamports: 25_000,
    usage: { sessionLamportsSpent: 50_000, agentLamportsSpent: 100_000, downstreamCallsUsed: 1 },
  });

  assert.equal(decision.allowed, true);
  assert.deepEqual(decision.remaining, {
    requestLamports: 75_000,
    sessionLamports: 225_000,
    agentLamports: 875_000,
    downstreamCalls: 1,
  });
});
