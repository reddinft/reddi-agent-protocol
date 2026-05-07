#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const defaultPrepParent = resolve(repoRoot, "artifacts/economic-demo-submission-prep");
const defaultPrepRoot = resolve(defaultPrepParent, "latest");

function newestPrepDir() {
  if (!existsSync(defaultPrepParent)) return defaultPrepRoot;
  const candidates = readdirSync(defaultPrepParent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && /^\d{8}T\d{6}Z$/.test(entry.name))
    .map((entry) => resolve(defaultPrepParent, entry.name))
    .sort();
  return candidates.at(-1) ?? defaultPrepRoot;
}

let prepRoot = resolve(process.env.ECONOMIC_DEMO_SUBMISSION_PREP_ROOT ?? defaultPrepRoot);
if (!process.env.ECONOMIC_DEMO_SUBMISSION_PREP_ROOT && !existsSync(prepRoot)) {
  prepRoot = await newestPrepDir();
}
const prepFile = resolve(prepRoot, "SUBMISSION-PREP.md");

const requiredPhrases = [
  "Scope: safe local/demo prep only",
  "## Demo entrypoint",
  "## Current green evidence",
  "## Local evidence paths to mention/demo",
  "## Five-beat recording outline",
  "## Hard no-go list unless Nissan explicitly approves",
  "No Phase 6 controlled live research",
  "No OpenAI/Fal image generation",
  "No paid provider requests",
  "No signing operations",
  "No wallet mutation",
  "No devnet transfer",
  "No Coolify/env mutation",
  "Pay.sh / reddi-x402 sandbox charge",
  "Pay.sh capped sessions and split payments are probe-only extension evidence",
  "Pay.sh capped sessions or split-payment settlement completed",
  "Pay.sh evidence proves Umbra private settlement or MagicBlock PER settlement",
  "Umbra private x402 adapter contract",
  "Umbra private x402 adapter contract evidence proves the dependency-injected receiver-claimable UTXO call path",
  "Umbra SDK/devnet private settlement completed",
  "Umbra evidence proves live private settlement",
];

function relativeToRepo(path) {
  return path.startsWith(repoRoot) ? path.slice(repoRoot.length + 1) : path;
}

