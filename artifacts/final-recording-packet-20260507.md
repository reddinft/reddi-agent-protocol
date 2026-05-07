# Final Recording Packet — 2026-05-07

Use clean `main` at `4cbed5f6` or later.

## Entry points

- Demo route: `/economic-demo`
- Recording runbook: `docs/FINAL-RECORDING-REHEARSAL-RUNBOOK-2026-05-06.md`
- Proof map: `docs/COLOSSEUM-FINAL-QUASAR-PROOF-MAP-2026-05-06.md`
- Proof hierarchy: `docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md`
- Latest submission prep: `artifacts/economic-demo-submission-prep/latest/SUBMISSION-PREP.md`
- Latest run report: `artifacts/economic-demo-run-report/20260507T073104Z/RUN-REPORT.md`
- Latest Pay.sh / `reddi-x402` compatibility evidence: `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.md`
- Recording/submission handoff: `docs/RECORDING-SUBMISSION-HANDOFF-2026-05-07.md`

## Latest local gates

- `npx playwright test e2e/economic-demo.spec.ts --reporter=line` — PASS
- `npm run generate:economic-demo:submission-prep` — PASS
- `npm run report:economic-demo:run` — PASS
- `npm run evidence:pay-sh:reddi-x402 -- artifacts/pay-sh-reddi-x402/20260507T064842Z` — PASS
- `npm run check:economic-demo:submission-prep` — PASS
- `npm run check:quasar:submission` — PASS
- Earlier clean-main gates: `npm run test:bdd:index` PASS; `git diff --check` PASS

## Recording language

Safe claim:
- Quasar devnet is the real final protocol proof.
- Surfpool/mock-Jupiter is the successful no-real-funds swap-shaped visual.
- Public Jupiter devnet is quote/build/sign boundary evidence only.
- Signed devnet budget-lane tx is not a Jupiter swap receipt.
- Pay.sh / `reddi-x402` proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility for the single-recipient charge flow.

Do not claim:
- successful public Jupiter devnet swap
- live/mainnet Jupiter swap
- judge wallet charged
- mainnet settlement supported
- Pay.sh capped-session or split-payment settlement completed
- Pay.sh evidence proving Umbra private settlement or MagicBlock PER settlement

## Quasar program IDs

- Escrow: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- Registry: `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Reputation: `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`
- Attestation: `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`
