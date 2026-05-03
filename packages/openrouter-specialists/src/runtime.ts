import { randomUUID } from "node:crypto";
import {
  buildX402Challenge,
  defaultNonceReplayStore,
  DemoPaymentVerifier,
  parseX402PaymentHeader,
  type NonceReplayStore,
  type ReceiptVerificationResult,
  type X402Challenge,
} from "@reddi/x402-solana";
import { getProfile, specialistProfiles, validateProfileRegistry } from "./profiles/index.js";
import { FetchOpenRouterClient, MockOpenRouterClient } from "./openrouter.js";
import type { ChatCompletionRequest, OpenRouterClient, RuntimeConfig, RuntimeResponse, SpecialistProfile } from "./types.js";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const PAYMENT_NETWORK = "solana-devnet" as const;

export function createRuntimeConfig(env: NodeJS.ProcessEnv = process.env): RuntimeConfig {
  return {
    profileId: env.SPECIALIST_PROFILE_ID ?? "planning-agent",
    endpointBaseUrl: env.PUBLIC_BASE_URL ?? "http://localhost:8787",
    openRouterApiKey: env.OPENROUTER_API_KEY,
    openRouterBaseUrl: env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1",
    mockOpenRouter: env.OPENROUTER_MOCK === "1" || env.OPENROUTER_MOCK === "true",
    requirePayment: env.REQUIRE_X402_PAYMENT !== "false",
    allowDemoPayment: env.ALLOW_DEMO_X402_PAYMENT === "1" || env.ALLOW_DEMO_X402_PAYMENT === "true",
  };
}

export function createOpenRouterClient(config: RuntimeConfig): OpenRouterClient {
  if (config.mockOpenRouter) return new MockOpenRouterClient();
  if (!config.openRouterApiKey) throw new Error("OPENROUTER_API_KEY is required when mock mode is disabled");
  return new FetchOpenRouterClient(config.openRouterApiKey, config.openRouterBaseUrl);
}

export function buildProfileChallenge(profile: SpecialistProfile, config: RuntimeConfig, nonce: string = randomUUID()): X402Challenge {
  return buildX402Challenge({
    version: "1",
    network: PAYMENT_NETWORK,
    payTo: profile.walletAddress,
    amount: profile.price.amount,
    currency: profile.price.currency,
    endpoint: `${config.endpointBaseUrl}${profile.endpointPath}`,
    nonce,
    memo: `reddi:${profile.id}`,
  });
}

function paymentRequired(challenge: X402Challenge): RuntimeResponse {
  return {
    status: 402,
    headers: {
      ...JSON_HEADERS,
      "x402-request": JSON.stringify(challenge),
    },
    body: {
      error: {
        code: "payment_required",
        message: "x402 payment is required before specialist execution.",
      },
      x402: challenge,
    },
  };
}

export function x402Challenge(profile: SpecialistProfile, config: RuntimeConfig): RuntimeResponse {
  return paymentRequired(buildProfileChallenge(profile, config));
}

export async function verifyPayment(input: {
  headers: Headers;
  profile: SpecialistProfile;
  config: RuntimeConfig;
  replayStore?: NonceReplayStore;
}): Promise<ReceiptVerificationResult> {
  const value = input.headers.get("x402-payment") ?? input.headers.get("x-payment");
  if (!value) return { ok: false, reason: "invalid_receipt", message: "missing x402-payment header" };

  const parsed = parseX402PaymentHeader(value);
  const receiptNonce = parsed && typeof parsed === "object" && "nonce" in parsed && typeof (parsed as { nonce?: unknown }).nonce === "string" ? (parsed as { nonce: string }).nonce : randomUUID();
  const challenge = buildProfileChallenge(input.profile, input.config, receiptNonce);
  const verifier = new DemoPaymentVerifier(input.config.allowDemoPayment === true);
  return verifier.verifyReceipt(parsed, challenge, input.replayStore);
}

export function marketplaceMetadata(profile: SpecialistProfile, config: RuntimeConfig): Record<string, unknown> {
  return {
    protocol: "reddi-agent-protocol",
    version: "0.1.0",
    profileId: profile.id,
    displayName: profile.displayName,
    description: profile.description,
    walletAddress: profile.walletAddress,
    endpoint: `${config.endpointBaseUrl}${profile.endpointPath}`,
    capabilities: profile.capabilities,
    roles: profile.roles,
    price: profile.price,
    safetyMode: profile.safetyMode,
    preferredAttestors: profile.preferredAttestors,
    model: profile.model,
  };
}

