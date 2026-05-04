import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { canonicalJson } from "../src/delegation-audit.js";
import { MockOpenRouterClient } from "../src/openrouter.js";
import { getProfile, specialistProfiles, validateProfileRegistry } from "../src/profiles/index.js";
import {
  buildDryRunDelegationPlan,
  buildDeploymentReadinessReport,
  candidatesFromWalletManifest,
  createRuntimeConfig,
  evaluateAttestation,
  handleAttestationEvaluation,
  handleChatCompletions,
  handleRuntimeRequest,
  marketplaceMetadata,
  ManifestMarketplaceDiscoveryClient,
  rankMarketplaceCandidates,
  type WalletManifest,
  type RuntimeConfig,
} from "../src/index.js";

const config: RuntimeConfig = {
  profileId: "planning-agent",
  endpointBaseUrl: "https://planning.example.test",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  mockOpenRouter: true,
  requirePayment: true,
  allowDemoPayment: false,
};

const walletManifest = JSON.parse(readFileSync(join(process.cwd(), "public/wallet-manifest.json"), "utf8")) as WalletManifest;

test("profile registry has first five unique valid profiles with required marketplace metadata", () => {
  assert.deepEqual(validateProfileRegistry(), []);
  assert.equal(specialistProfiles.length, 5);
  assert.deepEqual(
    specialistProfiles.map((profile) => profile.id),
    ["planning-agent", "document-intelligence-agent", "verification-validation-agent", "code-generation-agent", "conversational-agent"],
  );
  assert.ok(getProfile("verification-validation-agent")?.roles.includes("attestor"));
});

test("OpenRouter mock mode is explicit opt-in only", () => {
  assert.equal(createRuntimeConfig({}).mockOpenRouter, false);
  assert.equal(createRuntimeConfig({ OPENROUTER_MOCK: "true" }).mockOpenRouter, true);
  assert.equal(createRuntimeConfig({}).enableAgentToAgentCalls, false);
  assert.equal(createRuntimeConfig({ ENABLE_AGENT_TO_AGENT_CALLS: "true", MAX_DOWNSTREAM_CALLS: "2", MAX_DOWNSTREAM_LAMPORTS: "5000" }).enableAgentToAgentCalls, true);
  assert.equal(createRuntimeConfig({ ENABLE_AGENT_TO_AGENT_CALLS: "true", MAX_DOWNSTREAM_CALLS: "2", MAX_DOWNSTREAM_LAMPORTS: "5000" }).maxDownstreamCalls, 2);
});

test("unpaid completion returns 402 challenge before OpenRouter client call", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers(),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config,
    client,
  });

  assert.equal(response.status, 402);
  assert.equal(client.callCount, 0);
  assert.ok(response.headers["x402-request"]);
  assert.equal((response.body.error as { code: string }).code, "payment_required");
});

test("demo payment remains fail-closed without explicit ALLOW_DEMO_X402_PAYMENT", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:paid" }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config,
    client,
  });

  assert.equal(response.status, 402);
  assert.equal(client.callCount, 0);
  assert.equal((response.body.error as { code: string }).code, "demo_payment_disabled");
});

test("paid completion invokes OpenRouter mock with explicit demo flag, profile guardrails, and Reddi metadata", async () => {
  const client = new MockOpenRouterClient();
  const demoConfig = { ...config, allowDemoPayment: true };
  const profile = getProfile("planning-agent");
  assert.ok(profile);
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:nonce-paid-1" }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config: demoConfig,
    client,
  });

  assert.equal(response.status, 200);
  assert.equal(client.callCount, 1);
  assert.equal(client.lastRequest?.model, getProfile("planning-agent")?.model);
  assert.equal(client.lastRequest?.messages[0]?.role, "system");
  assert.equal(client.lastRequest?.messages[0]?.content, getProfile("planning-agent")?.systemPrompt);
  assert.deepEqual(response.body.reddi, {
    profileId: "planning-agent",
    requestId: (response.body.reddi as { requestId: string }).requestId,
    model: getProfile("planning-agent")?.model,
    paymentSatisfied: true,
    safetyMode: "standard",
    mockOpenRouter: true,
  });
  assert.match((response.body.reddi as { requestId: string }).requestId, /^[0-9a-f-]{36}$/);
});

