import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleDelegationPlanning } from '../dist/src/index.js';

const outPath = process.env.LIVE_NOOP_SMOKE_OUT ?? join(process.cwd(), 'artifacts/live-noop-executor-smoke.json');
const generatedAt = process.env.LIVE_NOOP_SMOKE_GENERATED_AT ?? '2026-05-04T00:00:00.000Z';

const budgetPolicy = {
  maxLamportsPerRequest: 1_000,
  maxLamportsPerSession: 5_000,
  maxLamportsPerAgent: 10_000,
  maxDownstreamCallsPerSession: 2,
};

const baseConfig = {
  profileId: 'planning-agent',
  endpointBaseUrl: 'https://planning.example.test',
  openRouterBaseUrl: 'https://openrouter.ai/api/v1',
  mockOpenRouter: true,
  requirePayment: true,
  allowDemoPayment: true,
  enableAgentToAgentCalls: true,
  enableLiveDelegationExecutor: true,
  maxDownstreamCalls: 1,
  maxDownstreamLamports: 1_000,
};

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function publicEvidenceFrom(response) {
  const reddi = response.body.reddi ?? {};
  return {
    status: response.status,
    errorCode: response.body.error?.code,
    profileId: reddi.profileId,
    liveCallsEnabled: reddi.liveCallsEnabled,
    downstreamCallsExecuted: reddi.downstreamCallsExecuted,
    budgetAllowed: reddi.budget?.allowed,
    intent: reddi.intentPlan
      ? {
          schemaVersion: reddi.intentPlan.schemaVersion,
          intentId: reddi.intentPlan.intentId,
          executionStatus: reddi.intentPlan.executionStatus,
          selectedCandidateProfileId: reddi.intentPlan.selectedCandidate?.profileId,
          downstreamCallsExecuted: reddi.intentPlan.guardrails?.downstreamCallsExecuted,
          noDevnetTransferExecuted: reddi.intentPlan.guardrails?.noDevnetTransferExecuted,
          noDownstreamX402Executed: reddi.intentPlan.guardrails?.noDownstreamX402Executed,
        }
      : undefined,
    auditEnvelope: reddi.auditEnvelope
      ? {
          schemaVersion: reddi.auditEnvelope.schemaVersion,
          hashAlgorithm: reddi.auditEnvelope.hashAlgorithm,
          envelopeHash: reddi.auditEnvelope.envelopeHash,
          signatureStatus: reddi.auditEnvelope.signatureStatus,
          persistenceStatus: reddi.auditEnvelope.persistenceStatus,
          executionStatus: reddi.auditEnvelope.executionStatus,
        }
      : undefined,
    executorEvidence: reddi.executorEvidence
      ? {
          schemaVersion: reddi.executorEvidence.schemaVersion,
          executorId: reddi.executorEvidence.executorId,
          executionStatus: reddi.executorEvidence.executionStatus,
          reason: reddi.executorEvidence.reason,
          downstreamCallsExecuted: reddi.executorEvidence.downstreamCallsExecuted,
          guardrails: reddi.executorEvidence.guardrails,
        }
      : undefined,
  };
}

const validResponse = await handleDelegationPlanning({
  headers: new Headers({ 'x402-payment': 'demo:live-noop-smoke-valid' }),
  body: {
    messages: [{ role: 'user', content: 'Hire a code agent for this task.' }],
    metadata: {
      mode: 'delegation_live',
      delegation: {
        dryRun: false,
        requiredCapabilities: ['code-generation'],
        estimatedLamports: 500,
        budgetPolicy,
      },
    },
  },
  config: baseConfig,
});

