# VPS testing specialists with reddi-x402 demo plan

_Linked issue: #130_

## Goal

Run demo-only testing specialist agents on the VPS via Coolify. They are intentionally not GPU/Ollama endpoints. Each service is a deterministic mock specialist that:

1. exposes OpenAI-compatible discovery and completion routes;
2. fails closed with `402 + x402-request` before any completion;
3. accepts a demo `x402-payment` retry;
4. returns a predefined high-confidence testing response when the prompt matches a known case;
5. returns the nearest best-effort response with lower `matchConfidence` and `reputationScore` when the prompt is uncertain.

This shows the value of Reddi Agent Protocol versus a normal public endpoint: endpoint protection, Solana x402 payment flow, registry/reputation metadata, and replayable evidence.

## Specialist profiles

The package lives at `packages/testing-specialists`.

Run one Coolify service per profile:

- `qa-security` — endpoint security, unpaid-completion bypass, replay/nonce review.
- `ux-usability` — onboarding and judge/demo-flow review.
- `integration-tester` — Coolify smoke, devnet registration, recording checklist.

All profiles expose the same routes:

- `GET /healthz` and `GET /x402/health`
- `GET /v1/models`
- `GET /api/tags`
- `POST /v1/chat/completions`

Unpaid completion calls return `402` and an `x402-request` challenge. Paid retry returns an OpenAI-style chat completion plus:

```json
{
  "reddi_demo": {
    "predefinedMatch": true,
    "matchedCaseId": "insecure-open-completion",
    "matchConfidence": 0.97,
    "reputationScore": 96,
    "paymentStatus": "demo_x402_payment_header_accepted"
  }
}
```

## Local run

```bash
cd packages/x402-solana && npm install && npm run build
cd ../testing-specialists && npm install && npm run build
SPECIALIST_PROFILE=qa-security \
SPECIALIST_WALLET=<devnet-wallet> \
PUBLIC_BASE_URL=http://127.0.0.1:8080 \
npm start
```

Smoke it:

```bash
cd ../..
npm run demo:testing-specialist:smoke -- http://127.0.0.1:8080
```

Artifacts are written under `artifacts/demo-testing-specialists/<timestamp>/`.

## Coolify deployment

Create three Docker services from the repo using:

- Dockerfile: `packages/testing-specialists/Dockerfile`
- Port: `8080`
- Healthcheck path: `/healthz`

Environment per service:

```bash
PORT=8080
HOST=0.0.0.0
X402_NETWORK=solana-devnet
PRICE_LAMPORTS=1000000
SPECIALIST_PROFILE=qa-security # or ux-usability / integration-tester
SPECIALIST_WALLET=<dev-wallet-public-key-for-this-specialist>
PUBLIC_BASE_URL=https://<coolify-domain>
```

Do not commit wallet secrets. The service only needs the public specialist wallet for challenge generation.

After deploy, run from the repo:

```bash
TESTING_SPECIALIST_ENDPOINT=https://<coolify-domain> npm run demo:testing-specialist:smoke
```

## Devnet registration flow

Recommended demo flow:

1. Fund/prepare the dev specialist wallet.
2. Deploy the x402-protected mock specialist in Coolify.
3. Run the smoke script and keep the artifact path.
4. Register the specialist in the Reddi app on Solana devnet using the Coolify endpoint, model name, rate, capabilities, and public wallet.
5. Capture the registration transaction signature and Explorer URL.
6. Resolve the specialist from the planner and perform a paid invocation.
7. Save the paid invocation payload showing `matchConfidence` and `reputationScore`.

Guardrails:

- Use Solana devnet only for this demo.
- Do not expose a completion route that returns 200 without x402.
- Do not store raw prompts in public artifacts unless deliberately demo-safe.

## Screen capture plan

Use Playwright when possible because it gives reproducible screenshots and trace artifacts. Use Chrome DevTools or Peekaboo only for manual wallet popups or Coolify dashboard moments that Playwright cannot drive cleanly.

Capture sequence:

1. Coolify service overview showing deployed endpoint + healthy status.
2. Terminal/browser smoke: unpaid call returns `402 + x402-request`.
3. Reddi `/register` with endpoint probe passing.
4. Wallet/devnet registration transaction confirmation.
5. Reddi `/planner` selecting the testing specialist.
6. Paid invocation response showing high confidence for a known test query.
7. Paid invocation response showing lower confidence for an unknown query.
8. `/manager` evidence pack or artifacts folder showing replayable receipts.

Artifact convention:

```text
artifacts/demo-testing-specialists/<timestamp>/
  01-healthz.json
  02-models.json
  03-unpaid-completion.json
  04-paid-completion.json
  SUMMARY.md
  screens/
  traces/
```

## Demo prompts

High-confidence examples:

- `Audit this specialist for an unpaid completion bypass without x402.`
- `Review replay nonce protection for duplicate payment receipts.`
- `Find specialist onboarding friction before registration.`
- `Create a Coolify VPS smoke plan for the protected endpoint.`
- `Give me the devnet registration recording checklist.`

Low-confidence example:

- `What colour should the launch banner be?`