test("HTTP runtime rejects duplicate demo receipt nonces", async () => {
  const client = new MockOpenRouterClient();
  const demoConfig = { ...config, allowDemoPayment: true };
  const request = () =>
    new Request("https://planning.example.test/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "x402-payment": "demo:nonce-http-replay-1" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    });

  const first = await handleRuntimeRequest(request(), demoConfig, client);
  const second = await handleRuntimeRequest(request(), demoConfig, client);

  assert.equal(first.status, 200);
  assert.equal(second.status, 402);
  const body = (await second.json()) as { error: { code: string } };
  assert.equal(body.error.code, "duplicate_nonce");
});

test("empty demo receipt nonce returns controlled 402", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:" }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config: { ...config, allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 402);
  assert.equal(client.callCount, 0);
  assert.equal((response.body.error as { code: string }).code, "invalid_nonce");
});

test("caller-authored structured demo receipts are rejected", async () => {
  const client = new MockOpenRouterClient();
  const profile = getProfile("planning-agent");
  assert.ok(profile);
  const response = await handleChatCompletions({
    headers: new Headers({
      "x402-payment": JSON.stringify({
        demo: true,
        network: "solana-devnet",
        payTo: profile.walletAddress,
        amount: profile.price.amount,
        currency: profile.price.currency,
        nonce: "nonce-structured-demo",
      }),
    }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config: { ...config, allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 402);
  assert.equal(client.callCount, 0);
  assert.equal((response.body.error as { code: string }).code, "payment_required");

  const tokenResponse = await handleChatCompletions({
    headers: new Headers({
      "x402-payment": JSON.stringify({ demo: true, token: "demo:nonce-structured-token", nonce: "nonce-structured-token" }),
    }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config: { ...config, allowDemoPayment: true },
    client,
  });

  assert.equal(tokenResponse.status, 402);
  assert.equal(client.callCount, 0);
  assert.equal((tokenResponse.body.error as { code: string }).code, "payment_required");
});

test("well-known metadata includes Reddi marketplace fields", async () => {
  const profile = getProfile("planning-agent");
  assert.ok(profile);
  const metadata = marketplaceMetadata(profile, config) as Record<string, unknown>;

  for (const field of ["profileId", "displayName", "walletAddress", "endpoint", "capabilities", "roles", "price", "safetyMode", "preferredAttestors"]) {
    assert.ok(metadata[field], `missing ${field}`);
  }
  assert.equal(metadata.profileId, "planning-agent");
  assert.equal(metadata.endpoint, "https://planning.example.test/v1/chat/completions");
});

test("attestor route returns structured release verdict for sample specialist output and receipt chain", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleAttestationEvaluation({
    headers: new Headers({ "x402-payment": "demo:attestation-release-1" }),
    body: {
      mode: "attestation",
      subjectProfileId: "planning-agent",
      specialistOutput:
        "Execution plan includes evidence, validation gates, artifact references, and clear risks. Receipt confirms paid specialist work and the output stays within constraints.",
      receiptChain: [
        { id: "challenge-1", type: "x402-challenge", status: "issued", amount: "0.03", currency: "USDC" },
        { id: "receipt-1", type: "x402-payment", status: "satisfied", amount: "0.03", currency: "USDC", txSignature: "demo-signature" },
      ],
      domain: "general operations",
    },
    config: { ...config, profileId: "verification-validation-agent", allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 200);
  assert.equal(client.callCount, 1);
  assert.equal(response.body.verdictSource, "deterministic_local_evaluator");
  assert.equal(client.lastRequest?.metadata.mode, "attestation");
  assert.equal(client.lastRequest?.messages[0]?.role, "system");
  assert.match(client.lastRequest?.messages[0]?.content ?? "", /Verdict semantics: release=pay specialist, refund=return funds/);
  const verdict = response.body.verdict as { schemaVersion: string; score: number; recommendedAction: string; checks: unknown[]; summary: string; caveats: string[] };
  assert.equal(verdict.schemaVersion, "reddi.attestation.v1");
  assert.equal(verdict.recommendedAction, "release");
  assert.ok(verdict.score >= 0.8);
  assert.ok(verdict.checks.length >= 4);
  assert.match(verdict.summary, /Recommend release/);
  assert.ok(verdict.caveats.some((caveat) => caveat.includes("not professional certification")));
});

test("attestation request mode on chat completions uses attestation envelope", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:attestation-chat-mode-1" }),
    body: {
      metadata: {
        mode: "attestation",
        attestation: {
          subjectProfileId: "document-intelligence-agent",
          specialistOutput: "Short summary with no receipt evidence.",
          receiptChain: [],
        },
      },
    },
    config: { ...config, profileId: "verification-validation-agent", allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.object, "reddi.attestation.verdict");
  assert.equal((response.body.verdict as { recommendedAction: string }).recommendedAction, "refund");
});

test("regulated-domain caveat is preserved and borderline verdict disputes", () => {
  const verdict = evaluateAttestation(
    {
      mode: "attestation",
      subjectProfileId: "conversational-agent",
      specialistOutput: "Financial explanation with evidence but should remain informational only.",
      receiptChain: [{ id: "receipt-1", type: "x402-payment", status: "paid", amount: "0.015", currency: "USDC" }],
      domain: "financial planning",
    },
    "verification-validation-agent",
  );

  assert.equal(verdict.recommendedAction, "dispute");
  assert.ok(verdict.caveats.some((caveat) => caveat.includes("Regulated-domain caveat")));
  assert.ok(verdict.semantics.release.includes("Recommend release"));
  assert.ok(verdict.semantics.refund.includes("Recommend refund"));
  assert.ok(verdict.semantics.dispute.includes("Recommend dispute"));
});

test("non-attestor profile cannot evaluate attestations", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleAttestationEvaluation({
    headers: new Headers({ "x402-payment": "demo:not-attestor-1" }),
    body: { mode: "attestation", specialistOutput: "hello", receiptChain: [] },
    config: { ...config, allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 403);
  assert.equal(client.callCount, 0);
  assert.equal((response.body.error as { code: string }).code, "profile_not_attestor");
});

test("dry-run marketplace delegation ranks candidates deterministically without downstream paid calls", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:delegation-dry-run-1" }),
    body: {
      messages: [{ role: "user", content: "Plan a launch that needs document evidence extraction and code implementation." }],
      metadata: {
        mode: "delegation_plan",
        delegation: {
          requiredCapabilities: ["document-analysis", "code-generation"],
          maxCandidates: 3,
        },
      },
    },
    config: { ...config, allowDemoPayment: true },
    client,
  });

  assert.equal(response.status, 200);
  assert.equal(client.callCount, 0);
  assert.equal(response.body.object, "reddi.delegation.plan");
  const plan = response.body.plan as {
    mode: string;
    liveCallsEnabled: boolean;
    downstreamCallsExecuted: number;
    requiredCapabilities: string[];
    candidates: Array<{ profileId: string; matchedCapabilities: string[]; rankScore: number }>;
    selectedCandidate: { profileId: string };
    estimatedCost: { amount: string; currency: string };
    requiredAttestor: string;
    guardrails: string[];
  };
  assert.equal(plan.mode, "dry_run");
  assert.equal(plan.liveCallsEnabled, false);
  assert.equal(plan.downstreamCallsExecuted, 0);
  assert.deepEqual(plan.requiredCapabilities, ["code-generation", "document-analysis"]);
  assert.deepEqual(
    plan.candidates.map((candidate) => candidate.profileId),
    ["code-generation-agent", "document-intelligence-agent"],
  );
  assert.equal(plan.selectedCandidate.profileId, "code-generation-agent");
  assert.deepEqual(plan.candidates.map((candidate) => candidate.rankScore), [...plan.candidates.map((candidate) => candidate.rankScore)].sort((a, b) => b - a));
  assert.equal(plan.estimatedCost.currency, "USDC");
  assert.equal(plan.requiredAttestor, "verification-validation-agent");
  assert.ok(plan.guardrails.some((guardrail) => guardrail.includes("no devnet SOL spent")));
  assert.equal((response.body.reddi as { downstreamCallsExecuted: number; liveCallsEnabled: boolean }).downstreamCallsExecuted, 0);
  assert.equal((response.body.reddi as { downstreamCallsExecuted: number; liveCallsEnabled: boolean }).liveCallsEnabled, false);
});

test("dry-run marketplace ranking is deterministic for sample candidates", async () => {
  const plan = await buildDryRunDelegationPlan({
    request: {
      requesterProfileId: "planning-agent",
      task: "Need code and tests",
      requiredCapabilities: ["code-generation"],
      maxCandidates: 3,
    },
  });
  assert.equal(plan.candidates[0]?.profileId, "code-generation-agent");
  assert.equal(plan.selectedCandidate?.profileId, "code-generation-agent");

  const ranked = rankMarketplaceCandidates(
    [
      {
        profileId: "b-agent",
        displayName: "B",
        endpointPath: "/v1/chat/completions",
        capabilities: ["code-generation"],
        roles: ["specialist"],
        price: { currency: "USDC", amount: "0.02", unit: "request" },
        reputationScore: 0.8,
        freshnessScore: 0.8,
        preferredAttestors: ["verification-validation-agent"],
        safetyMode: "standard",
      },
      {
        profileId: "a-agent",
        displayName: "A",
        endpointPath: "/v1/chat/completions",
        capabilities: ["code-generation"],
        roles: ["specialist"],
        price: { currency: "USDC", amount: "0.02", unit: "request" },
        reputationScore: 0.8,
        freshnessScore: 0.8,
        preferredAttestors: ["verification-validation-agent"],
        safetyMode: "standard",
      },
    ],
    ["code-generation"],
  );
  assert.deepEqual(
    ranked.map((candidate) => candidate.profileId),
    ["a-agent", "b-agent"],
  );
});

test("manifest marketplace discovery matches deterministic first-five ranking", async () => {
  const discoveryClient = new ManifestMarketplaceDiscoveryClient(walletManifest);
  const plan = await buildDryRunDelegationPlan({
    request: {
      requesterProfileId: "planning-agent",
      task: "Need document evidence and code implementation",
      requiredCapabilities: ["document-analysis", "code-generation"],
      maxCandidates: 3,
    },
    discoveryClient,
  });

  assert.deepEqual(plan.discoveryDiagnostics?.excluded, []);
  assert.deepEqual(plan.discoveryDiagnostics?.includedProfileIds, [
    "code-generation-agent",
    "conversational-agent",
    "document-intelligence-agent",
    "planning-agent",
    "verification-validation-agent",
  ]);
  assert.deepEqual(
    plan.candidates.map((candidate) => candidate.profileId),
    ["code-generation-agent", "document-intelligence-agent"],
  );
  assert.equal(plan.selectedCandidate?.walletAddress, getProfile("code-generation-agent")?.walletAddress);
});

test("manifest discovery excludes malformed candidates with explicit reasons", () => {
  const malformedManifest: WalletManifest = {
    ...walletManifest,
    profiles: [
      ...walletManifest.profiles,
      { profileId: "ghost-agent", displayName: "Ghost", publicKey: "not-a-public-key" },
      { profileId: "planning-agent", displayName: "Duplicate Planning", publicKey: walletManifest.profiles[0]?.publicKey ?? "" },
    ],
  };
  const result = candidatesFromWalletManifest(malformedManifest);
  const ghost = result.excluded.find((entry) => entry.profileId === "ghost-agent");
  const duplicate = result.excluded.find((entry) => entry.profileId === "planning-agent");
  assert.ok(ghost?.reasons.includes("profile not found in specialist registry"));
  assert.ok(ghost?.reasons.includes("invalid Solana public key"));
  assert.ok(duplicate?.reasons.includes("duplicate profileId in wallet manifest"));
  assert.ok(duplicate?.reasons.includes("duplicate public key in wallet manifest"));
});

test("deployment readiness report is public-data-only and blocks missing funding/deployment", () => {
  const report = buildDeploymentReadinessReport({
    manifest: walletManifest,
    endpointBaseUrl: "https://planning.example.test",
    fundedProfileIds: [],
    deployedProfileIds: [],
    generatedAt: "2026-05-04T00:00:00.000Z",
  });

  assert.equal(report.schemaVersion, "reddi.openrouter.deployment-readiness.v1");
  assert.equal(report.status, "blocked");
  assert.equal(report.entries.length, 5);
  assert.ok(report.guardrails.includes("no private keys or signer material inspected"));
  assert.ok(report.guardrails.includes("no devnet SOL spent"));
  assert.ok(report.nextApprovalRequired.some((item) => item.includes("fund")));
  assert.ok(report.entries.every((entry) => entry.endpoint?.startsWith("https://planning.example.test/")));
  assert.ok(report.entries.every((entry) => entry.blockers.includes("funding not confirmed; approval/funding required")));
  assert.ok(report.entries.every((entry) => entry.blockers.includes("Coolify deployment not confirmed")));
});

test("live delegation mode fails closed before any downstream paid call executor exists", async () => {
  const client = new MockOpenRouterClient();
  const budgetPolicy = {
    maxLamportsPerRequest: 1_000,
    maxLamportsPerSession: 5_000,
    maxLamportsPerAgent: 10_000,
    maxDownstreamCallsPerSession: 2,
  };
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:delegation-live-fail-closed-1" }),
    body: {
      messages: [{ role: "user", content: "Hire a code agent for this task." }],
      metadata: { mode: "delegation_live", delegation: { dryRun: false, requiredCapabilities: ["code-generation"], estimatedLamports: 500, budgetPolicy } },
    },
    config: { ...config, allowDemoPayment: true, enableAgentToAgentCalls: true, maxDownstreamCalls: 1, maxDownstreamLamports: 1000 },
    client,
  });

  assert.equal(response.status, 501);
  assert.equal(client.callCount, 0);
  assert.equal((response.body.error as { code: string }).code, "live_delegation_not_implemented");
  assert.equal((response.body.reddi as { downstreamCallsExecuted: number }).downstreamCallsExecuted, 0);
  assert.equal(((response.body.reddi as { budget: { allowed: boolean } }).budget).allowed, true);
  const intentPlan = (response.body.reddi as { intentPlan: { schemaVersion: string; executionStatus: string; selectedCandidate?: { profileId: string }; guardrails: { downstreamCallsExecuted: number; noDownstreamX402Executed: boolean }; estimatedLamports: number } }).intentPlan;
  assert.equal(intentPlan.schemaVersion, "reddi.live-delegation-intent.v1");
  assert.equal(intentPlan.executionStatus, "not_executed");
  assert.equal(intentPlan.selectedCandidate?.profileId, "code-generation-agent");
  assert.equal(intentPlan.estimatedLamports, 500);
  assert.equal(intentPlan.guardrails.downstreamCallsExecuted, 0);
  assert.equal(intentPlan.guardrails.noDownstreamX402Executed, true);
  const auditEnvelope = (response.body.reddi as { auditEnvelope: { schemaVersion: string; hashAlgorithm: string; envelopeHash: string; canonicalJson: string; signatureStatus: string; persistenceStatus: string; executionStatus: string; guardrails: { noSignerMaterialUsed: boolean; noExternalPersistence: boolean; noDownstreamX402Executed: boolean } } }).auditEnvelope;
  assert.equal(auditEnvelope.schemaVersion, "reddi.live-delegation-audit-envelope.v1");
  assert.equal(auditEnvelope.hashAlgorithm, "sha256");
  assert.match(auditEnvelope.envelopeHash, /^sha256:[a-f0-9]{64}$/);
  assert.equal(auditEnvelope.signatureStatus, "unsigned");
  assert.equal(auditEnvelope.persistenceStatus, "not_persisted");
  assert.equal(auditEnvelope.executionStatus, "not_executed");
  assert.equal(auditEnvelope.guardrails.noSignerMaterialUsed, true);
  assert.equal(auditEnvelope.guardrails.noExternalPersistence, true);
  assert.equal(auditEnvelope.guardrails.noDownstreamX402Executed, true);
  assert.equal(auditEnvelope.canonicalJson, canonicalJson(JSON.parse(auditEnvelope.canonicalJson)));
  const executorEvidence = (response.body.reddi as { executorEvidence: { schemaVersion: string; executorId: string; executionStatus: string; auditEnvelopeHash: string; downstreamCallsExecuted: number; guardrails: { noNetworkCallAttempted: boolean; noSignerMaterialUsed: boolean; noSignatureAttempted: boolean; noExternalPersistence: boolean; noDevnetTransferExecuted: boolean; noDownstreamX402Executed: boolean } } }).executorEvidence;
  assert.equal(executorEvidence.schemaVersion, "reddi.live-delegation-executor-evidence.v1");
  assert.equal(executorEvidence.executorId, "noop-live-delegation-executor");
  assert.equal(executorEvidence.executionStatus, "not_executed");
  assert.equal(executorEvidence.auditEnvelopeHash, auditEnvelope.envelopeHash);
  assert.equal(executorEvidence.downstreamCallsExecuted, 0);
  assert.equal(executorEvidence.guardrails.noNetworkCallAttempted, true);
  assert.equal(executorEvidence.guardrails.noSignerMaterialUsed, true);
  assert.equal(executorEvidence.guardrails.noSignatureAttempted, true);
  assert.equal(executorEvidence.guardrails.noExternalPersistence, true);
  assert.equal(executorEvidence.guardrails.noDevnetTransferExecuted, true);
  assert.equal(executorEvidence.guardrails.noDownstreamX402Executed, true);

  const liveWithoutBudgetPolicy = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:delegation-live-fail-closed-2" }),
    body: {
      messages: [{ role: "user", content: "Hire another agent live." }],
      metadata: { mode: "delegation_live" },
    },
    config: { ...config, allowDemoPayment: true, enableAgentToAgentCalls: true },
    client,
  });
  assert.equal(liveWithoutBudgetPolicy.status, 403);
  assert.equal(client.callCount, 0);
  assert.equal((liveWithoutBudgetPolicy.body.error as { code: string }).code, "budget_policy_required");
  assert.equal((liveWithoutBudgetPolicy.body.reddi as { downstreamCallsExecuted: number; intentPlan?: unknown; auditEnvelope?: unknown; executorEvidence?: unknown }).downstreamCallsExecuted, 0);
  assert.equal((liveWithoutBudgetPolicy.body.reddi as { intentPlan?: unknown }).intentPlan, undefined);
  assert.equal((liveWithoutBudgetPolicy.body.reddi as { auditEnvelope?: unknown }).auditEnvelope, undefined);
  assert.equal((liveWithoutBudgetPolicy.body.reddi as { executorEvidence?: unknown }).executorEvidence, undefined);

  const liveWithCallsDisabled = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:delegation-live-fail-closed-3" }),
    body: {
      messages: [{ role: "user", content: "Hire another agent live." }],
      metadata: { mode: "delegation_live", delegation: { dryRun: false, requiredCapabilities: ["code-generation"], estimatedLamports: 500, budgetPolicy } },
    },
    config: { ...config, allowDemoPayment: true, enableAgentToAgentCalls: false },
    client,
  });
  assert.equal(liveWithCallsDisabled.status, 403);
  assert.equal(client.callCount, 0);
  assert.equal((liveWithCallsDisabled.body.error as { code: string }).code, "live_delegation_disabled");
  assert.equal((liveWithCallsDisabled.body.reddi as { downstreamCallsExecuted: number }).downstreamCallsExecuted, 0);

  const liveOverBudget = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:delegation-live-fail-closed-4" }),
    body: {
      messages: [{ role: "user", content: "Hire another agent live." }],
      metadata: { mode: "delegation_live", delegation: { dryRun: false, requiredCapabilities: ["code-generation"], estimatedLamports: 2_000, budgetPolicy } },
    },
    config: { ...config, allowDemoPayment: true, enableAgentToAgentCalls: true },
    client,
  });
  assert.equal(liveOverBudget.status, 403);
  assert.equal(client.callCount, 0);
  assert.equal((liveOverBudget.body.error as { code: string }).code, "request_budget_exceeded");
  assert.equal((liveOverBudget.body.reddi as { downstreamCallsExecuted: number }).downstreamCallsExecuted, 0);
});

