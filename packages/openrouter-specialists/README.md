# @reddi/openrouter-specialists

Shared runtime for Reddi Agent Protocol marketplace specialists backed by OpenRouter.

Iteration 3 includes the default attestor path: `verification-validation-agent` is both a `specialist` and `attestor`, can evaluate specialist outputs plus receipt chains, and returns a structured `reddi.attestation.v1` deterministic local settlement recommendation.

Iteration 4 starts agent-to-agent composability in dry-run mode: consumer-capable specialists can return a deterministic marketplace delegation plan without performing downstream x402 negotiation or spending devnet SOL.

## Safety defaults

- No private keys are stored here.
- Wallet values are public devnet addresses only; Iteration 2 replaces static profile values with a public wallet manifest and balance verifier.
- `OPENROUTER_MOCK` must be explicitly set to `1` or `true` to use mock mode.
- If mock mode is disabled, `OPENROUTER_API_KEY` is required before an OpenRouter client can be created.
- Demo payment headers are accepted only when `ALLOW_DEMO_X402_PAYMENT=1` or `true`.
- `ENABLE_AGENT_TO_AGENT_CALLS` defaults to disabled. Iteration 4 supports dry-run delegation plans only; live delegation requests fail closed with `live_delegation_not_implemented` until a later guarded live-call iteration.
- Caller-controlled strings such as `paid:` or JSON containing `signature` are not treated as payment proof.
- Until real x402 settlement verification is wired, production deployments should leave `ALLOW_DEMO_X402_PAYMENT` unset and fail closed on unpaid requests.
- Attestation verdicts are settlement recommendations only: `release` pays the specialist, `refund` returns funds to requester, and `dispute` holds for human/secondary review.

## Attestation mode

Use the attestor profile (`SPECIALIST_PROFILE_ID=verification-validation-agent`) with either route shape:

- `POST /v1/attestations`
- `POST /v1/chat/completions` with `metadata.mode="attestation"` and `metadata.attestation`

Minimal request body:

```json
{
  "mode": "attestation",
  "subjectProfileId": "planning-agent",
  "specialistOutput": "Specialist output to review...",
  "receiptChain": [
    { "id": "receipt-1", "type": "x402-payment", "status": "satisfied", "amount": "0.03", "currency": "USDC" }
  ],
  "domain": "general operations"
}
```

Response body includes `verdictSource="deterministic_local_evaluator"`, `verdict.schemaVersion`, `score`, `checks`, `summary`, `recommendedAction`, regulated-domain caveats when relevant, and explicit release/refund/dispute semantics. The runtime still sends an attestation prompt envelope through the configured OpenRouter/mock client for auditability and future LLM attestor parsing, but the returned settlement recommendation is currently produced by the deterministic local evaluator. A future live-LLM attestor must parse and validate upstream `reddi.attestation.v1` output and fail closed/dispute on malformed output.

## Dry-run marketplace delegation mode

Use a consumer-capable profile such as `planning-agent` with `POST /v1/chat/completions`, a satisfied x402 payment, and `metadata.mode="delegation_plan"`.

Minimal request body:

```json
{
  "messages": [
    { "role": "user", "content": "Plan a launch that needs document evidence extraction and code implementation." }
  ],
  "metadata": {
    "mode": "delegation_plan",
    "delegation": {
      "requiredCapabilities": ["document-analysis", "code-generation"],
      "maxCandidates": 3
    }
  }
}
```

Response body includes `object="reddi.delegation.plan"`, deterministic candidate ranking by capability match, price, reputation, and freshness, estimated cost, required attestor, and guardrails. `downstreamCallsExecuted` is always `0` in this iteration. No signer/private-key material is used and no downstream paid call is attempted.

## Validation

```bash
npm test
```

From repo root:

```bash
docker build -f packages/openrouter-specialists/Dockerfile -t reddi-openrouter-specialists:iter1 .
```
