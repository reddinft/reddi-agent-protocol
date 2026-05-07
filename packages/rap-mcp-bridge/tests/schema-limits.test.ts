import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import {
  discoverInputSchema,
  exportDisclosureLedgerInputSchema,
  requestQuoteInputSchema,
} from "../src/schemas.js";

test("discover task limit is enforced", () => {
  const schema = z.object(discoverInputSchema);
  assert.equal(schema.safeParse({ task: "x".repeat(8000) }).success, true);
  assert.equal(schema.safeParse({ task: "x".repeat(8001) }).success, false);
});

test("request quote summary and evidence limits are enforced", () => {
  const schema = z.object(requestQuoteInputSchema);
  assert.equal(schema.safeParse({ taskSummary: "x".repeat(2001) }).success, false);
  assert.equal(schema.safeParse({ taskSummary: "ok", evidenceRefs: Array.from({ length: 33 }, () => "ref") }).success, false);
  assert.equal(schema.safeParse({ taskSummary: "ok", payloadClass: "private_reference" }).success, false);
});

test("ledger export quote id count is capped", () => {
  const schema = z.object(exportDisclosureLedgerInputSchema);
  assert.equal(schema.safeParse({ quoteIds: Array.from({ length: 101 }, (_, i) => `quote_${i}`) }).success, false);
});
