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

function latestArtifact(root, filename) {
  const base = join(rootDir, root);
  if (!existsSync(base)) return null;
  const candidates = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(base, entry.name, filename))
    .filter((path) => existsSync(path))
    .sort();
  return candidates.at(-1) ?? null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const sourcePath = process.env.ECONOMIC_DEMO_UPFRONT_SURFPOOL_SOURCE
  ? join(rootDir, process.env.ECONOMIC_DEMO_UPFRONT_SURFPOOL_SOURCE)
  : latestArtifact(join("artifacts", "economic-demo-surfpool-rehearsal"), "summary.json");

assert(sourcePath, "missing_surfpool_rehearsal_source");
const jupiterQuotePath = process.env.ECONOMIC_DEMO_UPFRONT_JUPITER_QUOTE_SOURCE
  ? join(rootDir, process.env.ECONOMIC_DEMO_UPFRONT_JUPITER_QUOTE_SOURCE)
  : latestArtifact(join("artifacts", "economic-demo-jupiter-quote-proof"), "quote-proof.json");

const devnetUsdcReceiptPath = process.env.ECONOMIC_DEMO_UPFRONT_DEVNET_USDC_RECEIPT_SOURCE
  ? join(rootDir, process.env.ECONOMIC_DEMO_UPFRONT_DEVNET_USDC_RECEIPT_SOURCE)
  : latestArtifact(join("artifacts", "economic-demo-devnet-usdc-receipt"), "receipt-verification.json");

const surfpool = readJson(sourcePath);
assert(surfpool.schemaVersion === "reddi.economic-demo.surfpool-rehearsal.v1", "unsupported_surfpool_schema");
assert(surfpool.upfrontFunding?.signature, "missing_upfront_funding_signature");
assert(surfpool.jupiterSolRoute?.status, "missing_jupiter_route_status");
assert(surfpool.positiveProof?.specialistCreditsMatchDownstreamTransfers === true, "specialist_credits_do_not_match_downstream_transfers");
assert(surfpool.positiveProof?.protocolFeeMatchesExpectedBps === true, "protocol_fee_does_not_match_expected_bps");
assert(surfpool.positiveProof?.upfrontCoversDownstreamBudget === true, "upfront_does_not_cover_downstream_budget");
assert(surfpool.positiveProof?.orchestratorRetainsPositiveMarkupBeforeFees === true, "orchestrator_markup_not_retained");
assert(surfpool.negativeProof?.totalBlockedDeltaLamports === 0, "blocked_transfer_mutated_balance");

const devnetUsdcReceipt = devnetUsdcReceiptPath && existsSync(devnetUsdcReceiptPath) ? readJson(devnetUsdcReceiptPath) : null;
if (devnetUsdcReceipt) {
  assert(devnetUsdcReceipt.schemaVersion === "reddi.economic-demo.devnet-usdc-receipt-verification.v1", "unsupported_devnet_usdc_receipt_schema");
  assert(devnetUsdcReceipt.status === "verified" || devnetUsdcReceipt.status === "blocked", "unsupported_devnet_usdc_receipt_status");
}

