import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveDelegationAuditEnvelope, canonicalJson } from "../src/delegation-audit.js";
import type { LiveDelegationIntentPlan } from "../src/delegation-intent.js";

const intentPlan: LiveDelegationIntentPlan = {
  schemaVersion: "reddi.live-delegation-intent.v1",
  intentId: "intent_test",
  executionStatus: "not_executed",
  requesterProfileId: "planning-agent",
  selectedCandidate: {
    profileId: "code-generation-agent",
    displayName: "Code Generation Agent",
    endpointPath: "/v1/chat/completions",
    walletAddress: "11111111111111111111111111111111",
    matchedCapabilities: ["code-generation"],
    price: { currency: "USDC", amount: "0.02", unit: "request" },
    safetyMode: "standard",
  },
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

test("canonicalJson sorts object keys recursively and omits undefined", () => {
  assert.equal(canonicalJson({ b: 2, a: { d: undefined, c: 1 } }), '{"a":{"c":1},"b":2}');
});

test("live delegation audit envelope is deterministic, unsigned, and local-only", () => {
  const first = buildLiveDelegationAuditEnvelope(intentPlan);
  const second = buildLiveDelegationAuditEnvelope({ ...intentPlan, selectedCandidate: intentPlan.selectedCandidate ? { ...intentPlan.selectedCandidate } : undefined });

  assert.equal(first.envelopeHash, second.envelopeHash);
  assert.match(first.envelopeHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.signatureStatus, "unsigned");
  assert.equal(first.persistenceStatus, "not_persisted");
  assert.equal(first.executionStatus, "not_executed");
  assert.equal(first.guardrails.noSignerMaterialUsed, true);
  assert.equal(first.guardrails.noExternalPersistence, true);
  assert.equal(first.guardrails.noDevnetTransferExecuted, true);
  assert.equal(first.guardrails.noDownstreamX402Executed, true);
  assert.equal(first.canonicalJson, canonicalJson(JSON.parse(first.canonicalJson)));
  assert.equal(JSON.parse(first.canonicalJson).intentPlan.intentId, "intent_test");
});
