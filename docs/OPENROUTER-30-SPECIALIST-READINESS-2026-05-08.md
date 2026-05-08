# OpenRouter 30-Specialist Readiness Boundary — 2026-05-08

## Verdict

All 30 specialist profiles are configured, manifest-valid, package-tested, and have devnet registration evidence. The current repository evidence is strong for a marketplace/profile layer and recording story.

Do **not** claim all 30 are currently live production hosted endpoints ready for paid calls. The latest deployment readiness preflight is intentionally blocked until public endpoints, funding confirmation, and Coolify deployment confirmation are approved/configured.

## Evidence

- Manifest parity: `npm --prefix packages/openrouter-specialists run manifest:parity` → `ok=true`, `checkedProfiles=30`.
- Package tests: `npm --prefix packages/openrouter-specialists test` → passed, including the registry invariant that all 30 profiles are unique, valid, and include required marketplace metadata.
- Signer wallet manifest: `packages/openrouter-specialists/artifacts/signer-wallet-manifest-all30-20260504.json` → `profiles.length=30`.
- Devnet registration artifact: `packages/openrouter-specialists/artifacts/devnet-registration-all30-20260504.json` → `report.length=30`.
- Deployment readiness: `npm --prefix packages/openrouter-specialists run deployment:readiness` → `status=blocked`, `entries.length=30`.

## Latest deployment-readiness blockers

Every profile currently reports the same approval/configuration blockers:

- `PUBLIC_BASE_URL/endpoint not configured`
- `funding not confirmed; approval/funding required`
- `Coolify deployment not confirmed`

The preflight guardrails also confirm it did not inspect private keys, spend devnet SOL, perform deployment, or execute live downstream x402 calls.

## Safe recording/submission claim

> Reddi Agent Protocol includes 30 OpenRouter specialist profiles with manifest-valid marketplace metadata, public wallet provenance, and devnet registration evidence. They support the human-triggered specialist marketplace story without requiring hidden paid live calls during the recording.

## Unsafe claim unless separately refreshed and approved

> All 30 specialists are live production hosted endpoints ready for paid calls.

To make that claim, we would need explicit approval to configure public endpoints, confirm Coolify deployments, confirm/fund wallets as required, configure production secrets outside the repo, and rerun hosted endpoint/readiness smokes without leaking secrets.
