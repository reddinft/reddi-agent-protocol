import test from "node:test";
import assert from "node:assert/strict";
import { canonicalize, sha256Json } from "../src/hash.js";

test("canonical JSON is stable across key order", () => {
  const a = { currency: "USDC", amount: "1.25", nested: { b: "2", a: "1" } };
  const b = { nested: { a: "1", b: "2" }, amount: "1.25", currency: "USDC" };
  assert.equal(canonicalize(a), canonicalize(b));
  assert.equal(sha256Json(a), sha256Json(b));
});
