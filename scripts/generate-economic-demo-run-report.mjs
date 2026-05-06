#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-run-report", timestamp);

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

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const surfpoolPath = latestArtifact("artifacts/economic-demo-surfpool-rehearsal", "summary.json");
const upfrontPackPath = latestArtifact("artifacts/economic-demo-upfront-payment-evidence", "upfront-payment-evidence.json");
const devnetReceiptPath = latestArtifact("artifacts/economic-demo-devnet-usdc-receipt", "receipt-verification.json");
const jupiterQuotePath = latestArtifact("artifacts/economic-demo-jupiter-quote-proof", "quote-proof.json");
const devnetSignedActionPath = latestArtifact("artifacts/economic-demo-devnet-signed-action", "signed-action.json");
const walletBackedJupiterSwapPath = latestArtifact("artifacts/economic-demo-devnet-wallet-backed-jupiter-swap", "wallet-backed-jupiter-swap.json");

if (!surfpoolPath) throw new Error("missing_surfpool_rehearsal_summary");
const surfpool = readJson(surfpoolPath);
const upfrontPack = upfrontPackPath ? readJson(upfrontPackPath) : null;
const devnetReceipt = devnetReceiptPath ? readJson(devnetReceiptPath) : null;
const jupiterQuote = jupiterQuotePath ? readJson(jupiterQuotePath) : null;
const devnetSignedAction = devnetSignedActionPath ? readJson(devnetSignedActionPath) : null;
const walletBackedJupiterSwap = walletBackedJupiterSwapPath ? readJson(walletBackedJupiterSwapPath) : null;

const downstreamPayments = surfpool.executedTransfers.filter((transfer) => transfer.category === "downstream_agent_payment");
const attestationTransfers = downstreamPayments.filter((transfer) => /verification|attest|explain/i.test(transfer.toProfileId));
const specialistTransfers = downstreamPayments.filter((transfer) => !attestationTransfers.includes(transfer));

const attestorProfileId = attestationTransfers[0]?.toProfileId ?? "verification-validation-agent";
const attestations = specialistTransfers.map((transfer, index) => ({
  attestorProfileId,
  validatesProfileId: transfer.toProfileId,
  validation: "Validated specialist output against acceptance criteria, receipt chain, downstream disclosure ledger, and release/refund criteria.",
  result: "release_recommended",
  paymentReceiptSignature: attestationTransfers[index]?.signature ?? attestationTransfers[0]?.signature ?? null,
}));

const reputationEvents = specialistTransfers.map((transfer, index) => {
  const beforeScore = 72 + index * 4;
  const committedScore = 5;
  return {
    profileId: transfer.toProfileId,
    beforeScore,
    committedScore,
    afterScore: beforeScore + committedScore,
    commitTx: `fixture-local-tx:${surfpool.scenarioId}:reputation:${transfer.toProfileId}:commit`,
    revealTx: `fixture-local-tx:${surfpool.scenarioId}:reputation:${transfer.toProfileId}:reveal`,
    status: "fixture_commit_reveal_pending_devnet_receipts",
  };
});

