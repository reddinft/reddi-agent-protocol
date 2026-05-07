# Economic Demo Submission Prep

Scope: safe local/demo prep only. Generated: 2026-05-07T08:00:53.507Z.

## Demo entrypoint

- Route: `/economic-demo`
- PRs: `https://github.com/nissan/reddi-agent-protocol/pull/244`, follow-up boundary PRs `https://github.com/nissan/reddi-agent-protocol/pull/246` / `https://github.com/nissan/reddi-agent-protocol/pull/247`, and final recording evidence PR `https://github.com/nissan/reddi-agent-protocol/pull/248`
- BDD: `docs/bdd/features/bucket-j-end-user-economic-demo.feature`
- Proof hierarchy: `docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md`

## Current green evidence

- BDD index guard: `npm run test:bdd:index`
- Economic demo Playwright: `npx playwright test e2e/economic-demo.spec.ts`
- App build: `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar npm run build`
- Upfront evidence pack: `npm run evidence:economic-demo:upfront-payment`
- Surfpool/mock-Jupiter invoke proof: `npm run test:surfpool:jupiter-invoke`
- Jupiter quote proof: `npm run smoke:economic-demo:jupiter-quote`
- Live payment gate: `npm run check:economic-demo:live-payment-gate` (blocked by default, safe)
- Devnet USDC receipt verifier: `npm run verify:economic-demo:devnet-usdc-receipt` (blocked by default, safe)
- Devnet USDC sender plan: `npm run plan:economic-demo:devnet-usdc-sender` (blocked by default, safe)
- Economic demo run report: `npm run report:economic-demo:run`
- Pay.sh / reddi-x402 evidence: `npm run evidence:pay-sh:reddi-x402 -- artifacts/pay-sh-reddi-x402/20260507T064842Z`
- Umbra private x402 adapter evidence: `npm run evidence:umbra:private-x402`
- Umbra devnet encrypted-balance deposit smoke: `npm run smoke:umbra:devnet`

## Local evidence paths to mention/demo

- Playwright evidence directory: `artifacts/playwright-economic-demo`
- Surfpool/local payment semantics: `artifacts/economic-demo-surfpool-rehearsal/20260506T153156Z/summary.json`
- Surfpool/mock-Jupiter successful no-real-funds invoke proof: `artifacts/surfpool-jupiter-invoke/20260507-023023/SUMMARY.md`
- Live Jupiter quote-only proof: `artifacts/economic-demo-jupiter-quote-proof/20260506T153602Z/quote-proof.json`
- Upfront payment evidence pack: `artifacts/economic-demo-upfront-payment-evidence/20260506T154314Z/upfront-payment-evidence.json`
- Live payment gate artifact: `artifacts/economic-demo-live-payment-gate/20260506T153929Z/gate.json`
- Devnet USDC receipt verification artifact: `artifacts/economic-demo-devnet-usdc-receipt/20260506T154314Z/receipt-verification.json`
- Devnet USDC sender plan artifact: `artifacts/economic-demo-devnet-usdc-sender-plan/20260506T154540Z/sender-plan.json`
- Economic demo run report: `artifacts/economic-demo-run-report/20260507T080053Z/run-report.json`
- Pay.sh / reddi-x402 sandbox charge: `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.json`
- Pay.sh capped session probe: `artifacts/pay-sh-reddi-x402/20260507T065805Z-session-splits/SUMMARY.json`
- Pay.sh split-payment probe: `artifacts/pay-sh-reddi-x402/20260507T065908Z-splits/SUMMARY.json`
- Umbra private x402 adapter contract: `artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.json`
- Umbra devnet encrypted-balance deposit: `artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.json`
- Proof hierarchy doc: `docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md`

## Five-beat recording outline

1. Open `/economic-demo` and state the end-user asks an orchestrator to buy downstream agent work.
2. Show the upfront quote, user payment edge, downstream specialist/attestor fees, and retained markup.
3. Show communication graph and payment graph together: user → orchestrator → specialists/attestors → final output.
4. Show evidence hierarchy: deterministic UI, Surfpool local payment semantics, Surfpool/mock-Jupiter successful no-real-funds invoke proof, public Jupiter quote/build/sign boundary, devnet USDC receipt verifier, live payment gate/sender plan.
5. Close with the hard boundary: Surfpool/mock-Jupiter is local proof, Pay.sh / reddi-x402 is sandbox charge compatibility, Umbra private x402 now has adapter-contract evidence plus a bounded devnet wSOL-to-encrypted-balance smoke, public Jupiter quote/build/sign is not successful devnet execution, blocked verifier/gate artifacts are safety evidence, and any further live signing/spend requires explicit approval.

## Hard no-go list unless Nissan explicitly approves

- No Phase 6 controlled live research
- No OpenAI/Fal image generation
- No paid provider requests
- No signing operations
- No wallet mutation
- No devnet transfer
- No mainnet transfer
- No Jupiter swap execution
- No Coolify/env mutation

## Proof hierarchy claims

Safe to say:

- The UI demonstrates upfront-funded consumer-agent orchestration.
- Surfpool/local evidence proves payment ordering, budget reconciliation, and blocked-edge zero-delta behavior.
- Surfpool/mock-Jupiter proof shows a successful no-real-funds swap-shaped invoke path.
- Public Jupiter quote proof proves live route availability only; public Jupiter devnet execution is not claimed.
- Devnet USDC receipt verification is ready and fail-closed, but default artifacts are blocked until a real signature is supplied.
- Sender/swap execution is planned and gated, not claimed.
- Pay.sh / reddi-x402 proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility for the single-recipient charge flow.
- Pay.sh capped sessions and split payments are probe-only extension evidence because Pay.sh 0.16.0 returned 402 again after sandbox payment.
- Umbra private x402 adapter contract is present.
- Umbra private x402 adapter contract evidence proves the dependency-injected receiver-claimable UTXO call path and selective-disclosure receipt shape.
- Umbra devnet encrypted-balance deposit completed: devnet wSOL was wrapped, Umbra confidential registration submitted, deposit queue/callback finalized, and encrypted balance query returned the deposited amount.

Not safe to say yet:

- The app executed a successful public Jupiter devnet swap.
- The app executed a live/mainnet Jupiter swap.
- The app transferred devnet or mainnet USDC by itself.
- A judge wallet was charged.
- Mainnet settlement is supported.
- Pay.sh capped sessions or split-payment settlement completed.
- Pay.sh evidence proves Umbra private settlement or MagicBlock PER settlement.
- Umbra mainnet or production settlement completed.
- Umbra evidence proves live private settlement.
