#!/usr/bin/env node
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Module = require("node:module");
const ts = require("typescript");

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, join(rootDir, request.slice(2)), parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      resolveJsonModule: true,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });
  module._compile(outputText, filename);
};

const { buildResearchWorkflowDesign } = require("../lib/economic-demo/research-workflow-design.ts");

function assertDryRunOnly(design) {
  const failures = [];
  if (design.mode !== "dry_run_no_live_calls") failures.push(`mode=${design.mode}`);
  if (design.downstreamCallsExecuted !== 0) failures.push(`downstreamCallsExecuted=${design.downstreamCallsExecuted}`);
  if (!design.guardrails.noLiveCalls) failures.push("noLiveCalls=false");
  if (!design.guardrails.noPaidProviderRequests) failures.push("noPaidProviderRequests=false");
  if (!design.guardrails.noSigningOperations) failures.push("noSigningOperations=false");
  if (!design.guardrails.noWalletMutation) failures.push("noWalletMutation=false");
  if (!design.guardrails.noDevnetTransfer) failures.push("noDevnetTransfer=false");
  if (design.edges.some((edge) => edge.disclosureLedgerExpectation.x402State !== "planned")) failures.push("non_planned_x402_state");
  if (design.edges.some((edge) => edge.disclosureLedgerExpectation.downstreamCallsExecuted !== 0)) failures.push("edge_downstream_calls_executed");
  if (failures.length > 0) throw new Error(`research_dry_run_guardrail_failed:${failures.join(",")}`);
}

function main() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const outDir = join(rootDir, "artifacts", "economic-demo-research-dry-run", timestamp);
  mkdirSync(outDir, { recursive: true });

  const design = buildResearchWorkflowDesign();
  assertDryRunOnly(design);

  const artifact = {
    schemaVersion: "reddi.economic-demo.research-dry-run-artifact.v1",
    generatedAt: new Date().toISOString(),
    sourceSchemaVersion: design.schemaVersion,
    scenarioId: design.scenarioId,
    mode: design.mode,
    downstreamCallsExecuted: design.downstreamCallsExecuted,
    orchestrator: design.orchestrator,
    plannedEdgeCount: design.edges.length,
    plannedEdges: design.edges.map((edge) => ({
      step: edge.step,
      profileId: edge.profileId,
      capability: edge.capability,
      endpoint: edge.endpoint,
      walletAddress: edge.walletAddress,
      priceUsdc: edge.priceUsdc,
      payloadClass: edge.payloadClass,
      scopedPayload: edge.scopedPayload,
      expectedOutput: edge.expectedOutput,
      evidenceRequirement: edge.evidenceRequirement,
      citationOrEvidenceCaveat: edge.citationOrEvidenceCaveat,
      attestorCriteria: edge.attestorCriteria,
      refundOrDisputeBehavior: edge.refundOrDisputeBehavior,
      disclosureLedgerExpectation: edge.disclosureLedgerExpectation,
      controlledDemoReceiptReadiness: edge.controlledDemoReceiptReadiness,
    })),
    acceptanceCriteria: design.acceptanceCriteria,
    guardrails: design.guardrails,
    retrospectiveQuestions: design.retrospectiveQuestions,
    nextStep: design.nextStep,
    safetyReview: {
      liveSpecialistCalls: 0,
      paidProviderRequests: 0,
      signingOperations: 0,
      walletMutations: 0,
      devnetTransfers: 0,
    },
  };

  const artifactPath = join(outDir, "research-dry-run.json");
  const summaryPath = join(outDir, "SUMMARY.md");
  writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  writeFileSync(
    summaryPath,
    `# Economic Demo Research Dry-Run\n\n- Scenario: ${artifact.scenarioId}\n- Mode: ${artifact.mode}\n- Orchestrator: ${artifact.orchestrator.profileId}\n- Planned edges: ${artifact.plannedEdgeCount}\n- Downstream calls executed: ${artifact.downstreamCallsExecuted}\n- x402 state: planned for every edge\n- Live specialist calls: ${artifact.safetyReview.liveSpecialistCalls}\n- Paid provider requests: ${artifact.safetyReview.paidProviderRequests}\n- Signing operations: ${artifact.safetyReview.signingOperations}\n- Wallet mutations: ${artifact.safetyReview.walletMutations}\n- Devnet transfers: ${artifact.safetyReview.devnetTransfers}\n- JSON: ${artifactPath}\n`,
  );
  console.log(JSON.stringify({ ok: true, artifactPath, summaryPath }, null, 2));
}

try {
  main();
} finally {
  Module._resolveFilename = originalResolveFilename;
}