export function modelsResponse(): RuntimeResponse {
  return {
    status: 200,
    headers: JSON_HEADERS,
    body: {
      object: "list",
      data: specialistProfiles.map((profile) => ({
        id: profile.id,
        object: "model",
        owned_by: "reddi",
        display_name: profile.displayName,
        openrouter_model: profile.model,
        capabilities: profile.capabilities,
      })),
    },
  };
}

export function tagsResponse(): RuntimeResponse {
  const tags = [...new Set(specialistProfiles.flatMap((profile) => profile.tags))].sort();
  return { status: 200, headers: JSON_HEADERS, body: { tags } };
}

export async function handleChatCompletions(input: {
  headers: Headers;
  body: ChatCompletionRequest;
  config: RuntimeConfig;
  client: OpenRouterClient;
  replayStore?: NonceReplayStore;
}): Promise<RuntimeResponse> {
  const profile = getProfile(input.config.profileId);
  if (!profile) return { status: 500, headers: JSON_HEADERS, body: { error: { code: "unknown_profile" } } };

  if (input.config.requirePayment) {
    const payment = await verifyPayment({ headers: input.headers, profile, config: input.config, replayStore: input.replayStore });
    if (!payment.ok) {
      const response = paymentRequired(buildProfileChallenge(profile, input.config));
      response.body.error = {
        code: payment.reason === "invalid_receipt" ? "payment_required" : payment.reason,
        message: payment.message,
      };
      return response;
    }
  }

  const requestId = randomUUID();
  const messages = input.body.messages ?? [];
  const guardedMessages = [{ role: "system" as const, content: profile.systemPrompt }, ...messages.filter((m) => m.role !== "system")];
  const reddi = {
    profileId: profile.id,
    requestId,
    model: profile.model,
    paymentSatisfied: input.config.requirePayment,
    safetyMode: profile.safetyMode,
    mockOpenRouter: input.config.mockOpenRouter,
  };
  const upstream = await input.client.createChatCompletion({
    model: profile.model,
    messages: guardedMessages,
    temperature: input.body.temperature,
    max_tokens: input.body.max_tokens,
    metadata: reddi,
  });
  return {
    status: 200,
    headers: JSON_HEADERS,
    body: {
      ...upstream,
      reddi,
    },
  };
}

export async function handleRuntimeRequest(request: Request, config = createRuntimeConfig(), client = createOpenRouterClient(config)): Promise<Response> {
  const url = new URL(request.url);
  const profile = getProfile(config.profileId);
  if (!profile) return toResponse({ status: 500, headers: JSON_HEADERS, body: { error: { code: "unknown_profile" } } });

  if (request.method === "GET" && url.pathname === "/healthz") {
    const registryErrors = validateProfileRegistry();
    return toResponse({ status: registryErrors.length ? 500 : 200, headers: JSON_HEADERS, body: { ok: registryErrors.length === 0, profileId: profile.id, registryErrors } });
  }
  if (request.method === "GET" && url.pathname === "/x402/health") {
    return toResponse({ status: 200, headers: JSON_HEADERS, body: { ok: true, failClosed: config.requirePayment, network: PAYMENT_NETWORK, demoPaymentsEnabled: config.allowDemoPayment === true } });
  }
  if (request.method === "GET" && url.pathname === "/v1/models") return toResponse(modelsResponse());
  if (request.method === "GET" && url.pathname === "/api/tags") return toResponse(tagsResponse());
  if (request.method === "GET" && url.pathname === "/.well-known/reddi-agent.json") return toResponse({ status: 200, headers: JSON_HEADERS, body: marketplaceMetadata(profile, config) });
  if (request.method === "POST" && url.pathname === "/v1/chat/completions") {
    const body = (await request.json().catch(() => ({}))) as ChatCompletionRequest;
    return toResponse(await handleChatCompletions({ headers: request.headers, body, config, client, replayStore: defaultNonceReplayStore }));
  }
  return toResponse({ status: 404, headers: JSON_HEADERS, body: { error: { code: "not_found" } } });
}

export function toResponse(runtimeResponse: RuntimeResponse): Response {
  return new Response(JSON.stringify(runtimeResponse.body), {
    status: runtimeResponse.status,
    headers: runtimeResponse.headers,
  });
}