test("HTTP core routes expose health, models, tags, metadata, attestation, and chat", async () => {
  const client = new MockOpenRouterClient();
  for (const path of ["/healthz", "/x402/health", "/v1/models", "/api/tags", "/.well-known/reddi-agent.json"]) {
    const response = await handleRuntimeRequest(new Request(`https://planning.example.test${path}`), config, client);
    assert.equal(response.status, 200, path);
  }

  const unpaid = await handleRuntimeRequest(
    new Request("https://planning.example.test/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }),
    config,
    client,
  );
  assert.equal(unpaid.status, 402);
  assert.equal(client.callCount, 0);

  const unpaidAttestation = await handleRuntimeRequest(
    new Request("https://planning.example.test/v1/attestations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode: "attestation", specialistOutput: "hello", receiptChain: [] }),
    }),
    { ...config, profileId: "verification-validation-agent", allowDemoPayment: true },
    client,
  );
  assert.equal(unpaidAttestation.status, 402);
  const unpaidAttestationChallenge = JSON.parse(unpaidAttestation.headers.get("x402-request") ?? "{}") as { endpoint?: string; memo?: string };
  assert.equal(unpaidAttestationChallenge.endpoint, "https://planning.example.test/v1/attestations");
  assert.equal(unpaidAttestationChallenge.memo, "reddi:verification-validation-agent:/v1/attestations");

  const attestation = await handleRuntimeRequest(
    new Request("https://planning.example.test/v1/attestations", {
      method: "POST",
      headers: { "content-type": "application/json", "x402-payment": "demo:http-attestation-route-1" },
      body: JSON.stringify({
        mode: "attestation",
        subjectProfileId: "planning-agent",
        specialistOutput: "Plan includes validation artifacts, test evidence, receipt references, risks, and clear settlement recommendation input.",
        receiptChain: [{ id: "receipt-http-1", type: "x402-payment", status: "satisfied", amount: "0.03", currency: "USDC" }],
      }),
    }),
    { ...config, profileId: "verification-validation-agent", allowDemoPayment: true },
    client,
  );
  assert.equal(attestation.status, 200);
  const attestationBody = (await attestation.json()) as { object: string; verdictSource: string; verdict: { recommendedAction: string } };
  assert.equal(attestationBody.object, "reddi.attestation.verdict");
  assert.equal(attestationBody.verdictSource, "deterministic_local_evaluator");
  assert.equal(attestationBody.verdict.recommendedAction, "release");
});