assertCondition(validResponse.status === 501, 'valid enabled no-op path must remain 501');
assertCondition(validResponse.body.error?.code === 'live_delegation_not_implemented', 'valid enabled no-op path must remain not implemented');
assertCondition(validResponse.body.reddi?.downstreamCallsExecuted === 0, 'valid enabled no-op path must execute zero downstream calls');
assertCondition(validResponse.body.reddi?.intentPlan?.executionStatus === 'not_executed', 'intent must be not_executed');
assertCondition(validResponse.body.reddi?.auditEnvelope?.signatureStatus === 'unsigned', 'audit envelope must remain unsigned');
assertCondition(validResponse.body.reddi?.auditEnvelope?.persistenceStatus === 'not_persisted', 'audit envelope must not be externally persisted');
assertCondition(validResponse.body.reddi?.executorEvidence?.executorId === 'noop-live-delegation-executor', 'enabled smoke must invoke only the no-op executor');
assertCondition(validResponse.body.reddi?.executorEvidence?.executionStatus === 'not_executed', 'executor evidence must be not_executed');
assertCondition(validResponse.body.reddi?.executorEvidence?.downstreamCallsExecuted === 0, 'executor evidence must execute zero downstream calls');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noNetworkCallAttempted === true, 'executor must not attempt network calls');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noSignerMaterialUsed === true, 'executor must not use signer material');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noSignatureAttempted === true, 'executor must not attempt signatures');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noExternalPersistence === true, 'executor must not persist externally');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noDevnetTransferExecuted === true, 'executor must not execute devnet transfers');
assertCondition(validResponse.body.reddi?.executorEvidence?.guardrails?.noDownstreamX402Executed === true, 'executor must not execute downstream x402');

const deniedResponse = await handleDelegationPlanning({
  headers: new Headers({ 'x402-payment': 'demo:live-noop-smoke-denied' }),
  body: {
    messages: [{ role: 'user', content: 'Hire a code agent for this over-budget task.' }],
    metadata: {
      mode: 'delegation_live',
      delegation: {
        dryRun: false,
        requiredCapabilities: ['code-generation'],
        estimatedLamports: 2_000,
        budgetPolicy,
      },
    },
  },
  config: baseConfig,
});

assertCondition(deniedResponse.status === 403, 'denied branch must remain 403');
assertCondition(deniedResponse.body.error?.code === 'request_budget_exceeded', 'denied branch must report request_budget_exceeded');
assertCondition(deniedResponse.body.reddi?.downstreamCallsExecuted === 0, 'denied branch must execute zero downstream calls');
assertCondition(deniedResponse.body.reddi?.intentPlan === undefined, 'denied branch must not create intent plan');
assertCondition(deniedResponse.body.reddi?.auditEnvelope === undefined, 'denied branch must not create audit envelope');
assertCondition(deniedResponse.body.reddi?.executorEvidence === undefined, 'denied branch must not create executor evidence');

const report = {
  schemaVersion: 'reddi.live-noop-executor-smoke.v1',
  generatedAt,
  status: 'pass',
  scope: 'local controlled smoke for enabled no-op live delegation executor path',
  guardrails: {
    localRuntimeFixturesOnly: true,
    noRealExecutorImplementation: true,
    noNetworkCallsIntroduced: true,
    noSignerMaterialAccessed: true,
    noSignatureOperation: true,
    noExternalPersistenceExceptLocalArtifact: true,
    noCoolifyChanges: true,
    noDevnetTransferOrRegistration: true,
    noLiveDownstreamX402OrOpenRouterCall: true,
  },
  configProof: {
    enableAgentToAgentCalls: baseConfig.enableAgentToAgentCalls,
    enableLiveDelegationExecutor: baseConfig.enableLiveDelegationExecutor,
    mockOpenRouter: baseConfig.mockOpenRouter,
    maxDownstreamCalls: baseConfig.maxDownstreamCalls,
    maxDownstreamLamports: baseConfig.maxDownstreamLamports,
  },
  cases: {
    validBudgetEnabledNoop: publicEvidenceFrom(validResponse),
    budgetDenied: publicEvidenceFrom(deniedResponse),
  },
};

mkdirSync(join(outPath, '..'), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
