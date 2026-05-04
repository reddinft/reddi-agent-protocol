import assert from "node:assert/strict";
import test from "node:test";
import { buildLiveDelegationAuditEnvelope } from "../src/delegation-audit.js";
import {
  buildDisabledLiveDelegationExecutorEvidence,
  buildNoopLiveDelegationExecutorEvidence,
  FetchLiveDelegationExecutor,
  NoopLiveDelegationExecutor,
  type DownstreamPaymentHeaderProvider,
} from "../src/delegation-executor.js";
import type { LiveDelegationIntentPlan } from "../src/delegation-intent.js";

const intentPlan: LiveDelegationIntentPlan = {
  schemaVersion: "reddi.live-delegation-intent.v1",
  intentId: "intent_executor_test",
  executionStatus: "not_executed",
  requesterProfileId: "planning-agent",
  selectedCandidate: {
    profileId: "code-generation-agent",
    displayName: "Code Generation Agent",
    endpointPath: "/v1/chat/completions",
    walletAddress: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
    matchedCapabilities: ["code-generation"],
    price: { currency: "USDC", amount: "0.05", unit: "request" },
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

const auditEnvelope = buildLiveDelegationAuditEnvelope(intentPlan);
const allowlistedEndpoint = "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions";

function withIntentPatch(patch: Partial<LiveDelegationIntentPlan>): LiveDelegationIntentPlan {
  return { ...intentPlan, ...patch };
}

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

test("fetch live delegation executor fails closed before network when payment provider is missing", async () => {
  let fetchCalls = 0;
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: { "code-generation-agent": allowlistedEndpoint },
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
  });

  const evidence = await executor.execute({ intentPlan, auditEnvelope });

  assert.equal(fetchCalls, 0);
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "payment_provider_missing");
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
  assert.equal(evidence.target?.profileId, "code-generation-agent");
});

test("fetch live delegation executor fails closed before network when endpoint is not allowlisted", async () => {
  let fetchCalls = 0;
  const paymentHeaderProvider: DownstreamPaymentHeaderProvider = { paymentHeader: async () => "demo:downstream-live-smoke" };
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: {},
    paymentHeaderProvider,
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
  });

  const evidence = await executor.execute({ intentPlan, auditEnvelope });

  assert.equal(fetchCalls, 0);
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "endpoint_not_allowlisted");
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
});

test("fetch live delegation executor fails closed before network when selected path does not exactly match allowlist", async () => {
  let fetchCalls = 0;
  const paymentHeaderProvider: DownstreamPaymentHeaderProvider = { paymentHeader: async () => "demo:downstream-live-smoke" };
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: { "code-generation-agent": allowlistedEndpoint },
    paymentHeaderProvider,
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
  });
  const mismatchedIntent = withIntentPatch({
    selectedCandidate: intentPlan.selectedCandidate ? { ...intentPlan.selectedCandidate, endpointPath: "/not-allowlisted" } : undefined,
  });

  const evidence = await executor.execute({ intentPlan: mismatchedIntent, auditEnvelope });

  assert.equal(fetchCalls, 0);
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "endpoint_not_allowlisted");
  assert.equal(evidence.target?.endpoint, "https://reddi-code-generation.preview.reddi.tech/not-allowlisted");
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
});

test("fetch live delegation executor fails closed before network when call count guard is not exactly one", async () => {
  let fetchCalls = 0;
  const paymentHeaderProvider: DownstreamPaymentHeaderProvider = { paymentHeader: async () => "demo:downstream-live-smoke" };
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: { "code-generation-agent": allowlistedEndpoint },
    paymentHeaderProvider,
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
  });
  const badCallCountIntent = withIntentPatch({
    guardrails: { ...intentPlan.guardrails, maxDownstreamCalls: 2 },
  });

  const evidence = await executor.execute({ intentPlan: badCallCountIntent, auditEnvelope });

  assert.equal(fetchCalls, 0);
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "downstream_call_limit_exceeded");
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
});

test("fetch live delegation executor fails closed before network when lamport guard is exceeded", async () => {
  let fetchCalls = 0;
  const paymentHeaderProvider: DownstreamPaymentHeaderProvider = { paymentHeader: async () => "demo:downstream-live-smoke" };
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: { "code-generation-agent": allowlistedEndpoint },
    paymentHeaderProvider,
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("{}", { status: 200 });
    },
  });
  const overLamportIntent = withIntentPatch({
    estimatedLamports: 1_500,
    guardrails: { ...intentPlan.guardrails, maxDownstreamLamports: 1_000 },
  });

  const evidence = await executor.execute({ intentPlan: overLamportIntent, auditEnvelope });

  assert.equal(fetchCalls, 0);
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "not_executed");
  assert.equal(evidence.reason, "downstream_lamport_limit_exceeded");
  assert.equal(evidence.downstreamCallsExecuted, 0);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, true);
});

test("fetch live delegation executor attempts exactly one allowlisted downstream call with bounded evidence", async () => {
  const requests: Request[] = [];
  const paymentHeaderProvider: DownstreamPaymentHeaderProvider = { paymentHeader: async () => "demo:downstream-live-smoke" };
  const executor = new FetchLiveDelegationExecutor({
    allowlistedEndpoints: { "code-generation-agent": allowlistedEndpoint },
    paymentHeaderProvider,
    fetchImpl: async (input, init) => {
      requests.push(new Request(input, init));
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  const evidence = await executor.execute({ intentPlan, auditEnvelope });

  assert.equal(requests.length, 1);
  assert.equal(requests[0]?.url, allowlistedEndpoint);
  assert.equal(requests[0]?.method, "POST");
  assert.equal(requests[0]?.headers.get("x402-payment"), "demo:downstream-live-smoke");
  assert.equal(evidence.executorId, "fetch-live-delegation-executor");
  assert.equal(evidence.executionStatus, "attempted");
  assert.equal(evidence.reason, "downstream_call_attempted");
  assert.equal(evidence.downstreamCallsExecuted, 1);
  assert.equal(evidence.downstreamResponse?.status, 200);
  assert.equal(evidence.downstreamResponse?.ok, true);
  assert.equal(evidence.guardrails.noNetworkCallAttempted, false);
  assert.equal(evidence.guardrails.noSignerMaterialUsed, true);
  assert.equal(evidence.guardrails.noSignatureAttempted, true);
  assert.equal(evidence.guardrails.noExternalPersistence, true);
  assert.equal(evidence.guardrails.noDevnetTransferExecuted, true);
  assert.equal(evidence.guardrails.noDownstreamX402Executed, false);
});
