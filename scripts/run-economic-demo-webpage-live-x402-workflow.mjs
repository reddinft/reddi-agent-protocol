#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-webpage-live-x402-workflow", timestamp);
mkdirSync(outDir, { recursive: true });

const CONFIRM = "RUN_ECONOMIC_DEMO_WEBPAGE_LIVE_X402_WORKFLOW";
const confirm = process.env.ECONOMIC_DEMO_WEBPAGE_LIVE_X402_CONFIRM === CONFIRM;
const allowPaidRetries = process.env.ECONOMIC_DEMO_WEBPAGE_LIVE_X402_PAID_RETRY === "1" || process.env.ECONOMIC_DEMO_WEBPAGE_LIVE_X402_PAID_RETRY === "true";

const edges = [
  {
    step: 1,
    profileId: "planning-agent",
    capability: "task-decomposition",
    endpoint: "https://reddi-planning-agent.preview.reddi.tech/v1/chat/completions",
    prompt({ userRequest }) {
      return `${userRequest}\n\nPlan a one-page landing page. Return concise sections and acceptance criteria.`;
    },
  },
  {
    step: 2,
    profileId: "content-creation-agent",
    capability: "marketing-copy",
    endpoint: "https://reddi-content-creation.preview.reddi.tech/v1/chat/completions",
    prompt({ userRequest, outputs }) {
      return `${userRequest}\n\nPlanning output:\n${outputs["planning-agent"]}\n\nDraft short landing page copy. Include headline, subheadline, and three benefit bullets.`;
    },
  },
  {
    step: 3,
    profileId: "code-generation-agent",
    capability: "webpage-code",
    endpoint: "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
    prompt({ userRequest, outputs }) {
      return `${userRequest}\n\nPlanning output:\n${outputs["planning-agent"]}\n\nCopy output:\n${outputs["content-creation-agent"]}\n\nCreate a compact React/Tailwind landing page component. Return code plus a brief validation note.`;
    },
  },
  {
    step: 4,
    profileId: "verification-validation-agent",
    capability: "attestation",
    endpoint: "https://reddi-verification-agent.preview.reddi.tech/v1/chat/completions",
    prompt({ userRequest, outputs }) {
      return `${userRequest}\n\nEvidence chain:\n\n[planning-agent]\n${outputs["planning-agent"]}\n\n[content-creation-agent]\n${outputs["content-creation-agent"]}\n\n[code-generation-agent]\n${outputs["code-generation-agent"]}\n\nVerify whether the workflow has planning, copy, code, and release criteria. Return release/refund/dispute recommendation with brief evidence.`;
    },
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function redactText(value, max = 900) {
  if (typeof value !== "string") return undefined;
  return value.replace(/sk-[a-zA-Z0-9_-]+/g, "sk-…redacted").slice(0, max);
}

async function post(edge, prompt, headers = {}) {
  return fetch(edge.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      metadata: {
        mode: "economic_demo_webpage_live_x402_workflow",
        workflow: "webpage",
        step: edge.step,
        profileId: edge.profileId,
        noDevnetTransferFromHarness: true,
      },
    }),
  });
}

async function summarizeResponse(response) {
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 900) };
  }
  const content = body?.choices?.[0]?.message?.content;
  return {
    status: response.status,
    ok: response.ok,
    contentType: response.headers.get("content-type") ?? undefined,
    x402Request: response.headers.get("x402-request") ?? undefined,
    bodySummary: {
      errorCode: body?.error?.code,
      model: body?.model,
      choiceContentPreview: redactText(content),
      rawPreview: content ? undefined : redactText(body?.raw ?? JSON.stringify(body).slice(0, 900)),
    },
  };
}

