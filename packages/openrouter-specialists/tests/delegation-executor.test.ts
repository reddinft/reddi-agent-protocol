import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveDelegationAuditEnvelope } from "../src/delegation-audit.js";
import { buildDisabledLiveDelegationExecutorEvidence, buildNoopLiveDelegationExecutorEvidence, NoopLiveDelegationExecutor } from "../src/delegation-executor.js";
import type { LiveDelegationIntentPlan } from "../src/delegation-intent.js";

const intentPlan: LiveDelegationIntentPlan = {
  schemaVersion: "reddi.live-delegation-intent.v1",
  intentId: "intent_executor_test",
  executionStatus: "not_executed",
  requesterProfileId: "planning-agent",
  task: "Write tests",
  requiredCapabilities: ["code-generation"],
  estimatedLamports: 500,
  budget: {
    allowed: true,
    estimatedLamports: 500,
    policy: {
      maxLamportsPerRequest: 1000,
      maxLamportsPerSession: 5000,
      maxLamportsPerAgent: 10000,
      maxDownstreamCallsPerSession: 2,
    },
    usage: {
      sessionLamportsSpent: 0,
      agentLamportsSpent: 0,
      downstreamCallsUsed: 0,
    },
    remaining: {
      requestLamports: 500,
      sessionLamports: 4500,
      agentLamports: 9500,
      downstreamCalls: 1,
    },
  },
  guardrails: {
    liveCallsEnabled: true,
    downstreamCallsExecuted: 0,
    maxDownstreamCalls: 1,
    maxDownstreamLamports: 1000,
    noSignerMaterialUsed: true,
    noDevnetTransferExecuted: true,
    noDownstreamX402Executed: true,
  },
  requiredAttestor: "verification-validation-agent",
  candidateCount: 1,
};

const auditEnvelope = buildLiveDelegationAuditEnvelope(intentPlan);

test("disabled live delegation executor evidence is non-executing and local-only", () => {
  const evidence = buildDisabledLiveDelegationExecutorEvidence({ intentPlan, auditEnvelope });

  assert.equal(evidence.schemaVersion, "reddi.live-delegation-executor-evidence.v1");
  assert.equal(evidence.executorId, "disabled-live-delegation-executor-gate");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "executor_disabled");
  assert.equal(evidence.intentId, intentPlan.intentId);
  assert.equal(evidence.auditEnvelopeHash, auditEnvelope.envelopeHash);
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
  assert.equal(evidence.guardrails.noSignerMaterialUsed, true);
  assert.equal(evidence.guardrails.noSignatureAttempted, true);
  assert.equal(evidence.guardrails.noExternalPersistence, true);
  assert.equal(evidence.guardrails.noDevnetTransferExecuted, true);
  assert.equal(evidence.guardrails.noDownstreamX402Executed, true);
});

test("no-op live delegation executor evidence is non-executing and local-only", () => {
  const evidence = buildNoopLiveDelegationExecutorEvidence({ intentPlan, auditEnvelope });

  assert.equal(evidence.schemaVersion, "reddi.live-delegation-executor-evidence.v1");
  assert.equal(evidence.executorId, "noop-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "executor_not_implemented");
  assert.equal(evidence.intentId, intentPlan.intentId);
  assert.equal(evidence.auditEnvelopeHash, auditEnvelope.envelopeHash);
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
  assert.equal(evidence.guardrails.noSignerMaterialUsed, true);
  assert.equal(evidence.guardrails.noSignatureAttempted, true);
  assert.equal(evidence.guardrails.noExternalPersistence, true);
  assert.equal(evidence.guardrails.noDevnetTransferExecuted, true);
  assert.equal(evidence.guardrails.noDownstreamX402Executed, true);
});

test("default no-op live delegation executor returns the same fail-closed evidence", async () => {
  const executor = new NoopLiveDelegationExecutor();
  const evidence = await executor.execute({ intentPlan, auditEnvelope });

  assert.deepEqual(evidence, buildNoopLiveDelegationExecutorEvidence({ intentPlan, auditEnvelope }));
});
