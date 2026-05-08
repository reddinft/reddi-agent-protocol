# Final Recording Packet — 2026-05-07

Use clean `main` at `f3000708` or later.

## Entry points

- Demo route: `/economic-demo`
- Recording runbook: `docs/FINAL-RECORDING-REHEARSAL-RUNBOOK-2026-05-06.md`
- Proof map: `docs/COLOSSEUM-FINAL-QUASAR-PROOF-MAP-2026-05-06.md`
- Proof hierarchy: `docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md`
- Latest submission prep: `artifacts/economic-demo-submission-prep/latest/SUBMISSION-PREP.md`
- Latest run report: `artifacts/economic-demo-run-report/20260507T084258Z/run-report.json`
- Latest Pay.sh / `reddi-x402` compatibility evidence: `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.md`
- Umbra private-payment plan: `docs/UMBRA-PRIVACY-PAYMENTS-BOUNTY-FIT-2026-05-07.md`
- Umbra private x402 adapter evidence: `artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.md`
- Umbra devnet encrypted-balance deposit completed: `artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.md`
- Torque reputation-ranking evidence: `artifacts/torque-reputation-ranking/20260508T052500Z/SUMMARY.md`
- Recording/submission handoff: `docs/RECORDING-SUBMISSION-HANDOFF-2026-05-07.md`

## Latest local gates

- `npx playwright test e2e/economic-demo.spec.ts --reporter=line` — PASS
- `npm run generate:economic-demo:submission-prep` — PASS
- `npm run report:economic-demo:run` — PASS
- `npm run evidence:pay-sh:reddi-x402 -- artifacts/pay-sh-reddi-x402/20260507T064842Z` — PASS
- `npm run check:economic-demo:submission-prep` — PASS
- `npm run check:quasar:submission` — PASS
- Current clean-main gates: `npm run check:final-recording` PASS; `npm run check:submission:claim-boundaries` PASS; `npm run test:bdd:index` PASS; `git diff --check` PASS

## Recording language

Safe claim:
- Quasar devnet is the real final protocol proof.
- Surfpool/mock-Jupiter is the successful no-real-funds swap-shaped visual.
- Public Jupiter devnet is quote/build/sign boundary evidence only.
- Signed devnet budget-lane tx is not a Jupiter swap receipt.
- Pay.sh / `reddi-x402` proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility for the single-recipient charge flow.
- Umbra is the private-settlement adapter lane.
- Umbra private x402 adapter contract is implemented for receiver-claimable UTXO payments.
- Umbra devnet encrypted-balance deposit completed: tiny devnet wSOL was deposited into an Umbra encrypted balance with queue/callback tx evidence; this is not mainnet/live-production settlement proof.
- MagicBlock PER bounded agent-vault settlement is proven for the Quasar-owned AgentVault route: MagicBlock TEE restored the delegated vault to base devnet and withdraw-after-settlement succeeded. This is not an arbitrary-wallet/private payee settlement proof.
- Torque reputation rankings are a supporting retention layer: Reddi Agent Protocol converts specialist completions, submitted ratings, and onboarding milestones into Torque-compatible events that feed leaderboard/ranking evidence. This is not a live production rewards campaign proof.

Do not claim:
- successful public Jupiter devnet swap
- live/mainnet Jupiter swap
- judge wallet charged
- mainnet settlement supported
- Pay.sh capped-session or split-payment settlement completed
- Pay.sh evidence proving Umbra private settlement or MagicBlock PER settlement
- Umbra private settlement executed
- Umbra mainnet or production settlement completed
- live production Torque rewards campaign or paid incentives distributed through Torque

## Quasar program IDs

- Escrow: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- Registry: `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Reputation: `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`
- Attestation: `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`
