#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const inventoryPath = path.join(repoRoot, "config/quasar/deployments.json");
const docsToCheck = [
  "docs/ECONOMIC-DEMO-JUDGE-PACKET-2026-05-05.md",
  "docs/ECONOMIC-DEMO-OPERATOR-CHECKLIST-2026-05-05.md",
  "docs/QUASAR-HACKATHON-CUTOVER-PLAN-2026-05-05.md",
];

const fail = (message, detail) => {
  console.error(`[quasar-demo-readiness] FAIL: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
};

const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf8"));
const quasar = inventory.quasarDeployments?.devnet;
const legacy = inventory.legacyAnchorReference;

if (!quasar?.programId) fail("missing devnet Quasar programId in config/quasar/deployments.json");
if (!legacy?.programId) fail("missing legacy Anchor reference programId in config/quasar/deployments.json");
if (quasar.programId === legacy.programId) fail("Quasar programId must not equal legacy Anchor programId");
if (!Array.isArray(quasar.evidence) || quasar.evidence.length === 0) fail("Quasar deployment inventory must include evidence");

const missingDocs = docsToCheck.filter((file) => !fs.existsSync(path.join(repoRoot, file)));
if (missingDocs.length) fail("required Quasar/demo docs are missing", missingDocs.map((f) => `- ${f}`).join("\n"));

const combined = docsToCheck.map((file) => fs.readFileSync(path.join(repoRoot, file), "utf8")).join("\n---DOC---\n");
const requiredPhrases = [
  "Quasar-deployed Solana programs",
  quasar.programId,
  "legacy Anchor",
  "approval-gated blocker",
];
const missingPhrases = requiredPhrases.filter((phrase) => !combined.includes(phrase));
if (missingPhrases.length) fail("docs do not surface required Quasar cutover language", missingPhrases.map((p) => `- ${p}`).join("\n"));

const disallowedFinalProofPatterns = [
  /Anchor CI alone (?:is|as) (?:sufficient|final)/i,
  /Anchor run `?\d+`?.{0,80}(?:final|submission proof)/i,
];
for (const pattern of disallowedFinalProofPatterns) {
  if (pattern.test(combined)) fail("docs appear to present Anchor CI as final submission proof", String(pattern));
}

const knownGaps = quasar.knownGaps ?? [];
if (inventory.submissionReady === true && knownGaps.length > 0) {
  fail("inventory cannot be submissionReady=true while knownGaps remain", knownGaps.map((g) => `- ${g}`).join("\n"));
}

if (inventory.submissionReady !== true) {
  const reason = inventory.submissionReadyReason || "missing submissionReadyReason";
  if (!reason || reason === "missing submissionReadyReason") fail("submissionReady=false must include submissionReadyReason");
  if (!knownGaps.length) fail("submissionReady=false must include explicit knownGaps on the Quasar deployment");
  console.log(`[quasar-demo-readiness] BLOCKED: ${reason}`);
  console.log(`[quasar-demo-readiness] known gaps: ${knownGaps.length}`);
}

console.log(`[quasar-demo-readiness] OK: Quasar devnet target ${quasar.programId}; legacy Anchor reference ${legacy.programId}`);
