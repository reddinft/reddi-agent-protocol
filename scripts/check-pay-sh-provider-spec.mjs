#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";

const specPath = process.argv[2] ?? "config/pay-sh/reddi-x402-economic-demo-provider.yml";
const isSessionSplitsSpec = specPath.includes("session-splits");
const isSplitsSpec = specPath.includes("-splits") && !isSessionSplitsSpec;
if (!existsSync(specPath)) {
  console.error(`[pay-sh-spec] missing spec: ${specPath}`);
  process.exit(1);
}

const spec = readFileSync(specPath, "utf8");
const failures = [];

function requireMatch(label, regex) {
  if (!regex.test(spec)) failures.push(`missing/invalid ${label}`);
}

if (isSessionSplitsSpec) {
  requireMatch("name", /^name:\s*reddi-x402-economic-demo-session-splits$/m);
  requireMatch("title uses product name", /^title:\s*['"]Reddi Agent Protocol capped session and split-payment smoke['"]$/m);
  requireMatch("description references reddi-x402", /reddi-x402 capped repeated-call authorization/);
  requireMatch("session cap", /^session:\n  cap_usdc:\s*1\.00$/m);
  requireMatch("split recipient", /^recipients:\n(?:  .+\n)+/m);
  requireMatch("split percentage", /percent:\s*20/);
} else if (isSplitsSpec) {
  requireMatch("name", /^name:\s*reddi-x402-economic-demo-splits$/m);
  requireMatch("title uses product name", /^title:\s*['"]Reddi Agent Protocol split-payment smoke['"]$/m);
  requireMatch("description references reddi-x402", /reddi-x402 downstream specialist split metadata/);
  requireMatch("split recipient", /^recipients:\n(?:  .+\n)+/m);
  requireMatch("split percentage", /percent:\s*20/);
} else {
  requireMatch("name", /^name:\s*reddi-x402-economic-demo$/m);
  requireMatch("title uses product name", /^title:\s*['"]Reddi Agent Protocol economic demo['"]$/m);
  requireMatch("description references reddi-x402", /reddi-x402 package surface/);
}
requireMatch("routing block", /^routing:\n(?:  .+\n)+/m);
requireMatch("safe localnet network", /^  network:\s*localnet$/m);
requireMatch("USDC currency", /usd:\s*\['USDC', 'USDT'\]/);
requireMatch("endpoint allowlist", /^endpoints:\n(?:  .+\n)+/m);
requireMatch(
  "metered smoke endpoint",
  isSessionSplitsSpec
    ? /path:\s*'api\/economic-demo\/reddi-x402\/pay-sh-session-splits-smoke'/
    : isSplitsSpec
      ? /path:\s*'api\/economic-demo\/reddi-x402\/pay-sh-splits-smoke'/
      : /path:\s*'api\/economic-demo\/reddi-x402\/pay-sh-smoke'/,
);
requireMatch("request metering", /unit:\s*requests/);
requireMatch("sandbox boundary", /Sandbox gateway compatibility only; no mainnet funds(?:, no Umbra private settlement, and no MagicBlock PER settlement claimed| or private settlement claimed)\./);

if (/network:\s*mainnet/.test(spec)) failures.push("spec must not use mainnet for sandbox smoke");
if (/PRIVATE|SECRET|TOKEN|KEY|sk_|Bearer\s+[A-Za-z0-9]/.test(spec)) failures.push("spec appears to contain a secret-like literal");
if (/\bReddi\b(?! Agent Protocol| Engage|tech)/.test(spec)) failures.push("spec contains standalone product shorthand");

if (failures.length) {
  console.error("[pay-sh-spec] FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[pay-sh-spec] OK: ${specPath}`);