function parseChallenge(edge, unpaid) {
  assert(unpaid.status === 402, `${edge.profileId}: expected unpaid 402 challenge, got ${unpaid.status}`);
  assert(typeof unpaid.x402Request === "string" && unpaid.x402Request.length > 0, `${edge.profileId}: expected x402-request header`);
  try {
    return JSON.parse(unpaid.x402Request);
  } catch (error) {
    throw new Error(`${edge.profileId}: invalid x402-request JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

assert(confirm, `webpage live x402 workflow requires ECONOMIC_DEMO_WEBPAGE_LIVE_X402_CONFIRM=${CONFIRM}`);
assert(allowPaidRetries, "webpage live x402 workflow requires ECONOMIC_DEMO_WEBPAGE_LIVE_X402_PAID_RETRY=1");

const userRequest = "Design me a webpage for a trustless AI agent marketplace where users pay specialist agents via x402 and receive attested outputs.";
const outputs = {};
const results = [];
for (const edge of edges) {
  assert(edge.endpoint.startsWith("https://"), `${edge.profileId}: endpoint must be https`);
  const prompt = edge.prompt({ userRequest, outputs });
  const unpaid = await summarizeResponse(await post(edge, prompt));
  const challenge = parseChallenge(edge, unpaid);
  const paid = await summarizeResponse(await post(edge, prompt, { "x402-payment": `demo:${challenge.nonce}` }));
  outputs[edge.profileId] = paid.bodySummary.choiceContentPreview ?? paid.bodySummary.rawPreview ?? "";
  results.push({
    ...edge,
    prompt: undefined,
    unpaidChallenge: {
      status: unpaid.status,
      contentType: unpaid.contentType,
      errorCode: unpaid.bodySummary.errorCode,
      challenge: {
        version: challenge.version,
        network: challenge.network,
        payTo: challenge.payTo,
        amount: challenge.amount,
        currency: challenge.currency,
        endpoint: challenge.endpoint,
        noncePresent: typeof challenge.nonce === "string" && challenge.nonce.length > 0,
      },
    },
    paidCompletion: {
      status: paid.status,
      ok: paid.ok,
      contentType: paid.contentType,
      errorCode: paid.bodySummary.errorCode,
      paymentSatisfied: paid.ok,
      model: paid.bodySummary.model,
      outputPreview: paid.bodySummary.choiceContentPreview ?? paid.bodySummary.rawPreview,
    },
  });
}

const allPaidCompletionsReached = results.every((edge) => edge.paidCompletion.ok === true);
const blockers = results
  .filter((edge) => !edge.paidCompletion.ok)
  .map((edge) => ({ profileId: edge.profileId, status: edge.paidCompletion.status, errorCode: edge.paidCompletion.errorCode }));

const report = {
  schemaVersion: "reddi.economic-demo.webpage.live-x402-workflow.v1",
  generatedAt: new Date().toISOString(),
  mode: "controlled_demo_receipt_multi_edge_webpage_workflow",
  confirmationRequired: CONFIRM,
  scenarioId: "webpage",
  userRequest,
  orchestratorProfileId: "agentic-workflow-system",
  downstreamCallsExecuted: results.length * 2,
  edges: results,
  conclusion: allPaidCompletionsReached ? "multi_edge_paid_workflow_reached" : "multi_edge_paid_workflow_blocked",
  blockers,
  guardrails: {
    exactEndpoints: true,
    noSignerMaterialUsed: true,
    noSignatureAttemptedByHarness: true,
    noDevnetTransferFromHarness: true,
    controlledDemoReceiptsOnly: true,
    boundedMaxDownstreamCalls: edges.length * 2,
  },
};

const summaryPath = join(outDir, "summary.json");
writeFileSync(summaryPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  join(outDir, "SUMMARY.md"),
  `# Economic Demo Webpage Live x402 Workflow\n\n- Scenario: webpage\n- Mode: controlled demo receipts\n- Downstream calls: ${report.downstreamCallsExecuted}\n- Edges: ${results.length}\n- Conclusion: ${report.conclusion}\n- Blockers: ${blockers.length ? JSON.stringify(blockers) : "none"}\n- JSON: ${summaryPath}\n`,
);

console.log(JSON.stringify({ ok: true, summaryPath, conclusion: report.conclusion, blockers }, null, 2));
