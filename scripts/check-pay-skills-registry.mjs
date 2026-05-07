#!/usr/bin/env node
import { readFileSync } from "node:fs";

const registryPath = process.argv[2] ?? "providers/redditech/reddi-agent-protocol/reddi-x402-economic-demo-provider.md";
const text = readFileSync(registryPath, "utf8");
const failures = [];

function requireMatch(label, pattern) {
  if (!pattern.test(text)) failures.push(`missing/invalid ${label}`);
}
function forbidMatch(label, pattern) {
  if (pattern.test(text)) failures.push(`forbidden ${label}`);
}

requireMatch("frontmatter fence", /^---\n[\s\S]+\n---\n?$/);
requireMatch("product title", /^title:\s*Reddi Agent Protocol economic demo$/m);
requireMatch("package surface", /reddi-x402 package surface/);
requireMatch("provider name", /^name:\s*reddi-x402-economic-demo-provider$/m);
requireMatch("endpoint path", /path:\s*api\/economic-demo\/reddi-x402\/pay-sh-smoke/);
requireMatch("resource", /resource:\s*reddi-x402-pay-sh-smoke/);
requireMatch("sandbox service url", /^sandbox_service_url:\s*http:\/\/127\.0\.0\.1:1402\/reddi-x402-economic-demo-provider$/m);
requireMatch("usage price", /price_usd:\s*0\.01/);
forbidMatch("standalone Reddi product name", /\bReddi\b(?! Agent Protocol)/);
forbidMatch("hyphenated product name", /Reddi-Agent Protocol/);
forbidMatch("unsupported settlement claim", /mainnet settlement|Umbra private settlement|MagicBlock PER settlement/i);

if (failures.length) {
  console.error("[pay-skills-registry] FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log(`[pay-skills-registry] OK: ${registryPath}`);
