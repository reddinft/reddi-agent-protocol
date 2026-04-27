import fs from "fs";

const appBase = process.env.APP_BASE;
const invokePath = "/api/planner/tools/invoke";
const targetWallet = process.env.TARGET_WALLET;
const consumerWallet = process.env.CONSUMER_WALLET;
const runsPath = process.env.PLANNER_RUNS_PATH;
const outputPath = process.env.JUPITER_INVOKE_RESULT_PATH;
const policyPath = process.env.ORCHESTRATOR_POLICY_PATH;

if (!appBase || !targetWallet || !consumerWallet || !runsPath || !outputPath || !policyPath) {
  throw new Error("Missing required env for runner");
}

const policyNow = {
  enabled: true,
  maxPerTaskUsd: 1,
  dailyBudgetUsd: 10,
  allowedTaskTypes: [],
  minReputation: 0,
  requireAttestation: false,
  preferredPrivacyMode: "public",
  fallbackMode: "skip",
  updatedAt: new Date().toISOString(),
};
fs.mkdirSync(policyPath.split("/").slice(0, -1).join("/"), { recursive: true });
fs.writeFileSync(policyPath, JSON.stringify(policyNow, null, 2));

const preflightRes = await fetch(`${appBase}/api/onboarding/planner/execute`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    prompt: "Preflight candidate check",
    policy: {
      requiredPrivacyMode: "public",
      requiresAttested: false,
      requiresHealthPass: true,
      maxPerCallUsd: 1,
    },
  }),
});

const preflightBody = await preflightRes.json();
if (!preflightBody?.ok) {
  throw new Error(`Planner preflight failed: status=${preflightRes.status} body=${JSON.stringify(preflightBody)}`);
}

const invokeRes = await fetch(`${appBase}${invokePath}`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    prompt: "Summarize this market snapshot in one sentence.",
    targetWallet,
    consumerWallet,
    policy: {
      preferredPrivacyMode: "public",
      requireAttestation: false,
      maxPerCallUsd: 1,
    },
  }),
});

const invokeBody = await invokeRes.json();
if (!invokeRes.ok || !invokeBody.ok) {
  throw new Error(`Invoke route failed: status=${invokeRes.status} body=${JSON.stringify(invokeBody)}`);
}

if (!invokeBody.paymentSatisfied) {
  throw new Error(`Expected paymentSatisfied=true, got: ${JSON.stringify(invokeBody)}`);
}

if (!invokeBody.runId) {
  throw new Error(`Missing runId in invoke response: ${JSON.stringify(invokeBody)}`);
}

const runs = JSON.parse(fs.readFileSync(runsPath, "utf8"));
const run = runs.find((r) => r.runId === invokeBody.runId);
if (!run) {
  throw new Error(`Run ${invokeBody.runId} not found in ${runsPath}`);
}

const trace = Array.isArray(run.trace) ? run.trace : [];
const swapTrace = trace.find((line) => typeof line === "string" && line.startsWith("x402:swap_used:"));
if (!swapTrace) {
  throw new Error(`Expected x402 swap trace in run ${run.runId}. trace=${JSON.stringify(trace)}`);
}

const result = {
  ok: true,
  preflight: {
    runId: preflightBody?.result?.result?.runId,
    selectedWallet: preflightBody?.result?.result?.selectedWallet,
    status: preflightBody?.result?.result?.status,
  },
  invoke: invokeBody,
  run: {
    runId: run.runId,
    status: run.status,
    challengeSeen: run.challengeSeen,
    paymentAttempted: run.paymentAttempted,
    paymentSatisfied: run.paymentSatisfied,
    x402TxSignature: run.x402TxSignature,
    trace,
  },
  checks: {
    swapTrace,
  },
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
