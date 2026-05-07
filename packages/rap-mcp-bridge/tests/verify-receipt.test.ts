import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BridgeStore } from "../src/store.js";
import { requestQuote } from "../src/tools/request-quote.js";
import { verifyReceipt } from "../src/tools/verify-receipt.js";

function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), "rap-mcp-bridge-"));
  return { dir, store: new BridgeStore(dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("dry-run verify never proves payment settlement", () => {
  const { store, cleanup } = tempStore();
  try {
    const quote = requestQuote({
      taskSummary: "Research paid specialist agents.",
      capability: "research",
      amount: "1.25",
      currency: "USDC",
      network: "demo",
      payloadClass: "prompt_summary",
      evidenceRefs: [],
    }, store);
    const result = verifyReceipt({ quoteId: quote.quoteId, termsHash: quote.termsHash }, store);
    assert.equal(result.verified, false);
    assert.equal(result.boundary, "dry_run");
    assert.equal(result.checks.quoteExists, "pass");
    assert.equal(result.checks.termsHash, "pass");
    assert.equal(result.checks.paymentReceipt, "not_applicable");
  } finally {
    cleanup();
  }
});
