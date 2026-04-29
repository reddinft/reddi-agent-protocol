const test = require("node:test");
const assert = require("node:assert/strict");
const { server, chooseResponse } = require("../dist/server.js");

function listen() {
  return new Promise((resolve) => {
    const instance = server.listen(0, "127.0.0.1", () => {
      const address = instance.address();
      resolve({ instance, baseUrl: `http://127.0.0.1:${address.port}` });
    });
  });
}

test("known query produces high-confidence predefined response", () => {
  const response = chooseResponse("Please audit this endpoint for an unpaid completion bypass without x402.");
  assert.equal(response.predefinedMatch, true);
  assert.equal(response.selected.id, "insecure-open-completion");
  assert.equal(response.confidence, 0.97);
  assert.equal(response.reputationScore, 96);
});

test("unknown query produces low-confidence best effort", () => {
  const response = chooseResponse("What colour should the launch banner be?");
  assert.equal(response.predefinedMatch, false);
  assert.equal(response.confidence, 0.24);
  assert.equal(response.reputationScore, 24);
});

test("completion route fails closed with x402 challenge, then accepts paid retry", async () => {
  const { instance, baseUrl } = await listen();
  try {
    const unpaid = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "audit unpaid completion bypass" }] }),
    });
    assert.equal(unpaid.status, 402);
    assert.ok(unpaid.headers.get("x402-request"));
    const challenge = JSON.parse(unpaid.headers.get("x402-request"));
    assert.equal(challenge.route, "/v1/chat/completions");
    assert.equal(challenge.specialistProfile, "qa-security");

    const invalidPayment = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x402-payment": "junk" },
      body: JSON.stringify({ messages: [{ role: "user", content: "audit unpaid completion bypass" }] }),
    });
    assert.equal(invalidPayment.status, 400);

    const paid = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", "x402-payment": JSON.stringify({ txSignature: "demo", network: "solana-devnet" }) },
      body: JSON.stringify({ messages: [{ role: "user", content: "audit unpaid completion bypass" }] }),
    });
    assert.equal(paid.status, 200);
    const payload = await paid.json();
    assert.equal(payload.reddi_demo.predefinedMatch, true);
    assert.equal(payload.reddi_demo.matchConfidence, 0.97);
    assert.equal(payload.reddi_demo.reputationScore, 96);
    assert.equal(payload.reddi_demo.paymentStatus, "demo_x402_payment_header_shape_accepted_not_production_verified");
  } finally {
    await new Promise((resolve) => instance.close(resolve));
  }
});
