# @reddi/openrouter-specialists

Shared runtime for Reddi Agent Protocol marketplace specialists backed by OpenRouter.

Iteration 3 includes the default attestor path: `verification-validation-agent` is both a `specialist` and `attestor`, can evaluate specialist outputs plus receipt chains, and returns a structured `reddi.attestation.v1` verdict.

## Safety defaults

- No private keys are stored here.
- Wallet values are public devnet addresses only; Iteration 2 replaces static profile values with a public wallet manifest and balance verifier.
- `OPENROUTER_MOCK` must be explicitly set to `1` or `true` to use mock mode.
- If mock mode is disabled, `OPENROUTER_API_KEY` is required before an OpenRouter client can be created.
- Demo payment headers are accepted only when `ALLOW_DEMO_X402_PAYMENT=1` or `true`.
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

Response body includes `verdict.schemaVersion`, `score`, `checks`, `summary`, `recommendedAction`, regulated-domain caveats when relevant, and explicit release/refund/dispute semantics.

## Validation

```bash
npm test
```

From repo root:

```bash
docker build -f packages/openrouter-specialists/Dockerfile -t reddi-openrouter-specialists:iter1 .
```
