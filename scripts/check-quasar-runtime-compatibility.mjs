#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const compatibilityPath = path.join(repoRoot, "config/quasar/runtime-compatibility.json");
const deploymentsPath = path.join(repoRoot, "config/quasar/deployments.json");

function fail(message, detail) {
  console.error(`[quasar-runtime-compat] FAIL: ${message}`);
  if (detail) console.error(detail);
  process.exit(1);
}

const compatibility = JSON.parse(fs.readFileSync(compatibilityPath, "utf8"));
const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
const entries = compatibility.demoCriticalPaths;

if (!Array.isArray(entries) || entries.length === 0) {
  fail("demoCriticalPaths must list all audited demo-critical runtime paths");
}

const allowed = new Set(compatibility.allowedStatuses ?? []);
for (const entry of entries) {
  if (!entry.path || !entry.surface || !entry.status || !entry.reason) {
    fail("each compatibility entry needs path, surface, status, and reason", JSON.stringify(entry, null, 2));
  }
  if (!allowed.has(entry.status)) {
    fail(`unsupported compatibility status: ${entry.status}`, entry.path);
  }
  if (!fs.existsSync(path.join(repoRoot, entry.path))) {
    fail("compatibility entry references missing path", entry.path);
  }
}

const blocked = entries.filter((entry) => entry.status === "anchor-layout-only" || entry.status === "blocked-pending-quasar-port");
if (deployments.submissionReady === true && blocked.length > 0) {
  fail(
    "deployment inventory cannot be submissionReady=true while Quasar runtime blockers remain",
    blocked.map((entry) => `- ${entry.path}: ${entry.status}`).join("\n"),
  );
}

const programSource = fs.readFileSync(path.join(repoRoot, "lib/program.ts"), "utf8");
const networkSource = fs.readFileSync(path.join(repoRoot, "lib/config/network.ts"), "utf8");
if (!programSource.includes("PROGRAM_COMPATIBILITY") || !networkSource.includes("quasar-layout-unverified")) {
  fail("runtime config must expose quasar-layout-unverified compatibility metadata in Quasar mode");
}

console.log(`[quasar-runtime-compat] OK: audited ${entries.length} demo-critical paths`);
if (blocked.length > 0) {
  console.log(`[quasar-runtime-compat] BLOCKED: ${blocked.length} paths require Quasar port/verification before submissionReady=true`);
}
