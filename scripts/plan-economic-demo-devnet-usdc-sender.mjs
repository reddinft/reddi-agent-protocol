#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-devnet-usdc-sender-plan", timestamp);
mkdirSync(outDir, { recursive: true });

const REQUIRED_CONFIRM = "RUN_ECONOMIC_DEMO_LIVE_PAYMENT_RECEIPT_LANE";
const EXECUTOR_CONFIRM = "SEND_ECONOMIC_DEMO_DEVNET_USDC_PAYMENT";
const gatePath = process.env.ECONOMIC_DEMO_LIVE_PAYMENT_GATE_SOURCE
  ? join(rootDir, process.env.ECONOMIC_DEMO_LIVE_PAYMENT_GATE_SOURCE)
  : null;
const signerRef = process.env.ECONOMIC_DEMO_DEVNET_USDC_SIGNER_REF || "";
const sourceTokenAccount = process.env.ECONOMIC_DEMO_DEVNET_USDC_SOURCE_TOKEN_ACCOUNT || "";
const destinationTokenAccount = process.env.ECONOMIC_DEMO_DEVNET_USDC_DESTINATION_TOKEN_ACCOUNT || "";
const amountUsdc = Number(process.env.ECONOMIC_DEMO_DEVNET_USDC_AMOUNT || "0");
const maxUsdc = Number(process.env.ECONOMIC_DEMO_LIVE_PAYMENT_MAX_USDC || "0");

let gate = null;
if (gatePath && existsSync(gatePath)) gate = JSON.parse(readFileSync(gatePath, "utf8"));

const checks = [
  { id: "gate_source_present", ok: Boolean(gatePath), summary: "ECONOMIC_DEMO_LIVE_PAYMENT_GATE_SOURCE must point to a reviewed gate artifact" },
  { id: "gate_source_exists", ok: Boolean(gate), summary: "gate artifact must exist" },
  { id: "gate_ready", ok: gate?.status === "ready", summary: "gate artifact must be ready" },
  { id: "gate_usdc_devnet", ok: gate?.requestedLane === "USDC" && gate?.network === "solana-devnet", summary: "sender plan only supports gated devnet USDC direct payment" },
  { id: "gate_confirmation", ok: gate?.requiredConfirmation === REQUIRED_CONFIRM, summary: "gate must use the live payment receipt lane confirmation" },
  { id: "signer_reference_present", ok: signerRef.length > 0, summary: "signer reference must be explicit; raw secret keys must not be committed" },
  { id: "source_token_account_present", ok: sourceTokenAccount.length > 0, summary: "source USDC token account must be explicit" },
  { id: "destination_token_account_present", ok: destinationTokenAccount.length > 0, summary: "destination USDC token account must be explicit" },
  { id: "amount_within_cap", ok: Number.isFinite(amountUsdc) && amountUsdc > 0 && Number.isFinite(maxUsdc) && maxUsdc > 0 && amountUsdc <= maxUsdc, summary: "amount must be positive and <= approved max USDC cap" },
];

const status = checks.every((check) => check.ok) ? "ready_to_review" : "blocked";
const executorShape = {
  commandName: "send:economic-demo:devnet-usdc-payment",
  implemented: false,
  requiredPackage: "@solana/spl-token",
  requiredConfirmation: EXECUTOR_CONFIRM,
  expectedSteps: [
    "Load signer from secure reference at runtime only.",
    "Build a devnet SPL-token transferChecked instruction for the approved USDC mint and amount.",
    "Submit exactly one transaction with confirmed commitment and no automatic retry loop.",
    "Write transaction signature artifact.",
    "Immediately run verify:economic-demo:devnet-usdc-receipt against the signature.",
    "Attach verified receipt status to evidence:economic-demo:upfront-payment.",
  ],
};

const artifact = {
  schemaVersion: "reddi.economic-demo.devnet-usdc-sender-plan.v1",
  generatedAt: new Date().toISOString(),
  status,
  gatePath: gatePath ? gatePath.replace(`${rootDir}/`, "") : null,
  signerReferencePresent: signerRef.length > 0,
  sourceTokenAccountPresent: sourceTokenAccount.length > 0,
  destinationTokenAccountPresent: destinationTokenAccount.length > 0,
  amountUsdc: Number.isFinite(amountUsdc) && amountUsdc > 0 ? amountUsdc : null,
  maxUsdc: Number.isFinite(maxUsdc) && maxUsdc > 0 ? maxUsdc : null,
  checks,
  executorShape,
  guardrails: [
    "Planning script only: no transaction construction, signing, submission, or token transfer occurs.",
    "Future sender must live behind the existing gate and a second executor-specific confirmation token.",
    "Future sender must immediately verify its own signature with verify:economic-demo:devnet-usdc-receipt.",
  ],
};

const jsonPath = join(outDir, "sender-plan.json");
const mdPath = join(outDir, "SUMMARY.md");
writeFileSync(jsonPath, `${JSON.stringify(artifact, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Economic Demo Devnet USDC Sender Plan",
    "",
    `- Status: ${status}`,
    `- Implemented executor: ${executorShape.implemented}`,
    `- Required future confirmation: ${EXECUTOR_CONFIRM}`,
    "",
    "## Checks",
    "",
    ...checks.map((check) => `- ${check.ok ? "✅" : "❌"} ${check.id}: ${check.summary}`),
    "",
    "## Future executor steps",
    "",
    ...executorShape.expectedSteps.map((step) => `- ${step}`),
    "",
  ].join("\n"),
);

console.log(JSON.stringify({ ok: true, status, jsonPath, mdPath, blockers: checks.filter((check) => !check.ok).map((check) => check.id) }, null, 2));
