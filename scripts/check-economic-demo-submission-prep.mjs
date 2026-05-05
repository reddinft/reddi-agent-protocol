#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
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

if (!lstatSync(prepRoot).isDirectory()) {
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

console.log(`[submission-prep-check] OK: ${relativeToRepo(prepFile)}`);
console.log(`[submission-prep-check] evidence paths: ${evidencePaths.length}`);
