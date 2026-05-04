#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-live-x402-readiness", timestamp);
mkdirSync(outDir, { recursive: true });

const CONFIRM = "RUN_ECONOMIC_DEMO_LIVE_X402_READINESS";
const endpoint = process.env.ECONOMIC_DEMO_LIVE_X402_ENDPOINT ?? "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions";
const profileId = process.env.ECONOMIC_DEMO_LIVE_X402_PROFILE ?? "code-generation-agent";
const confirm = process.env.ECONOMIC_DEMO_LIVE_X402_CONFIRM === CONFIRM;
const allowPaidRetry = process.env.ECONOMIC_DEMO_LIVE_X402_PAID_RETRY === "1" || process.env.ECONOMIC_DEMO_LIVE_X402_PAID_RETRY === "true";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(headers = {}) {
  return fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Economic demo live x402 readiness probe: bounded one-edge payment readiness check." }],
      metadata: {
        mode: "economic_demo_live_x402_readiness",
        profileId,
        noCoolifyChanges: true,
        noDevnetTransferFromHarness: true,
      },
    }),
  });
}

async function responseSummary(response) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }
  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type") ?? undefined,
    x402Request: response.headers.get("x402-request") ?? undefined,
    body,
  };
}

assert(endpoint.startsWith("https://"), "live x402 readiness requires exact https endpoint");
assert(confirm, `live x402 readiness requires ECONOMIC_DEMO_LIVE_X402_CONFIRM=${CONFIRM}`);

const unpaidResponse = await post();
const unpaid = await responseSummary(unpaidResponse);
assert(unpaid.status === 402, `expected unpaid 402 challenge, got ${unpaid.status}`);
assert(typeof unpaid.x402Request === "string" && unpaid.x402Request.length > 0, "expected x402-request header");

let challenge;
try {
  challenge = JSON.parse(unpaid.x402Request);
} catch (error) {
  throw new Error(`invalid x402-request JSON: ${error instanceof Error ? error.message : String(error)}`);
}

let paidRetry = null;
if (allowPaidRetry) {
  const demoPaymentHeader = `demo:${challenge.nonce}`;
  const paidResponse = await post({ "x402-payment": demoPaymentHeader });
  paidRetry = await responseSummary(paidResponse);
}

const paidCompletionReached = paidRetry?.ok === true;
const blocker = paidRetry && !paidRetry.ok ? paidRetry.body?.error?.code ?? `http_${paidRetry.status}` : allowPaidRetry ? undefined : "paid_retry_not_requested";

const report = {
  schemaVersion: "reddi.economic-demo.live-x402-readiness.v1",
  generatedAt: new Date().toISOString(),
  endpoint,
  profileId,
  mode: "controlled_live_x402_readiness",
  confirmationRequired: CONFIRM,
  downstreamCallsExecuted: allowPaidRetry ? 2 : 1,
  unpaidChallenge: {
    status: unpaid.status,
    contentType: unpaid.contentType,
    challenge: {
      version: challenge.version,
      network: challenge.network,
      payTo: challenge.payTo,
      amount: challenge.amount,
      currency: challenge.currency,
      endpoint: challenge.endpoint,
      noncePresent: typeof challenge.nonce === "string" && challenge.nonce.length > 0,
    },
    errorCode: unpaid.body?.error?.code,
  },
  paidRetry: paidRetry
    ? {
        status: paidRetry.status,
        ok: paidRetry.ok,
        contentType: paidRetry.contentType,
        errorCode: paidRetry.body?.error?.code,
        paymentSatisfied: paidRetry.ok,
      }
    : undefined,
  conclusion: paidCompletionReached ? "paid_completion_reached" : "paid_completion_blocked",
  blocker,
  guardrails: {
    exactEndpoint: true,
    noSignerMaterialUsed: true,
    noSignatureAttemptedByHarness: true,
    noDevnetTransferFromHarness: true,
    noCoolifyChanges: true,
    boundedMaxTwoDownstreamCalls: true,
  },
};

const summaryPath = join(outDir, "summary.json");
writeFileSync(summaryPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  join(outDir, "SUMMARY.md"),
  `# Economic Demo Live x402 Readiness\n\n- Endpoint: ${endpoint}\n- Profile: ${profileId}\n- Downstream calls: ${report.downstreamCallsExecuted}\n- Unpaid challenge: ${unpaid.status}\n- Paid retry: ${paidRetry ? paidRetry.status : "not requested"}\n- Conclusion: ${report.conclusion}\n- Blocker: ${blocker ?? "none"}\n- JSON: ${summaryPath}\n`,
);

console.log(JSON.stringify({ ok: true, summaryPath, conclusion: report.conclusion, blocker }, null, 2));
