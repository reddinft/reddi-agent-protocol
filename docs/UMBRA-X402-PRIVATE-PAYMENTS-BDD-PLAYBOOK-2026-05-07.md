# Umbra x402 Private Payments BDD Playbook — 2026-05-07

## Boundary

Umbra is a private x402 settlement adapter lane for Reddi Agent Protocol. It is SDK-level privacy infrastructure, not Quasar-native execution, not MagicBlock PER settlement, and not Pay.sh settlement.

Current implementation status: local adapter boundary + mocked unit tests + import-surface guard only. No Umbra devnet/mainnet transaction is claimed.

## Phase 0 — BDD claim boundary ✅

Scenario: private payment rail remains separate from Quasar proof.

- Given an x402 agent payment intent
- When payer selects `private-umbra`
- Then Reddi Agent Protocol can plan Umbra operations for encrypted-balance or receiver-claimable-UTXO payment
- And evidence says Umbra is not Quasar-native program execution
- And final packet still treats Quasar as the public program-native settlement proof

Implemented:

- `lib/privacy/umbra/config.ts` — Umbra mainnet/devnet program IDs and endpoints from docs.
- `lib/privacy/umbra/types.ts` — typed plan/receipt boundary.
- `lib/privacy/umbra/adapter.ts` — dependency-injected adapter wrappers around Umbra SDK factories.
- `lib/__tests__/umbra-private-x402-adapter.test.ts` — mocked local tests that prove plan/receipt boundaries without live calls.
- `scripts/check-umbra-adapter-imports.mjs` / `npm run check:umbra:adapter-imports` — verifies installed SDK/prover export names without constructing clients, fetching prover assets, or submitting transactions.

Validation:

```bash
npm run check:umbra:adapter-imports
npx jest --runTestsByPath lib/__tests__/umbra-private-x402-adapter.test.ts --runInBand
```

## Phase 1 — SDK feasibility spike, local only ✅

Scenario: adapter can bind to documented SDK functions without external effects.

- Given `@umbra-privacy/sdk` and `@umbra-privacy/web-zk-prover` are installed
- When the import guard runs
- Then required factory functions are present:
  - `getUmbraClient`
  - `getUserRegistrationFunction`
  - `getPublicBalanceToEncryptedBalanceDirectDepositorFunction`
  - `getPublicBalanceToReceiverClaimableUtxoCreatorFunction`
  - `getClaimableUtxoScannerFunction`
  - `getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction`
  - `getUmbraRelayer`
  - prover factories for registration, public receiver-claimable UTXO creation, and receiver-claimable UTXO claim.

No network, wallet signing, CDN prover-key fetch, RPC, relayer call, or token movement occurs in this phase.

## Phase 2 — Demo/evidence wiring

Next scenario:

- Given `/economic-demo` shows payment rail options
- When privacy mode is selected
- Then it shows `public-quasar`, `Pay.sh/reddi-x402 sandbox compatibility`, and `private-umbra planned adapter`
- And the Umbra panel links to this playbook and refuses to display transaction signatures unless a real approved smoke artifact exists.

Suggested artifact schema: `reddi.umbra-private-x402.plan.v1` from `createUmbraPrivatePaymentPlan`.

## Phase 3 — Approval-gated devnet smoke

Only after Nissan approval:

1. Use Umbra devnet program `DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ`.
2. Use devnet indexer `https://utxo-indexer.api-devnet.umbraprivacy.com`.
3. Use devnet relayer `https://relayer.api-devnet.umbraprivacy.com`.
4. Use a tiny devnet supported token amount only after mint/pool/faucet support is confirmed.
5. First smoke: create signer, register, and perform the smallest non-mainnet path.
6. Second smoke only if first passes: receiver-claimable UTXO creation, recipient scan, relayer claim.

Evidence must include transaction signatures, network, mint, operation type, failure state if any, and the boundary that this is not Quasar-native Umbra execution.
