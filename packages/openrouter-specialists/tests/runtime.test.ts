import assert from "node:assert/strict";
import test from "node:test";
import { MockOpenRouterClient } from "../src/openrouter.js";
import { getProfile, specialistProfiles, validateProfileRegistry } from "../src/profiles/index.js";
import { createOpenRouterClient, createRuntimeConfig, handleChatCompletions, handleRuntimeRequest, marketplaceMetadata, type RuntimeConfig } from "../src/index.js";

const config: RuntimeConfig = {
  profileId: "planning-agent",
  endpointBaseUrl: "https://planning.example.test",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  mockOpenRouter: true,
  requirePayment: true,
  allowDemoPayment: true,
};

test("profile registry has first five unique valid profiles with required marketplace metadata", () => {
  assert.deepEqual(validateProfileRegistry(), []);
  assert.equal(specialistProfiles.length, 5);
  assert.deepEqual(
    specialistProfiles.map((profile) => profile.id),
    ["planning-agent", "document-intelligence-agent", "verification-validation-agent", "code-generation-agent", "conversational-agent"],
  );
  assert.ok(getProfile("verification-validation-agent")?.roles.includes("attestor"));
});

test("unpaid completion returns 402 challenge before OpenRouter client call", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers(),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config,
    client,
  });

  assert.equal(response.status, 402);
  assert.equal(client.callCount, 0);
  assert.ok(response.headers["x402-request"]);
  assert.equal((response.body.error as { code: string }).code, "payment_required");
});

test("spoofed paid or signature headers still fail closed", async () => {
  for (const headerValue of ["paid:anything", "{\"signature\":\"caller-controlled\"}"]) {
    const client = new MockOpenRouterClient();
    const response = await handleChatCompletions({
      headers: new Headers({ "x402-payment": headerValue }),
      body: { messages: [{ role: "user", content: "Build a plan" }] },
      config: { ...config, allowDemoPayment: false },
      client,
    });

    assert.equal(response.status, 402);
    assert.equal(client.callCount, 0);
  }
});

test("demo-paid completion invokes OpenRouter mock only when explicitly enabled", async () => {
  const client = new MockOpenRouterClient();
  const response = await handleChatCompletions({
    headers: new Headers({ "x402-payment": "demo:paid" }),
    body: { messages: [{ role: "user", content: "Build a plan" }] },
    config,
    client,
  });

  assert.equal(response.status, 200);
  assert.equal(client.callCount, 1);
  assert.equal(client.lastRequest?.model, getProfile("planning-agent")?.model);
  assert.equal(client.lastRequest?.messages[0]?.role, "system");
  assert.equal(client.lastRequest?.messages[0]?.content, getProfile("planning-agent")?.systemPrompt);
  assert.deepEqual(response.body.reddi, {
    profileId: "planning-agent",
    requestId: (response.body.reddi as { requestId: string }).requestId,
    model: getProfile("planning-agent")?.model,
    paymentSatisfied: true,
    safetyMode: "standard",
    mockOpenRouter: true,
  });
  assert.match((response.body.reddi as { requestId: string }).requestId, /^[0-9a-f-]{36}$/);
});

test("well-known metadata includes Reddi marketplace fields", async () => {
  const profile = getProfile("planning-agent");
  assert.ok(profile);
  const metadata = marketplaceMetadata(profile, config) as Record<string, unknown>;

  for (const field of ["profileId", "displayName", "walletAddress", "endpoint", "capabilities", "roles", "price", "safetyMode", "preferredAttestors"]) {
    assert.ok(metadata[field], `missing ${field}`);
  }
  assert.equal(metadata.profileId, "planning-agent");
  assert.equal(metadata.endpoint, "https://planning.example.test/v1/chat/completions");
});

test("runtime config requires explicit mock mode and api key for real OpenRouter", () => {
  const productionConfig = createRuntimeConfig({});
  assert.equal(productionConfig.mockOpenRouter, false);
  assert.equal(productionConfig.allowDemoPayment, false);
  assert.throws(() => createOpenRouterClient(productionConfig), /OPENROUTER_API_KEY is required/);

  const mockConfig = createRuntimeConfig({ OPENROUTER_MOCK: "true", ALLOW_DEMO_X402_PAYMENT: "true" });
  assert.equal(mockConfig.mockOpenRouter, true);
  assert.equal(mockConfig.allowDemoPayment, true);
  assert.equal(createOpenRouterClient(mockConfig).constructor.name, "MockOpenRouterClient");
});

test("HTTP core routes expose health, models, tags, metadata, and chat", async () => {
  const client = new MockOpenRouterClient();
  for (const path of ["/healthz", "/x402/health", "/v1/models", "/api/tags", "/.well-known/reddi-agent.json"]) {
    const response = await handleRuntimeRequest(new Request(`https://planning.example.test${path}`), config, client);
    assert.equal(response.status, 200, path);
  }

  const unpaid = await handleRuntimeRequest(
    new Request("https://planning.example.test/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }),
    config,
    client,
  );
  assert.equal(unpaid.status, 402);
  assert.equal(client.callCount, 0);
});
