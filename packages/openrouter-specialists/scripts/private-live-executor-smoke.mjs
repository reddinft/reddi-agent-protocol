import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildLiveDelegationAuditEnvelope,
  buildLiveDelegationIntentPlan,
  buildDryRunDelegationPlan,
  evaluateDelegationBudget,
  FetchLiveDelegationExecutor,
} from '../dist/src/index.js';

const CONFIRM_VALUE = 'RUN_PRIVATE_DEVNET_SMOKE';
const mode = process.env.LIVE_DELEGATION_SMOKE_MODE === 'live' ? 'live' : 'mock';
const outPath = process.env.LIVE_DELEGATION_SMOKE_OUT ?? join(process.cwd(), 'artifacts/private-live-executor-smoke.json');
const generatedAt = process.env.LIVE_DELEGATION_SMOKE_GENERATED_AT ?? '2026-05-04T00:00:00.000Z';
const endpoint = process.env.LIVE_DELEGATION_ALLOWLISTED_ENDPOINT ?? 'https://reddi-code-generation.preview.reddi.tech/v1/chat/completions';
const paymentHeader = process.env.LIVE_DELEGATION_PAYMENT_HEADER ?? 'demo:private-live-executor-smoke';

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

if (mode === 'live') {
  assertCondition(process.env.LIVE_DELEGATION_SMOKE_CONFIRM === CONFIRM_VALUE, `live smoke requires LIVE_DELEGATION_SMOKE_CONFIRM=${CONFIRM_VALUE}`);
  assertCondition(endpoint.startsWith('https://'), 'live smoke requires https allowlisted endpoint');
  assertCondition(paymentHeader.startsWith('demo:') || paymentHeader.trim().startsWith('{'), 'live smoke requires bounded demo/devnet payment header input');
}

const budgetPolicy = {
  maxLamportsPerRequest: 1_000,
  maxLamportsPerSession: 5_000,
  maxLamportsPerAgent: 10_000,
  maxDownstreamCallsPerSession: 2,
};

const budget = evaluateDelegationBudget({
  policy: budgetPolicy,
  estimatedLamports: 500,
  usage: {
    sessionLamportsSpent: 0,
    agentLamportsSpent: 0,
    downstreamCallsUsed: 0,
  },
});
assertCondition(budget.allowed === true, 'fixture budget must be allowed');

const plan = await buildDryRunDelegationPlan({
  request: {
    task: 'Private smoke: delegate one bounded code-generation request.',
    requesterProfileId: 'planning-agent',
    requiredCapabilities: ['code-generation'],
    maxCandidates: 1,
  },
});
assertCondition(plan.selectedCandidate?.profileId === 'code-generation-agent', 'fixture must select code-generation-agent');

const intentPlan = buildLiveDelegationIntentPlan({
  requesterProfileId: 'planning-agent',
  task: 'Private smoke: delegate one bounded code-generation request.',
  requiredCapabilities: ['code-generation'],
  selectedCandidate: plan.selectedCandidate,
  delegationPlan: plan,
  budget,
  maxDownstreamCalls: 1,
  maxDownstreamLamports: 1_000,
});
const auditEnvelope = buildLiveDelegationAuditEnvelope(intentPlan);

let fetchCalls = 0;
const fetchImpl = mode === 'live'
  ? fetch
  : async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ ok: true, mode: 'mock-private-smoke' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

const paymentHeaderProvider = {
  async paymentHeader() {
    return paymentHeader;
  },
};

const executor = new FetchLiveDelegationExecutor({
  allowlistedEndpoints: { 'code-generation-agent': endpoint },
  paymentHeaderProvider,
  fetchImpl,
});

const evidence = await executor.execute({ intentPlan, auditEnvelope });
if (mode === 'live') fetchCalls = evidence.downstreamCallsExecuted;

assertCondition(evidence.executorId === 'fetch-live-delegation-executor', 'unexpected executor id');
assertCondition(evidence.executionStatus === 'attempted', 'private smoke should attempt exactly one call');
assertCondition(evidence.downstreamCallsExecuted === 1, 'private smoke must record exactly one downstream call');
assertCondition(fetchCalls === 1, 'private smoke must perform exactly one fetch');
assertCondition(evidence.target?.endpoint === endpoint, 'private smoke target must equal exact allowlisted endpoint');

const disabledExecutor = new FetchLiveDelegationExecutor({
  allowlistedEndpoints: { 'code-generation-agent': endpoint },
  fetchImpl: async () => {
    throw new Error('rollback guard should not fetch');
  },
});
const rollbackEvidence = await disabledExecutor.execute({ intentPlan, auditEnvelope });
assertCondition(rollbackEvidence.reason === 'payment_provider_missing', 'rollback/missing-provider guard must fail before fetch');
assertCondition(rollbackEvidence.downstreamCallsExecuted === 0, 'rollback guard must execute zero downstream calls');
assertCondition(rollbackEvidence.guardrails.noNetworkCallAttempted === true, 'rollback guard must avoid network calls');

const report = {
  schemaVersion: 'reddi.private-live-executor-smoke.v1',
  generatedAt,
  mode,
  status: 'pass',
  scope: 'private controlled smoke harness for gated FetchLiveDelegationExecutor',
  confirmationRequiredForLive: CONFIRM_VALUE,
  guardrails: {
    exactEndpointAllowlist: true,
    atMostOneDownstreamCall: true,
    noPrivateKeysInHarness: true,
    noSignatureOperationInHarness: true,
    noExternalPersistenceExceptLocalArtifact: true,
    noCoolifyChanges: true,
    noDevnetTransferOrRegistrationInHarness: true,
    liveRunRequiresExplicitConfirmation: true,
  },
  configProof: {
    allowlistedProfileId: 'code-generation-agent',
    allowlistedEndpoint: endpoint,
    maxDownstreamCalls: intentPlan.guardrails.maxDownstreamCalls,
    maxDownstreamLamports: intentPlan.guardrails.maxDownstreamLamports,
    estimatedLamports: intentPlan.estimatedLamports,
  },
  evidence: {
    executorId: evidence.executorId,
    executionStatus: evidence.executionStatus,
    reason: evidence.reason,
    downstreamCallsExecuted: evidence.downstreamCallsExecuted,
    target: evidence.target,
    downstreamResponse: evidence.downstreamResponse,
    guardrails: evidence.guardrails,
  },
  rollbackProof: {
    reason: rollbackEvidence.reason,
    downstreamCallsExecuted: rollbackEvidence.downstreamCallsExecuted,
    noNetworkCallAttempted: rollbackEvidence.guardrails.noNetworkCallAttempted,
  },
};

mkdirSync(join(outPath, '..'), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
