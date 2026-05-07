import test from "node:test";
import assert from "node:assert/strict";
import { assertDevnetRpcUrl, assertLocalRapBaseUrl, loadConfig } from "../src/config.js";

test("allows only localhost RAP backend URLs in first PR", () => {
  assert.equal(assertLocalRapBaseUrl("http://localhost:3000/"), "http://localhost:3000");
  assert.equal(assertLocalRapBaseUrl("http://127.0.0.1:3000"), "http://127.0.0.1:3000");
  assert.throws(() => assertLocalRapBaseUrl("https://example.com"), /unsupported_rap_base_url_host:example.com/);
  assert.throws(() => assertLocalRapBaseUrl("http://169.254.169.254"), /unsupported_rap_base_url_host:169.254.169.254/);
  assert.throws(() => assertLocalRapBaseUrl("file:///tmp/nope"), /unsupported_rap_base_url_protocol/);
});

test("loadConfig rejects arbitrary external backend URLs", () => {
  assert.throws(
    () => loadConfig({ REDDI_RAP_BASE_URL: "https://api.example.com", HOME: "/tmp/reddi-test" }),
    /unsupported_rap_base_url_host:api.example.com/,
  );
});

test("devnet RPC URL cannot point at mainnet or arbitrary hosts", () => {
  assert.equal(assertDevnetRpcUrl("https://api.devnet.solana.com"), "https://api.devnet.solana.com");
  assert.equal(assertDevnetRpcUrl("http://localhost:8899"), "http://localhost:8899");
  assert.throws(() => assertDevnetRpcUrl("https://api.mainnet-beta.solana.com"), /mainnet_rpc_url_forbidden/);
  assert.throws(() => assertDevnetRpcUrl("https://example.com"), /unsupported_devnet_rpc_url_host:example.com/);
});

test("devnet cap env must be positive safe integer", () => {
  assert.equal(loadConfig({ HOME: "/tmp/reddi-test", RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS: "3200000" }).devnetMaxTotalDebitLamports, 3_200_000);
  assert.throws(() => loadConfig({ HOME: "/tmp/reddi-test", RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS: "NaN" }), /invalid_positive_integer_env/);
  assert.throws(() => loadConfig({ HOME: "/tmp/reddi-test", RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS: "-1" }), /invalid_positive_integer_env/);
});
