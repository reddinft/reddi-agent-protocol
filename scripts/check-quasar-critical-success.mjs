#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const inventory = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/quasar/deployments.json"), "utf8"));
const compat = JSON.parse(fs.readFileSync(path.join(repoRoot, "config/quasar/runtime-compatibility.json"), "utf8"));
const devnet = inventory.quasarDeployments?.devnet;

const fail = (message, detail) => {
  console.error(`[quasar-critical-success] FAIL: ${message}`);
  if (detail) console.error(detail);
  process.exitCode = 1;
};

const requiredProgramIds = ["escrow", "registry", "reputation", "attestation"];
const ids = devnet?.programIds ?? {};
for (const key of requiredProgramIds) {
  if (!ids[key]) fail(`missing Quasar ${key} program ID in config/quasar/deployments.json`);
}

const successFactors = inventory.criticalSuccessFactors ?? [];
const requiredFactors = [
  "no-demo-critical-anchor-paths",
  "quasar-native-registry-reputation-attestation",
  "quasar-native-escrow-settlement-demo",
  "magicblock-per-quasar-validation-or-explicitly-not-in-final-claim",
];
for (const factor of requiredFactors) {
  if (!successFactors.includes(factor)) fail(`missing critical success factor: ${factor}`);
}

const disallowedLimitationFragments = [
  "Live PER/TEE execution is still not claimed",
  "Live PER/TEE execution is not claimed",
  "Legacy demo-agent full-flow/PER script is excluded",
  "scoped proof",
  "future/approval-gated",
];
const limitations = (devnet?.knownLimitations ?? []).join("\n");
const gaps = devnet?.knownGaps ?? [];

if (inventory.submissionReady === true) {
  if (gaps.length) fail("submissionReady=true while Quasar critical known gaps remain", gaps.map((g) => `- ${g}`).join("\n"));
  for (const fragment of disallowedLimitationFragments) {
    if (limitations.includes(fragment)) {
      fail(`submissionReady=true while limitation punts final Quasar proof: ${fragment}`);
    }
  }
}

const entries = compat.demoCriticalPaths ?? [];
const nonQuasar = entries.filter((entry) => !["quasar-compatible", "not-demo-critical"].includes(entry.status));
if (nonQuasar.length) {
  fail("runtime compatibility includes demo-critical non-Quasar paths", nonQuasar.map((e) => `- ${e.path}: ${e.status}`).join("\n"));
}

const demoEntry = entries.find((entry) => entry.path === "packages/demo-agents/src/demo.ts");
if (!demoEntry || demoEntry.status === "not-demo-critical") {
  fail("full demo-agent A→B→C flow is not Quasar-native demo-critical yet; cannot mark final goal achieved");
}

if (!process.exitCode) {
  console.log("[quasar-critical-success] OK: final demo critical success factors are satisfied");
}
