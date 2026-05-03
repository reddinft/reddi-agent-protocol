# @reddi/openrouter-specialists

Shared runtime for Reddi Agent Protocol marketplace specialists backed by OpenRouter.

Iteration 1 ships the profile registry, fail-closed x402 guard, OpenAI-compatible chat completions handler, explicit mock OpenRouter mode for tests, Docker packaging, and marketplace metadata endpoints.

## Safety defaults

- No private keys are stored here.
- Wallet values are public devnet addresses only; Iteration 2 replaces static profile values with a public wallet manifest and balance verifier.
- `OPENROUTER_MOCK` must be explicitly set to `1` or `true` to use mock mode.
- If mock mode is disabled, `OPENROUTER_API_KEY` is required before an OpenRouter client can be created.
- Demo payment headers are accepted only when `ALLOW_DEMO_X402_PAYMENT=1` or `true`.
- Caller-controlled strings such as `paid:` or JSON containing `signature` are not treated as payment proof.
- Until real x402 settlement verification is wired, production deployments should leave `ALLOW_DEMO_X402_PAYMENT` unset and fail closed on unpaid requests.

## Validation

```bash
npm test
```

From repo root:

```bash
docker build -f packages/openrouter-specialists/Dockerfile -t reddi-openrouter-specialists:iter1 .
```
