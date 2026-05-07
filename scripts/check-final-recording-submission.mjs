#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const steps = [
  ["product naming", ["npm", "run", "check:product:naming"]],
  ["claim boundaries", ["npm", "run", "check:submission:claim-boundaries"]],
  ["submission prep", ["npm", "run", "check:economic-demo:submission-prep"]],
  ["Pay.sh reddi-x402 evidence", ["npm", "run", "evidence:pay-sh:reddi-x402", "--", "artifacts/pay-sh-reddi-x402/20260507T064842Z"]],
  ["Umbra SDK imports", ["npm", "run", "check:umbra:sdk-imports"]],
  ["Umbra adapter imports", ["npm", "run", "check:umbra:adapter-imports"]],
  ["Umbra private x402 evidence", ["npm", "run", "evidence:umbra:private-x402", "--", "artifacts/umbra-private-x402/20260507T074334Z"]],
  ["BDD index", ["npm", "run", "test:bdd:index"]],
  ["payment readiness + Umbra unit", ["npx", "jest", "--runTestsByPath", "lib/__tests__/economic-demo-payment-readiness.test.ts", "lib/__tests__/umbra-private-payment.test.ts", "lib/__tests__/umbra-private-x402-adapter.test.ts", "--runInBand"]],
  ["Quasar submission", ["npm", "run", "check:quasar:submission"]],
];

function runStep(label, command) {
  console.log(`\n[final-recording] ${label}: ${command.join(" ")}`);
  const result = spawnSync(command[0], command.slice(1), { stdio: "inherit", shell: false });
  if (result.status !== 0) {
    console.error(`[final-recording] FAIL: ${label}`);
    process.exit(result.status ?? 1);
  }
}

for (const [label, command] of steps) runStep(label, command);

const prepPath = join("artifacts", "economic-demo-submission-prep", "latest", "SUBMISSION-PREP.md");
if (!existsSync(prepPath)) {
  console.error(`[final-recording] FAIL: missing ${prepPath}`);
  process.exit(1);
}
const prep = readFileSync(prepPath, "utf8");
const reportMatch = prep.match(/`(artifacts\/economic-demo-run-report\/\d{8}T\d{6}Z\/run-report\.json)`/);
if (!reportMatch) {
  console.error("[final-recording] FAIL: submission prep does not reference a timestamped run-report JSON");
  process.exit(1);
}
const reportPath = reportMatch[1];
if (!existsSync(reportPath)) {
  console.error(`[final-recording] FAIL: referenced run report missing: ${reportPath}`);
  process.exit(1);
}
const report = JSON.parse(readFileSync(reportPath, "utf8"));
if (!report.payShReddix402Compatibility) {
  console.error(`[final-recording] FAIL: run report missing payShReddix402Compatibility: ${reportPath}`);
  process.exit(1);
}
if (!report.umbraPrivateX402) {
  console.error(`[final-recording] FAIL: run report missing umbraPrivateX402: ${reportPath}`);
  process.exit(1);
}
if (report.umbraPrivateX402.proofStatus !== "mocked_adapter_contract" || report.umbraPrivateX402.liveSettlementClaimed !== false) {
  console.error(`[final-recording] FAIL: Umbra proof must remain adapter-contract only: ${JSON.stringify(report.umbraPrivateX402)}`);
  process.exit(1);
}

console.log("\n[final-recording] OK");
console.log(`[final-recording] submission prep: ${prepPath}`);
console.log(`[final-recording] run report: ${reportPath}`);
console.log(`[final-recording] Pay.sh proof: ${report.payShReddix402Compatibility.proofStatus}`);
console.log(`[final-recording] Umbra proof: ${report.umbraPrivateX402.proofStatus}`);
