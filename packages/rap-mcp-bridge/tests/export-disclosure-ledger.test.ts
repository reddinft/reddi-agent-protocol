import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BridgeStore } from "../src/store.js";
import { requestQuote } from "../src/tools/request-quote.js";
import { exportDisclosureLedger } from "../src/tools/export-disclosure-ledger.js";

test("export disclosure ledger contains safe public evidence only", () => {
  const dir = mkdtempSync(join(tmpdir(), "rap-mcp-bridge-"));
  const store = new BridgeStore(dir);
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
    const ledger = exportDisclosureLedger({ quoteIds: [quote.quoteId] }, store);
    assert.equal(ledger.schemaVersion, "reddi.downstream-disclosure-ledger.v1");
    assert.equal(ledger.safePublicEvidenceOnly, true);
    assert.equal(ledger.entries.length, 1);
    assert.equal(ledger.entries[0].verificationStatus, "planned");
    const serialized = JSON.stringify(ledger);
    assert.equal(serialized.includes("Research paid specialist agents."), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