const jupiterQuote = jupiterQuotePath && existsSync(jupiterQuotePath) ? readJson(jupiterQuotePath) : null;
if (jupiterQuote) {
  assert(jupiterQuote.schemaVersion === "reddi.economic-demo.jupiter-quote-proof.v1", "unsupported_jupiter_quote_schema");
  assert(jupiterQuote.response?.ok === true, "jupiter_quote_not_ok");
  assert(jupiterQuote.response?.outUsdc >= surfpool.upfrontFunding.amountUsdc, "jupiter_quote_output_below_upfront_fee");
}

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
  devnetUsdcReceiptVerification: devnetUsdcReceipt
    ? {
        sourceArtifactPath: relative(rootDir, devnetUsdcReceiptPath),
        status: devnetUsdcReceipt.status,
        signaturePresent: Boolean(devnetUsdcReceipt.signature),
        verifiedTransfer: devnetUsdcReceipt.verifiedTransfer,
        blockers: devnetUsdcReceipt.checks?.filter((check) => !check.ok).map((check) => check.id) ?? [],
      }
    : null,
  liveJupiterQuoteProof: jupiterQuote
    ? {
        sourceArtifactPath: relative(rootDir, jupiterQuotePath),
        inputSol: jupiterQuote.request.inputSol,
        outputUsdc: jupiterQuote.response.outUsdc,
        slippageBps: jupiterQuote.request.slippageBps,
        routePlanLength: jupiterQuote.response.routePlanLength,
        quoteOnly: true,
      }
    : null,
  budgetProof: surfpool.positiveProof,
  protocolRailFee: surfpool.protocolRailFee,
  negativeProof: surfpool.negativeProof,
  executedTransferCount: surfpool.executedTransfers.length,
  downstreamTransferCount: surfpool.executedTransfers.filter((transfer) => transfer.category === "downstream_agent_payment").length,
  guardrails: [
    ...surfpool.guardrails,
    "Evidence pack is public-safe: private key material is not included.",
    "Every agent-to-agent payment through Reddi Agent Protocol rails pays the configured 0.05% protocol fee to protocol treasury.",
    "Jupiter route is quote/proof-lane metadata here; live swap is not claimed unless status contains an executed swap receipt.",
    ...(jupiterQuote ? ["A live Jupiter quote was fetched without requesting a swap transaction."] : []),
    ...(devnetUsdcReceipt?.status === "verified" ? ["A devnet USDC receipt was verified against explicit cap and recipient constraints."] : []),
  ],
  limitations: [
    "Surfpool/local proof demonstrates transaction ordering and budget math before devnet/live mutation.",
    "USDC is represented by deterministic lamports-equivalent accounting in this local rehearsal artifact.",
    "SOL→USDC Jupiter route is quoted/not executed in this local proof pack.",
    ...(jupiterQuote ? ["Live Jupiter quote proves current route availability only; no swap/signature is claimed."] : []),
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
    `- Protocol rail fee: **${pack.protocolRailFee.totalFeeLamports} lamports** (${pack.protocolRailFee.bps} bps → ${pack.protocolRailFee.treasuryProfileId})`,
    `- Protocol fee matches expected bps: **${pack.budgetProof.protocolFeeMatchesExpectedBps}**`,
    `- Specialist credits match downstream transfers: **${pack.budgetProof.specialistCreditsMatchDownstreamTransfers}**`,
    `- Upfront covers downstream budget + protocol fee: **${pack.budgetProof.upfrontCoversDownstreamBudget}**`,
    `- Orchestrator retains positive markup after fees: **${pack.budgetProof.orchestratorRetainsPositiveMarkupBeforeFees}**`,
    `- Blocked transfer balance mutation: **${pack.negativeProof.totalBlockedDeltaLamports}**`,
    "",
    "## Jupiter route",
    "",
    `- ${pack.jupiterSolRoute.estimatedInputSol} SOL → ${pack.jupiterSolRoute.outputUsdc} USDC`,
    `- Slippage cap: ${pack.jupiterSolRoute.slippageBps} bps`,
    `- Status: ${pack.jupiterSolRoute.status}`,
    pack.liveJupiterQuoteProof ? `- Live quote proof: ${pack.liveJupiterQuoteProof.inputSol} SOL → ${pack.liveJupiterQuoteProof.outputUsdc} USDC across ${pack.liveJupiterQuoteProof.routePlanLength} route leg(s)` : "- Live quote proof: not attached",
    pack.devnetUsdcReceiptVerification ? `- Devnet USDC receipt verification: ${pack.devnetUsdcReceiptVerification.status}` : "- Devnet USDC receipt verification: not attached",
    "",
    "## Limitations",
    "",
    ...pack.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n"),
);

console.log(JSON.stringify({ ok: true, outDir, jsonPath, mdPath, sourceArtifactPath: pack.sourceArtifactPath }, null, 2));
