import test from "node:test";
import assert from "node:assert/strict";
import { assertLocalRapBaseUrl, loadConfig } from "../src/config.js";

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
