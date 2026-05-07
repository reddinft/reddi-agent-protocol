import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config.js";
import { currentPolicy } from "../src/policy.js";
import { BridgeStore } from "../src/store.js";
import { requestQuote } from "../src/tools/request-quote.js";
import { executeDevnetPayment } from "../src/tools/devnet-payment.js";

function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), "rap-mcp-bridge-"));
  return { dir, store: new BridgeStore(dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("default policy remains dry-run with exactly four safe tools", () => {
  const config = loadConfig({ HOME: tmpdir() });
  const policy = currentPolicy(config.policyMode);
  assert.equal(config.policyMode, "dry_run");
  assert.equal(policy.allowPayment, false);
  assert.deepEqual(policy.toolNames, [
    "reddi.discover_specialists",
    "reddi.request_quote",
    "reddi.verify_receipt",
    "reddi.export_disclosure_ledger",
  ]);
});

test("devnet policy advertises payment tools only when gates are ready", () => {
  const gatedOff = currentPolicy("devnet", false);
  assert.equal(gatedOff.mode, "dry_run");
  assert.equal(gatedOff.allowPayment, false);
  assert.ok(!gatedOff.toolNames.includes("reddi.execute_devnet_payment"));

  const gatedOn = currentPolicy("devnet", true);
  assert.equal(gatedOn.mode, "devnet");
  assert.equal(gatedOn.allowPayment, true);
  assert.ok(gatedOn.toolNames.includes("reddi.prepare_devnet_payment"));
  assert.ok(gatedOn.toolNames.includes("reddi.execute_devnet_payment"));
  assert.ok(gatedOn.toolNames.includes("reddi.verify_devnet_receipt"));
  assert.equal(gatedOn.allowMainnet, false);
  assert.equal(gatedOn.allowInvoke, false);
});

test("devnet execution rejects without explicit env approval", async () => {
  const { store, cleanup } = tempStore();
  try {
    const quote = requestQuote({
      taskSummary: "test devnet task",
      capability: "research",
      amount: "0.0001",
      currency: "SOL",
      network: "solana-devnet",
      payloadClass: "prompt_summary",
      evidenceRefs: [],
    }, store);
    const config = loadConfig({ HOME: tmpdir(), REDDI_RAP_MCP_MODE: "devnet", RAP_MCP_DEVNET_FUNDER_KEYPAIR: "/tmp/funder.json" });
    await assert.rejects(
      executeDevnetPayment({ quoteId: quote.quoteId, idempotencyKey: "idem-1", maxTotalDebitLamports: 3_300_000, approvalPhrase: "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store),
      /RAP_MCP_DEVNET_PROOF_APPROVED/,
    );
  } finally {
    cleanup();
  }
});

test("devnet execution rejects without approval phrase before network access", async () => {
  const { store, cleanup } = tempStore();
  try {
    const quote = requestQuote({
      taskSummary: "test devnet task",
      capability: "research",
      amount: "0.0001",
      currency: "SOL",
      network: "solana-devnet",
      payloadClass: "prompt_summary",
      evidenceRefs: [],
    }, store);
    const config = loadConfig({ HOME: tmpdir(), REDDI_RAP_MCP_MODE: "devnet", RAP_MCP_DEVNET_PROOF_APPROVED: "1", RAP_MCP_DEVNET_FUNDER_KEYPAIR: "/tmp/funder.json" });
    await assert.rejects(
      executeDevnetPayment({ quoteId: quote.quoteId, idempotencyKey: "idem-1", maxTotalDebitLamports: 3_300_000, approvalPhrase: "WRONG" as "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store),
      /missing_devnet_execution_approval_phrase/,
    );
  } finally {
    cleanup();
  }
});

test("devnet execution rejects non-devnet network and non-SOL quotes before network access", async () => {
  const { store, cleanup } = tempStore();
  try {
    const surfpoolQuote = requestQuote({ taskSummary: "local", capability: "research", amount: "0.0001", currency: "SOL", network: "local-surfpool", payloadClass: "prompt_summary", evidenceRefs: [] }, store);
    const usdcQuote = requestQuote({ taskSummary: "usdc", capability: "research", amount: "0.0001", currency: "USDC", network: "solana-devnet", payloadClass: "prompt_summary", evidenceRefs: [] }, store);
    const config = loadConfig({ HOME: tmpdir(), REDDI_RAP_MCP_MODE: "devnet", RAP_MCP_DEVNET_PROOF_APPROVED: "1", RAP_MCP_DEVNET_FUNDER_KEYPAIR: "/tmp/funder.json" });
    await assert.rejects(executeDevnetPayment({ quoteId: surfpoolQuote.quoteId, idempotencyKey: "idem-1", maxTotalDebitLamports: 3_300_000, approvalPhrase: "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store), /quote_not_devnet_eligible/);
    await assert.rejects(executeDevnetPayment({ quoteId: usdcQuote.quoteId, idempotencyKey: "idem-2", maxTotalDebitLamports: 3_300_000, approvalPhrase: "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store), /quote_currency_must_be_SOL/);
  } finally {
    cleanup();
  }
});

test("devnet receipt idempotency maps to exact receipt and blocks duplicate quote payment", () => {
  const { store, cleanup } = tempStore();
  try {
    const receipt = {
      receiptId: "receipt-1",
      schemaVersion: "reddi.rap-mcp-bridge.devnet-payment-receipt.v1" as const,
      quoteId: "quote-1",
      createdAt: new Date().toISOString(),
      boundary: "solana-devnet-only-no-mainnet-no-specialist-http-invocation" as const,
      quoteTermsHash: "sha256:terms",
      spendCapLamports: 3_300_000,
      amounts: { downstreamAmountLamports: 100_000, protocolFeeBps: 5 as const, protocolFeeLamports: 50, totalDebitLamports: 100_050, payerTopUpLamports: 1, specialistTopUpLamports: 2, treasuryTopUpLamports: 3, totalFunderAndPaymentSpendLamports: 100_056 },
      funding: {},
      wallets: { payer: "payer", specialist: "specialist", protocolTreasury: "treasury", funder: "funder" },
      balances: {},
      transactions: { downstreamSignature: "downstream", feeSignature: "fee" },
      verification: { devnetPaymentSemantics: "pass" as const, mainnetSettlement: "not_applicable" as const },
      disclosureLedgerEntry: {},
    };
    store.upsertDevnetReceipt("idem-1", "hash-1", receipt);
    assert.equal(store.getDevnetReceiptByIdempotency("idem-1")?.receipt.receiptId, "receipt-1");
    assert.throws(() => store.upsertDevnetReceipt("idem-2", "hash-2", { ...receipt, receiptId: "receipt-2" }), /quote_already_paid/);
  } finally {
    cleanup();
  }
});
