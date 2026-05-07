import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BridgeStore } from "../src/store.js";
import { requestQuote } from "../src/tools/request-quote.js";

function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), "rap-mcp-bridge-"));
  return { dir, store: new BridgeStore(dir), cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("request_quote emits synthetic non-binding quote", () => {
  const { store, cleanup } = tempStore();
  try {
    const quote = requestQuote({
      taskSummary: "Research paid specialist agents.",
      capability: "research",
      amount: "1.25",
      currency: "usdc",
      network: "DEMO",
      payloadClass: "prompt_summary",
      evidenceRefs: ["sources"],
      idempotencyKey: "same",
    }, store);
    assert.equal(quote.quoteAuthority, "bridge_synthetic");
    assert.equal(quote.binding, false);
    assert.equal(quote.terms.currency, "USDC");
    assert.equal(quote.terms.network, "demo");
    assert.ok(quote.termsHash.startsWith("sha256:"));
  } finally {
    cleanup();
  }
});

test("idempotency key returns same quote", () => {
  const { store, cleanup } = tempStore();
  try {
    const args = {
      taskSummary: "Research paid specialist agents.",
      capability: "research",
      amount: "1.25",
      currency: "USDC",
      network: "demo",
      payloadClass: "prompt_summary" as const,
      evidenceRefs: [],
      idempotencyKey: "idempotent-1",
    };
    const one = requestQuote(args, store);
    const two = requestQuote(args, store);
    assert.equal(two.quoteId, one.quoteId);
  } finally {
    cleanup();
  }
});

test("idempotency key with different request body fails closed", () => {
  const { store, cleanup } = tempStore();
  try {
    const base = {
      taskSummary: "Research paid specialist agents.",
      capability: "research",
      amount: "1.25",
      currency: "USDC",
      network: "demo",
      payloadClass: "prompt_summary" as const,
      evidenceRefs: [],
      idempotencyKey: "idempotent-conflict",
    };
    requestQuote(base, store);
    assert.throws(() => requestQuote({ ...base, amount: "2.00" }, store), /idempotency_key_conflict/);
  } finally {
    cleanup();
  }
});
