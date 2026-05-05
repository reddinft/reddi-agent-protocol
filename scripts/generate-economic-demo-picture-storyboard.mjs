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

const { buildPictureStoryboardDesign } = require("../lib/economic-demo/picture-storyboard-design.ts");

function assertStoryboardOnly(design) {
  const failures = [];
  if (design.mode !== "storyboard_no_image_generation") failures.push(`mode=${design.mode}`);
  if (design.downstreamCallsExecuted !== 0) failures.push(`downstreamCallsExecuted=${design.downstreamCallsExecuted}`);
  if (design.imageGenerationExecuted !== 0) failures.push(`imageGenerationExecuted=${design.imageGenerationExecuted}`);
  if (design.adapterReadiness.enabled !== false) failures.push("adapterReadiness.enabled=true");
  if (!design.guardrails.noOpenAiImageGeneration) failures.push("noOpenAiImageGeneration=false");
  if (!design.guardrails.noFalImageGeneration) failures.push("noFalImageGeneration=false");
  if (!design.guardrails.noPaidProviderRequests) failures.push("noPaidProviderRequests=false");
  if (!design.guardrails.noSigningOperations) failures.push("noSigningOperations=false");
  if (!design.guardrails.noWalletMutation) failures.push("noWalletMutation=false");
  if (!design.guardrails.noDevnetTransfer) failures.push("noDevnetTransfer=false");
  if (!design.edges.some((edge) => edge.profileId === "image-generation-adapter" && edge.status === "blocked")) {
    failures.push("blocked_image_adapter_missing");
  }
  if (design.edges.some((edge) => edge.disclosureLedgerExpectation.downstreamCallsExecuted !== 0)) failures.push("edge_downstream_calls_executed");
  if (design.edges.some((edge) => edge.disclosureLedgerExpectation.requiredSchemaVersion !== "reddi.downstream-disclosure-ledger.v1")) {
    failures.push("ledger_schema_mismatch");
  }
  if (design.storyboard.some((frame) => !frame.visualPrompt || !frame.negativePrompt || !frame.evidenceCaveat)) {
    failures.push("storyboard_frame_missing_prompt_or_caveat");
  }
  if (failures.length > 0) throw new Error(`picture_storyboard_guardrail_failed:${failures.join(",")}`);
}

function main() {
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const outDir = join(rootDir, "artifacts", "economic-demo-picture-storyboard", timestamp);
  mkdirSync(outDir, { recursive: true });

  const design = buildPictureStoryboardDesign();
  assertStoryboardOnly(design);

  const adapterEdge = design.edges.find((edge) => edge.profileId === "image-generation-adapter");
  const artifact = {
    schemaVersion: "reddi.economic-demo.picture-storyboard-artifact.v1",
    generatedAt: new Date().toISOString(),
    sourceSchemaVersion: design.schemaVersion,
    disclosureContract: design.disclosureContract,
    scenarioId: design.scenarioId,
    mode: design.mode,
    userRequest: design.userRequest,
    downstreamCallsExecuted: design.downstreamCallsExecuted,
    imageGenerationExecuted: design.imageGenerationExecuted,
    orchestrator: design.orchestrator,
    adapterReadiness: design.adapterReadiness,
    blockedAdapter: adapterEdge
      ? {
          profileId: adapterEdge.profileId,
          endpoint: adapterEdge.endpoint,
          status: adapterEdge.status,
          expectedOutput: adapterEdge.expectedOutput,
          guardrail: adapterEdge.guardrail,
          disclosureLedgerExpectation: adapterEdge.disclosureLedgerExpectation,
        }
      : null,
    edgeCount: design.edges.length,
    edges: design.edges.map((edge) => ({
      step: edge.step,
      profileId: edge.profileId,
      capability: edge.capability,
      endpoint: edge.endpoint,
      walletAddress: edge.walletAddress,
      priceUsdc: edge.priceUsdc,
      status: edge.status,
      payloadClass: edge.payloadClass,
      scopedPayload: edge.scopedPayload,
      expectedOutput: edge.expectedOutput,
      guardrail: edge.guardrail,
      disclosureLedgerExpectation: edge.disclosureLedgerExpectation,
    })),
    storyboard: design.storyboard,
    acceptanceCriteria: design.acceptanceCriteria,
    guardrails: design.guardrails,
    nextStep: design.nextStep,
    safetyReview: {
      openAiImageRequests: 0,
      falImageRequests: 0,
      paidProviderRequests: 0,
      signingOperations: 0,
      walletMutations: 0,
      devnetTransfers: 0,
    },
  };

  const artifactPath = join(outDir, "picture-storyboard.json");
  const summaryPath = join(outDir, "SUMMARY.md");
  writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
  writeFileSync(
    summaryPath,
    `# Economic Demo Picture Storyboard Dry-Run\n\n- Scenario: ${artifact.scenarioId}\n- Mode: ${artifact.mode}\n- Orchestrator: ${artifact.orchestrator.profileId}\n- Edges: ${artifact.edgeCount}\n- Storyboard frames: ${artifact.storyboard.length}\n- Image generation executed: ${artifact.imageGenerationExecuted}\n- Downstream calls executed: ${artifact.downstreamCallsExecuted}\n- Blocked adapter: ${artifact.blockedAdapter?.profileId ?? "missing"}\n- Blocked adapter x402 state: ${artifact.blockedAdapter?.disclosureLedgerExpectation.x402State ?? "missing"}\n- OpenAI image requests: ${artifact.safetyReview.openAiImageRequests}\n- Fal.ai image requests: ${artifact.safetyReview.falImageRequests}\n- Paid provider requests: ${artifact.safetyReview.paidProviderRequests}\n- Signing operations: ${artifact.safetyReview.signingOperations}\n- Wallet mutations: ${artifact.safetyReview.walletMutations}\n- Devnet transfers: ${artifact.safetyReview.devnetTransfers}\n- JSON: ${artifactPath}\n`,
  );
  console.log(JSON.stringify({ ok: true, artifactPath, summaryPath }, null, 2));
}

try {
  main();
} finally {
  Module._resolveFilename = originalResolveFilename;
}
