# Reddi x402 Library Scope

_Last updated: 2026-04-27 AEST_

This document defines the intended boundary between:

1. **`reddi-x402` libraries** — installable developer SDKs for JavaScript/TypeScript and Python.
2. **Specialist/consumer applications** — the servers and clients operated by marketplace participants.
3. **Reddi Agent Protocol web app** — the Solana marketplace, registry, onboarding, routing, reputation, and attestation surface.

## One-line promise

`reddi-x402` lets a developer put a fail-closed x402 payment rail in front of agent/API work, verify payment receipts, prevent simple replay, and keep each paid request isolated by default. It is not the marketplace by itself.

## Supported developer targets

- JavaScript / TypeScript package for Node, Next.js, Express/Fastify-style servers, and browser/client helpers where safe.
- Python package for FastAPI/Starlette/Flask-style servers and Python consumer clients.
- Shared wire contract across both languages:
  - x402 challenge headers.
  - x402 payment receipt headers.
  - Solana payment/escrow metadata.
  - request/session correlation IDs.
  - privacy and logging controls.

## What `reddi-x402` provides

### Specialist-side rails

A specialist is the paid API/agent provider.

The library should provide:

- **Fail-closed middleware** for protected endpoints such as `/v1/chat/completions`.
  - No valid payment or escrow proof → return `402 Payment Required` with `x402-request`.
  - Valid payment proof → forward exactly one request to the local handler/runtime.
- **Challenge generation**:
  - amount, currency, payee address, nonce, expiry, network, route metadata.
- **Receipt verification**:
  - verify payment/escrow proof before executing the specialist task.
  - reject duplicate nonce / replay attempts.
  - reject expired or wrong-network/wrong-payee/wrong-amount receipts.
- **Request isolation helpers**:
  - generate a per-request `requestId` / `nonce`.
  - avoid reusing Ollama `context` by default.
  - build fresh OpenAI-compatible `messages[]` payloads per request.
  - provide explicit opt-in only for stateful sessions.
- **Privacy-safe defaults**:
  - no raw prompt logging by default.
  - prompt hashes/previews only when explicitly enabled.
  - redaction hooks for application logs.
- **Adapter examples**:
  - Ollama/OpenAI-compatible `/v1/chat/completions` wrapper.
  - Express/Fastify/Next route examples for TypeScript.
  - FastAPI/Flask examples for Python.
- **Health/compliance endpoints**:
  - `/x402/health` or equivalent.
  - probe response that proves protected endpoints return `402 + x402-request` before payment.

### Consumer-side rails

A consumer is the buyer/orchestrator calling specialists.

The library should provide:

- **x402-aware fetch/client wrapper**:
  1. call specialist endpoint.
  2. receive `402 + x402-request`.
  3. create or fund the Solana payment/escrow.
  4. retry once with `x402-payment`.
  5. return specialist response plus receipt metadata.
- **Wallet/payment integration hooks**:
  - signer/wallet abstraction.
  - network selection.
  - optional Jupiter swap path where supported.
- **Receipt and trace object**:
  - payment signature / escrow PDA.
  - nonce.
  - specialist endpoint origin.
  - amount/currency/network.
  - request ID for audit without storing prompt content.
- **Policy helpers**:
  - max price per call.
  - supported network.
  - accepted privacy mode.
  - reject insecure/open endpoints that answer without x402.

### Shared Solana primitives

The library can include or wrap:

- x402 header parsing and creation.
- nonce/replay store interfaces.
- Solana transaction / escrow helpers.
- receipt serialization and verification.
- optional swap metadata for SOL → token payment paths.
- deterministic test fixtures and localnet/devnet examples.

## What `reddi-x402` does not do

The installable library should not claim to provide the whole marketplace.

It does **not**:

- host the specialist's model or agent runtime.
- guarantee model-level privacy if the specialist application logs prompts or reuses context.
- decide marketplace ranking or specialist discovery.
- maintain the global registry of specialists.
- perform reputation scoring by itself.
- perform human/third-party attestation by itself.
- create a complete UX for onboarding, search, ranking, dashboards, or dispute flows.
- guarantee legal/compliance suitability for every jurisdiction.
- make an insecure public Ollama endpoint safe unless the developer actually runs the payment-enforcing wrapper/proxy.

## Responsibilities of a specialist operator

A specialist who installs `reddi-x402` is expected to:

1. Run their own model/agent/API runtime.
2. Put `reddi-x402` middleware/proxy in front of paid endpoints.
3. Ensure protected endpoints fail closed with `402 + x402-request` before any completion is served.
4. Avoid carrying hidden state across unrelated requests unless a paid stateful session is explicitly negotiated.
5. Disable or redact raw prompt logs unless they have user consent.
6. Expose health/probe endpoints so the marketplace can verify enforcement.
7. Register endpoint, wallet, capabilities, pricing, and privacy mode in Reddi Agent Protocol.

## Responsibilities of a consumer/orchestrator

A consumer app that installs `reddi-x402` is expected to:

1. Maintain its own wallet/signer policy.
2. Set spending limits and accepted networks.
3. Call specialists through the x402-aware client.
4. Reject endpoints that return unpaid completions.
5. Store only necessary receipts/traces, not raw prompts by default.
6. Use the marketplace registry or its own allowlist to choose specialists.

## What Reddi Agent Protocol web app adds on top

The web app is the marketplace/control plane layer built on Solana and `reddi-x402`.

It provides:

- specialist onboarding and endpoint probes.
- marketplace registry and capability profiles.
- wallet, network, and program-id setup flows.
- fail-closed compliance gates before registration.
- consumer planner/orchestrator routing.
- reputation, escrow, release, and attestation flows.
- marketplace search/ranking/discovery UX.
- evidence artifacts for demo, audits, and hackathon judging.
- policy diagnostics for why a specialist was selected or rejected.

## Recommended product framing

Use this split in demos and docs:

- **`reddi-x402`**: “Installable payment and privacy rail for agent/API calls.”
- **Specialist app**: “Your model/runtime, protected by Reddi x402.”
- **Consumer app**: “Your orchestrator, paying and verifying calls through Reddi x402.”
- **Reddi Agent Protocol web app**: “The Solana marketplace that discovers, verifies, ranks, and settles those paid agents.”

## Minimum library acceptance criteria

A developer should be able to prove the following with either TypeScript or Python examples:

1. Unpaid request to protected completion endpoint returns `402` with a valid `x402-request` header.
2. Paid retry with valid `x402-payment` reaches the model/API handler.
3. Replay of the same nonce/receipt is rejected.
4. Wrong amount/payee/network is rejected.
5. Two concurrent requests get different request IDs/nonces and do not share model context.
6. Default logs do not include raw prompt content.
7. Marketplace probe can detect the endpoint as x402-compliant.

## Open implementation gaps

- Python package surface needs to be created or scaffolded.
- TypeScript package naming should be finalized: current repo packages include `x402-solana`, `sendai-x402`, and `eliza-plugin-x402`; public-facing naming should converge on `reddi-x402` or clearly map old package names to the new brand.
- Specialist wrapper should emit a proper `x402-request` challenge, not just a generic 402, on all marketplace-probed protected paths.
- Docs should include one minimal specialist example and one minimal consumer example for both TypeScript and Python.
