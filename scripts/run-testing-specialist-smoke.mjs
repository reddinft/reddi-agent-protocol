#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const endpoint = process.env.TESTING_SPECIALIST_ENDPOINT || process.argv[2] || "http://127.0.0.1:8080";
const outRoot = process.env.ARTIFACT_DIR || path.join("artifacts", "demo-testing-specialists", new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"));
fs.mkdirSync(outRoot, { recursive: true });

async function writeJson(name, payload) {
  fs.writeFileSync(path.join(outRoot, name), JSON.stringify(payload, null, 2));
}

async function main() {
  const summary = { endpoint, checks: [], ok: false };

  const health = await fetch(`${endpoint}/healthz`);
  const healthPayload = await health.json().catch(() => ({}));
  summary.checks.push({ name: "healthz", status: health.status, ok: health.ok });
  await writeJson("01-healthz.json", healthPayload);

  const models = await fetch(`${endpoint}/v1/models`);
  const modelsPayload = await models.json().catch(() => ({}));
  summary.checks.push({ name: "models", status: models.status, ok: models.ok });
  await writeJson("02-models.json", modelsPayload);

  const promptByProfile = {
    "qa-security": "Audit unpaid completion bypass without x402",
    "ux-usability": "Find specialist onboarding friction before registration",
    "integration-tester": "Create a Coolify VPS smoke plan for the protected endpoint"
  };
  const prompt = promptByProfile[healthPayload?.profile] || "Audit unpaid completion bypass without x402";
  const body = { model: modelsPayload?.data?.[0]?.id || "reddi-demo/testing-specialist", messages: [{ role: "user", content: prompt }] };
  const unpaid = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const unpaidPayload = await unpaid.json().catch(() => ({}));
  const x402Request = unpaid.headers.get("x402-request");
  summary.checks.push({ name: "unpaid_completion_fails_closed", status: unpaid.status, ok: unpaid.status === 402 && Boolean(x402Request) });
  await writeJson("03-unpaid-completion.json", { status: unpaid.status, x402Request: x402Request ? JSON.parse(x402Request) : null, body: unpaidPayload });

  const paid = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", "x402-payment": JSON.stringify({ txSignature: "demo-smoke", network: "solana-devnet" }) },
    body: JSON.stringify(body),
  });
  const paidPayload = await paid.json().catch(() => ({}));
  summary.checks.push({ name: "paid_completion_returns_match_metadata", status: paid.status, ok: paid.ok && paidPayload?.reddi_demo?.matchConfidence >= 0.9 });
  await writeJson("04-paid-completion.json", paidPayload);

  summary.ok = summary.checks.every((check) => check.ok);
  fs.writeFileSync(path.join(outRoot, "SUMMARY.md"), [
    `# Testing Specialist Smoke`,
    ``,
    `Endpoint: ${endpoint}`,
    `Result: ${summary.ok ? "PASS" : "FAIL"}`,
    ``,
    ...summary.checks.map((check) => `- ${check.ok ? "✅" : "❌"} ${check.name}: HTTP ${check.status}`),
    ``,
  ].join("\n"));
  await writeJson("summary.json", summary);
  console.log(`${summary.ok ? "PASS" : "FAIL"} ${outRoot}`);
  if (!summary.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
