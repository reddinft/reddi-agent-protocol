#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = process.env.ECONOMIC_DEMO_UPFRONT_EVIDENCE_OUT
  ? join(rootDir, process.env.ECONOMIC_DEMO_UPFRONT_EVIDENCE_OUT)
  : join(rootDir, "artifacts", "economic-demo-upfront-payment-evidence", timestamp);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function latestSummary(root) {
  const base = join(rootDir, root);
  if (!existsSync(base)) return null;
  const candidates = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(base, entry.name, "summary.json"))
    .filter((path) => existsSync(path))
    .sort();
  return candidates.at(-1) ?? null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourcePath = process.env.ECONOMIC_DEMO_UPFRONT_SURFPOOL_SOURCE
  ? join(rootDir, process.env.ECONOMIC_DEMO_UPFRONT_SURFPOOL_SOURCE)
  : latestSummary(join("artifacts", "economic-demo-surfpool-rehearsal"));

assert(sourcePath, "missing_surfpool_rehearsal_source");
const surfpool = readJson(sourcePath);
assert(surfpool.schemaVersion === "reddi.economic-demo.surfpool-rehearsal.v1", "unsupported_surfpool_schema");
assert(surfpool.upfrontFunding?.signature, "missing_upfront_funding_signature");
assert(surfpool.jupiterSolRoute?.status, "missing_jupiter_route_status");
assert(surfpool.positiveProof?.specialistCreditsMatchDownstreamTransfers === true, "specialist_credits_do_not_match_downstream_transfers");
assert(surfpool.positiveProof?.upfrontCoversDownstreamBudget === true, "upfront_does_not_cover_downstream_budget");
assert(surfpool.positiveProof?.orchestratorRetainsPositiveMarkupBeforeFees === true, "orchestrator_markup_not_retained");
assert(surfpool.negativeProof?.totalBlockedDeltaLamports === 0, "blocked_transfer_mutated_balance");

mkdirSync(outDir, { recursive: true });

const pack = {
  schemaVersion: "reddi.economic-demo.upfront-payment-evidence.v1",
  generatedAt: new Date().toISOString(),
  sourceArtifactPath: relative(rootDir, sourcePath),
  scenarioId: surfpool.scenarioId,
  proofMode: "surfpool_local_upfront_payment_rehearsal",
  userFunding: {
    paymentAsset: surfpool.upfrontFunding.paymentAsset,
    fromProfileId: surfpool.upfrontFunding.fromProfileId,
    toProfileId: surfpool.upfrontFunding.toProfileId,
    amountUsdc: surfpool.upfrontFunding.amountUsdc,
    equivalentLamports: surfpool.upfrontFunding.equivalentLamports,
    signaturePresent: Boolean(surfpool.upfrontFunding.signature),
  },
  jupiterSolRoute: surfpool.jupiterSolRoute,
  budgetProof: surfpool.positiveProof,
  negativeProof: surfpool.negativeProof,
  executedTransferCount: surfpool.executedTransfers.length,
  downstreamTransferCount: surfpool.executedTransfers.filter((transfer) => transfer.category === "downstream_agent_payment").length,
  guardrails: [
    ...surfpool.guardrails,
    "Evidence pack is public-safe: private key material is not included.",
    "Jupiter route is quote/proof-lane metadata here; live swap is not claimed unless status contains an executed swap receipt.",
  ],
  limitations: [
    "Surfpool/local proof demonstrates transaction ordering and budget math before devnet/live mutation.",
    "USDC is represented by deterministic lamports-equivalent accounting in this local rehearsal artifact.",
    "SOL→USDC Jupiter route is quoted/not executed in this local proof pack.",
  ],
  nextStep: "Run approval-gated devnet/live USDC receipt and SOL→USDC Jupiter swap receipt lanes, then regenerate this pack with live receipt fields.",
};

const jsonPath = join(outDir, "upfront-payment-evidence.json");
const mdPath = join(outDir, "EVIDENCE.md");
writeFileSync(jsonPath, `${JSON.stringify(pack, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Economic Demo Upfront Payment Evidence",
    "",
    `Generated: ${pack.generatedAt}`,
    `Source: \`${pack.sourceArtifactPath}\``,
    "",
    "## What this proves",
    "",
    `- User funds orchestrator first: **${pack.userFunding.signaturePresent}**`,
    `- Upfront funding: **${pack.userFunding.amountUsdc} ${pack.userFunding.paymentAsset}** (${pack.userFunding.equivalentLamports} local lamports-equivalent)`,
    `- Downstream transfer count: **${pack.downstreamTransferCount}**`,
    `- Specialist credits match downstream transfers: **${pack.budgetProof.specialistCreditsMatchDownstreamTransfers}**`,
    `- Upfront covers downstream budget: **${pack.budgetProof.upfrontCoversDownstreamBudget}**`,
    `- Orchestrator retains positive markup before fees: **${pack.budgetProof.orchestratorRetainsPositiveMarkupBeforeFees}**`,
    `- Blocked transfer balance mutation: **${pack.negativeProof.totalBlockedDeltaLamports}**`,
    "",
    "## Jupiter route",
    "",
    `- ${pack.jupiterSolRoute.estimatedInputSol} SOL → ${pack.jupiterSolRoute.outputUsdc} USDC`,
    `- Slippage cap: ${pack.jupiterSolRoute.slippageBps} bps`,
    `- Status: ${pack.jupiterSolRoute.status}`,
    "",
    "## Limitations",
    "",
    ...pack.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n"),
);

console.log(JSON.stringify({ ok: true, outDir, jsonPath, mdPath, sourceArtifactPath: pack.sourceArtifactPath }, null, 2));
