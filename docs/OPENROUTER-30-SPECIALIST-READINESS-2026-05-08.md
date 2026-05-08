# OpenRouter 30-Specialist Readiness Boundary — 2026-05-08

## Verdict

All 30 specialist profiles are configured, manifest-valid, package-tested, devnet-registered, and have hosted Coolify endpoint evidence.

The safe claim is stronger than “profiles only”: the May 6 inventory fresh-smoked 30/30 hosted `/.well-known/reddi-agent.json` manifests and 30/30 unpaid x402 challenge endpoints, so the specialists can respond to devnet/demo request flows when the flow targets those hosted endpoints.

Do **not** overextend that into “all 30 are production-paid settlement endpoints.” Hosted endpoint responsiveness and unpaid x402 challenge handling are proven; production paid-call settlement/readiness still requires explicit endpoint/funding/Coolify/env confirmation in the current deployment-readiness preflight.

## Evidence

- Hosted Coolify/current inventory: `artifacts/openrouter-specialists-current-inventory/20260506T144648Z/SUMMARY.md` → profiles `30`, well-known manifests OK `30/30`, unpaid x402 challenges OK `30/30`, devnet registered/already registered `30/30`.
- Manifest parity: `npm --prefix packages/openrouter-specialists run manifest:parity` → `ok=true`, `checkedProfiles=30`.
- Package tests: `npm --prefix packages/openrouter-specialists test` → passed, including the registry invariant that all 30 profiles are unique, valid, and include required marketplace metadata.
- Signer wallet manifest: `packages/openrouter-specialists/artifacts/signer-wallet-manifest-all30-20260504.json` → `profiles.length=30`.
- Devnet registration artifact: `packages/openrouter-specialists/artifacts/devnet-registration-all30-20260504.json` → `report.length=30`.
- Deployment readiness preflight without public endpoint/funding/deploy env: `npm --prefix packages/openrouter-specialists run deployment:readiness` → `status=blocked`, `entries.length=30`.

## What the deployment-readiness blocker means

The latest `deployment:readiness` command was run without `PUBLIC_BASE_URL`, `FUNDED_PROFILE_IDS`, or `DEPLOYED_PROFILE_IDS`, so it could not confirm endpoint, funding, or Coolify deployment readiness from environment. That result is a fail-closed preflight boundary, not evidence that the Coolify endpoints do not exist.

Every profile reports the same preflight blockers in that env-less run:

- `PUBLIC_BASE_URL/endpoint not configured`
- `funding not confirmed; approval/funding required`
- `Coolify deployment not confirmed`

The preflight guardrails also confirm it did not inspect private keys, spend devnet SOL, perform deployment, or execute live downstream x402 calls.

## Safe recording/submission claim

> Reddi Agent Protocol has 30 OpenRouter specialist profiles with manifest-valid marketplace metadata, public wallet provenance, devnet registration evidence, and hosted Coolify endpoint evidence. The May 6 inventory verified 30/30 hosted well-known manifests and 30/30 unpaid x402 challenge endpoints, so they can respond to devnet/demo request flows when targeted by the workflow.

## Unsafe claim unless separately refreshed and approved

> All 30 specialists are production-paid settlement endpoints with freshly confirmed funding, production secrets, and live paid downstream calls.

To make that stronger production-paid claim, rerun readiness with the approved public base URL/deployment/funding env, confirm Coolify deployment state, ensure production secrets remain outside the repo, and run any live paid downstream calls only after explicit approval.