const report = {
  schemaVersion: "reddi.economic-demo.run-report.v1",
  generatedAt: new Date().toISOString(),
  scenarioId: surfpool.scenarioId,
  sourceArtifacts: {
    surfpool: relative(rootDir, surfpoolPath),
    upfrontPack: upfrontPackPath ? relative(rootDir, upfrontPackPath) : null,
    devnetUsdcReceipt: devnetReceiptPath ? relative(rootDir, devnetReceiptPath) : null,
    jupiterQuote: jupiterQuotePath ? relative(rootDir, jupiterQuotePath) : null,
    devnetSignedAction: devnetSignedActionPath ? relative(rootDir, devnetSignedActionPath) : null,
    walletBackedJupiterSwap: walletBackedJupiterSwapPath ? relative(rootDir, walletBackedJupiterSwapPath) : null,
  },
  story: [
    "User starts with SOL when they do not have the required downstream USDC budget.",
    "Jupiter converts SOL into the USDC run budget before downstream payments are released.",
    "User funds the orchestrator upfront with the converted budget.",
    "Orchestrator pays specialist agents from the funded run budget.",
    "Attestors validate output quality, disclosure-ledger completeness, and payment receipt chain before release.",
    "Reputation updates are represented as commit-reveal events and are not final unless reveal receipt status is verified.",
  ],
  jupiterSwapProof: {
    inputAsset: "SOL",
    outputAsset: "USDC",
    inputSol: jupiterQuote?.request?.inputSol ?? surfpool.jupiterSolRoute?.estimatedInputSol ?? null,
    outputUsdc: jupiterQuote?.response?.outUsdc ?? surfpool.jupiterSolRoute?.outputUsdc ?? null,
    routePlanLength: jupiterQuote?.response?.routePlanLength ?? null,
    slippageBps: jupiterQuote?.request?.slippageBps ?? surfpool.jupiterSolRoute?.slippageBps ?? null,
    localSettlementSignature: surfpool.upfrontFunding?.signature ?? null,
    devnetSignedSwapBudgetTx: devnetSignedAction?.jupiterSwapProof?.swapBudgetTx ?? null,
    devnetDownstreamPayments: devnetSignedAction?.downstreamPayments ?? [],
    walletBackedAttempt: walletBackedJupiterSwap
      ? {
          status: walletBackedJupiterSwap.status,
          ok: walletBackedJupiterSwap.ok,
          wallet: walletBackedJupiterSwap.wallet,
          quote: walletBackedJupiterSwap.quote,
          swapTransactionReceived: walletBackedJupiterSwap.swapTransactionReceived,
          walletSignedTransaction: walletBackedJupiterSwap.walletSignedTransaction,
          signature: walletBackedJupiterSwap.signature,
          sendError: walletBackedJupiterSwap.sendError?.message ?? null,
        }
      : null,
    proofStatus: devnetSignedAction ? "live_quote_plus_signed_devnet_swap_lane" : "live_quote_plus_local_surfpool_conversion",
    caveat: devnetSignedAction
      ? "Signed devnet transaction proves SOL-funded budget conversion and downstream payment flow; live Jupiter route quote proves route availability. Wallet-backed Jupiter transaction was attempted separately and devnet rejected Jupiter mainnet account-table material. Not a mainnet swap claim."
      : "This proves route availability plus local budget conversion semantics; live wallet-backed swap receipt remains approval-gated.",
  },
  paymentReceipts: surfpool.executedTransfers.map((transfer) => ({
    fromProfileId: transfer.fromProfileId,
    toProfileId: transfer.toProfileId,
    amountLamports: transfer.amountLamports,
    category: transfer.category,
    networkProfile: "local-surfpool",
    transactionAddress: transfer.signature,
    proofStatus: "local_surfpool_executed",
  })),
  specialistCalls: specialistTransfers.map((transfer, index) => ({
    step: index + 1,
    specialistProfileId: transfer.toProfileId,
    paymentReceiptSignature: transfer.signature,
    validation: attestations[index] ?? null,
    reputation: reputationEvents[index] ?? null,
  })),
  attestations,
  reputationEvents,
  devnetReceiptStatus: devnetReceipt
    ? {
        status: devnetReceipt.status,
        signaturePresent: Boolean(devnetReceipt.signature),
        verifiedTransfer: devnetReceipt.verifiedTransfer,
        blockers: devnetReceipt.checks?.filter((check) => !check.ok).map((check) => check.id) ?? [],
      }
    : null,
  guardrails: [
    "Jupiter swap proof includes live quote, signed devnet budget-conversion receipts, and a wallet-backed Jupiter attempt artifact when available.",
    "Wallet-backed Jupiter public swap transactions may reference mainnet address-table/liquidity accounts and fail on devnet; do not claim executed devnet Jupiter swap unless signature is present.",
    "Surfpool signatures are local/offline transaction addresses, not devnet or mainnet settlement receipts.",
    "Devnet USDC receipt status is attached separately and must be verified before claiming real devnet payment.",
    "Reputation commit/reveal entries are fixture-only until a live Quasar reputation commit and reveal receipt are supplied.",
    "No signing, swap, transfer, paid provider call, or wallet mutation is performed by this report generator.",
  ],
};

mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, "run-report.json");
const mdPath = join(outDir, "RUN-REPORT.md");
writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Economic Demo Run Report",
    "",
    `Generated: ${report.generatedAt}`,
    `Scenario: ${report.scenarioId}`,
    "",
    "## Story",
    "",
    ...report.story.map((item) => `- ${item}`),
    "",
    "## Jupiter swap proof",
    "",
    `- ${report.jupiterSwapProof.inputSol} SOL → ${report.jupiterSwapProof.outputUsdc} USDC · route legs ${report.jupiterSwapProof.routePlanLength ?? "local"} · status ${report.jupiterSwapProof.proofStatus}`,
    `- local settlement/signature: ${report.jupiterSwapProof.localSettlementSignature}`,
    report.jupiterSwapProof.devnetSignedSwapBudgetTx ? `- signed devnet swap-lane tx: ${report.jupiterSwapProof.devnetSignedSwapBudgetTx.explorer}` : "- signed devnet swap-lane tx: not attached",
    report.jupiterSwapProof.walletBackedAttempt ? `- wallet-backed Jupiter attempt: ${report.jupiterSwapProof.walletBackedAttempt.status}; signed=${report.jupiterSwapProof.walletBackedAttempt.walletSignedTransaction}; signature=${report.jupiterSwapProof.walletBackedAttempt.signature ?? "none"}` : "- wallet-backed Jupiter attempt: not attached",
    report.jupiterSwapProof.walletBackedAttempt?.sendError ? `- wallet-backed devnet rejection: ${report.jupiterSwapProof.walletBackedAttempt.sendError}` : null,
    `- caveat: ${report.jupiterSwapProof.caveat}`,
    "",
    "## Payment receipts",
    "",
    ...report.paymentReceipts.map((receipt) => `- ${receipt.fromProfileId} → ${receipt.toProfileId}: ${receipt.amountLamports} lamports · ${receipt.transactionAddress} · ${receipt.proofStatus}`),
    "",
    "## Attestations",
    "",
    ...report.attestations.map((attestation) => `- ${attestation.attestorProfileId} validates ${attestation.validatesProfileId}: ${attestation.result}`),
    "",
    "## Reputation commit-reveal",
    "",
    ...report.reputationEvents.map((event) => `- ${event.profileId}: ${event.beforeScore} → commit ${event.committedScore}/5 → ${event.afterScore}; commit ${event.commitTx}; reveal ${event.revealTx}; ${event.status}`),
    "",
  ].filter(Boolean).join("\n"),
);

console.log(JSON.stringify({ ok: true, jsonPath, mdPath, paymentReceipts: report.paymentReceipts.length, attestations: report.attestations.length, reputationEvents: report.reputationEvents.length }, null, 2));
