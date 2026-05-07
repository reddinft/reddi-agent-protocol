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

test("devnet policy advertises payment tools only in explicit devnet mode", () => {
  const config = loadConfig({ HOME: tmpdir(), REDDI_RAP_MCP_MODE: "devnet", RAP_MCP_DEVNET_PROOF_APPROVED: "1", RAP_MCP_DEVNET_FUNDER_KEYPAIR: "/tmp/funder.json" });
  const policy = currentPolicy(config.policyMode);
  assert.equal(config.policyMode, "devnet");
  assert.equal(policy.allowPayment, true);
  assert.ok(policy.toolNames.includes("reddi.prepare_devnet_payment"));
  assert.ok(policy.toolNames.includes("reddi.execute_devnet_payment"));
  assert.ok(policy.toolNames.includes("reddi.verify_devnet_receipt"));
  assert.equal(policy.allowMainnet, false);
  assert.equal(policy.allowInvoke, false);
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
      executeDevnetPayment({ quoteId: quote.quoteId, idempotencyKey: "idem-1", maxTotalDebitLamports: 100_050, approvalPhrase: "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store),
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
      executeDevnetPayment({ quoteId: quote.quoteId, idempotencyKey: "idem-1", maxTotalDebitLamports: 100_050, approvalPhrase: "WRONG" as "EXECUTE_DEVNET_RAP_PAYMENT" }, config, store),
      /missing_devnet_execution_approval_phrase/,
    );
  } finally {
    cleanup();
  }
});