function fail(message, detail) {
  console.error(`[submission-prep-check] FAIL: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

if (!existsSync(prepRoot)) {
  fail("submission prep root is missing", relativeToRepo(prepRoot));
}

if (!statSync(prepRoot).isDirectory()) {
  fail("submission prep root is not a directory", relativeToRepo(prepRoot));
}

if (!existsSync(prepFile)) {
  fail("SUBMISSION-PREP.md is missing", relativeToRepo(prepFile));
}

const markdown = readFileSync(prepFile, "utf8");
const missingPhrases = requiredPhrases.filter((phrase) => !markdown.includes(phrase));
if (missingPhrases.length > 0) {
  fail("prep pack is missing required sections/guardrails", missingPhrases.map((p) => `- ${p}`).join("\n"));
}

const pathMatches = [...markdown.matchAll(/`(artifacts\/[^`]+)`/g)].map((match) => match[1]);
const evidencePaths = [...new Set(pathMatches.filter((p) => !p.includes("economic-demo-submission-prep/latest")))];
if (evidencePaths.length === 0) {
  fail("prep pack does not reference any local evidence artifact paths");
}

const missingPaths = evidencePaths.filter((artifactPath) => !existsSync(resolve(repoRoot, artifactPath)));
if (missingPaths.length > 0) {
  fail("prep pack references missing local evidence paths", missingPaths.map((p) => `- ${p}`).join("\n"));
}

const runReportPath = evidencePaths.find((artifactPath) => /artifacts\/economic-demo-run-report\/\d{8}T\d{6}Z\/run-report\.json$/.test(artifactPath));
if (!runReportPath) {
  fail("prep pack does not reference an economic demo run report JSON artifact");
}

const runReport = JSON.parse(readFileSync(resolve(repoRoot, runReportPath), "utf8"));
const paySh = runReport.payShReddix402Compatibility;
if (!paySh) {
  fail("run report is missing payShReddix402Compatibility", runReportPath);
}
if (paySh.packageName !== "reddi-x402") {
  fail("Pay.sh run-report package is not reddi-x402", paySh.packageName);
}
if (paySh.proofStatus !== "sandbox_http_402_to_pay_sh_200_receipt") {
  fail("Pay.sh run-report proof status is not the proven single-charge sandbox flow", paySh.proofStatus);
}
if (paySh.plainCurlStatus !== "402 Payment Required" || paySh.paidRetryStatus !== "200 OK" || paySh.receiptStatus !== "success") {
  fail("Pay.sh run-report statuses do not match proven sandbox evidence", JSON.stringify({ plainCurlStatus: paySh.plainCurlStatus, paidRetryStatus: paySh.paidRetryStatus, receiptStatus: paySh.receiptStatus }));
}
if (!paySh.claimBoundary?.includes("no mainnet funds") || !paySh.claimBoundary?.includes("no MagicBlock PER settlement")) {
  fail("Pay.sh run-report claim boundary is missing no-mainnet/no-MagicBlock constraints", paySh.claimBoundary);
}
const invalidExtension = (paySh.extensionProbes ?? []).find((probe) => probe.status !== "probe_only" || probe.paySandboxRetryError !== "Server returned 402 again after payment");
if (invalidExtension) {
  fail("Pay.sh extension probe is not represented as blocked probe-only evidence", JSON.stringify(invalidExtension, null, 2));
}
if ((paySh.extensionProbes ?? []).length < 2) {
  fail("Pay.sh run report is missing session/split extension probe blockers");
}
const umbra = runReport.umbraPrivateX402;
if (!umbra) {
  fail("run report is missing umbraPrivateX402", runReportPath);
}
if (umbra.rail !== "private-umbra" || umbra.proofStatus !== "mocked_adapter_contract") {
  fail("Umbra run-report status is not adapter-contract proof", JSON.stringify({ rail: umbra.rail, proofStatus: umbra.proofStatus }));
}
if (umbra.liveSettlementClaimed !== false || umbra.devnetTransactionsSubmitted !== false) {
  fail("Umbra run-report overclaims live/devnet settlement", JSON.stringify({ liveSettlementClaimed: umbra.liveSettlementClaimed, devnetTransactionsSubmitted: umbra.devnetTransactionsSubmitted }));
}
if (!umbra.claimBoundary?.includes("mocked/local proof only") && !umbra.claimBoundary?.includes("no live/devnet Umbra settlement")) {
  fail("Umbra run-report claim boundary is missing mocked/no-live constraint", umbra.claimBoundary);
}

const forbiddenClaimPatterns = [
  /Pay\.sh[^\n]*(?:mainnet|Umbra private|MagicBlock PER)[^\n]*(?:settled|settlement completed|proven)/i,
  /Pay\.sh[^\n]*(?:session|split)[^\n]*(?:settled|settlement completed|completed settlement)/i,
  /Umbra[^\n]*(?:live private settlement|devnet private settlement|settlement completed)[^\n]*(?:proves|proved|completed|executed)/i,
];
const safeClaimsMarkdown = markdown.split("Not safe to say yet:")[0] ?? markdown;
const forbiddenClaim = forbiddenClaimPatterns.find((pattern) => pattern.test(safeClaimsMarkdown));
if (forbiddenClaim) {
  fail("prep pack appears to overclaim Pay.sh settlement in its safe-claims section", String(forbiddenClaim));
}

console.log(`[submission-prep-check] OK: ${relativeToRepo(prepFile)}`);
console.log(`[submission-prep-check] evidence paths: ${evidencePaths.length}`);
