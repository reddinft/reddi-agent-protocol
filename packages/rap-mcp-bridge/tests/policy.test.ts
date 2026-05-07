import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";
import { currentPolicy } from "../src/policy.js";

test("defaults to dry-run with exactly four safe tools", () => {
  loadConfig({ HOME: "/tmp/reddi-test" });
  const policy = currentPolicy();
  assert.equal(policy.mode, "dry_run");
  assert.equal(policy.allowPayment, false);
  assert.equal(policy.allowInvoke, false);
  assert.deepEqual([...policy.toolNames], [
    "reddi.discover_specialists",
    "reddi.request_quote",
    "reddi.verify_receipt",
    "reddi.export_disclosure_ledger",
  ]);
});

test("rejects non-dry-run modes in first PR", () => {
  assert.throws(() => loadConfig({ REDDI_MCP_POLICY_MODE: "manual", HOME: "/tmp/reddi-test" }), /unsupported_policy_mode:manual/);
  assert.throws(() => loadConfig({ REDDI_MCP_POLICY_MODE: "session_budget", HOME: "/tmp/reddi-test" }), /unsupported_policy_mode:session_budget/);
  assert.throws(() => loadConfig({ REDDI_MCP_POLICY_MODE: "unsafe_live", HOME: "/tmp/reddi-test" }), /unsupported_policy_mode:unsafe_live/);
});
