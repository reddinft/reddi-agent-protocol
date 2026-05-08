# Economic Demo Proof Hierarchy — Upfront Payment and Jupiter Lanes

_Date: 2026-05-07_

This is the judge/operator map for what the current economic demo evidence proves, what it does not prove, and which script owns each proof lane.

## Proof levels

1. **Deterministic UI proof**
   - Script/test: `npx playwright test e2e/economic-demo.spec.ts`
   - Proves: quote panels, user funding edge, downstream payment graph, disclosure ledger, wallet deltas, final output are visible.
   - Does not prove: real signing, swap, transfer, paid provider call, or hosted specialist call.

2. **Surfpool/local payment semantics**
   - Script: `npm run smoke:economic-demo:surfpool-rehearsal`
   - Proves: local user-to-orchestrator upfront funding, downstream specialist/attestor transfers, budget reconciliation, blocked edge zero-delta behavior.
   - Does not prove: devnet/mainnet USDC settlement or live Jupiter swap execution.

3. **Surfpool/mock-Jupiter invoke proof**
   - Script: `npm run test:surfpool:jupiter-invoke`
   - Latest artifact: `artifacts/surfpool-jupiter-invoke/20260507-023023/SUMMARY.md`
   - Proves: local no-real-funds x402 challenge flow can use a swap-shaped SOL→USDC auto-route before satisfying a specialist payment.
   - Does not prove: successful public Jupiter devnet execution or mainnet Jupiter settlement.

4. **Pay.sh / `reddi-x402` sandbox charge compatibility**
   - Script: `npm run evidence:pay-sh:reddi-x402 -- artifacts/pay-sh-reddi-x402/20260507T064842Z`
   - Latest artifact: `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.md`
   - Proves: Pay.sh sandbox gateway compatibility for the Reddi Agent Protocol `reddi-x402` single-recipient charge flow: HTTP 402 / MPP challenge → Pay.sh sandbox payment → HTTP 200 with Solana payment receipt success.
   - Does not prove: mainnet payment, production Umbra private settlement, arbitrary-wallet/private payee MagicBlock PER settlement, capped session settlement, or split-payment settlement.

5. **Pay.sh capped-session and split-payment probes**
   - Artifacts: `artifacts/pay-sh-reddi-x402/20260507T065805Z-session-splits/SUMMARY.md` and `artifacts/pay-sh-reddi-x402/20260507T065908Z-splits/SUMMARY.md`
   - Proves: Pay.sh 0.16.0 emits richer MPP challenge metadata for session and split variants.
   - Does not prove: successful paid retry or settlement; both probes returned `Server returned 402 again after payment`.

6. **Umbra private x402 adapter-contract proof**
   - Artifact: `docs/UMBRA-PRIVACY-PAYMENTS-BOUNTY-FIT-2026-05-07.md`
   - Executable artifact: `artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.md`
   - Proves: SDK packages are installed/import-verified; the dependency-injected adapter contract runs the intended receiver-claimable UTXO lifecycle; the generated receipt carries rail/network/operation/signature metadata and selective-disclosure boundaries.

7. **Umbra devnet encrypted-balance deposit proof**
   - Executable artifact: `artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.md`
   - Proves: devnet wSOL wrapping, Umbra confidential registration, public-balance-to-encrypted-balance deposit queue/callback, rent cleanup, and encrypted balance query returning `1000000` base units.
   - Does not prove: mainnet payment, production Umbra private settlement, Quasar-native Umbra execution, or arbitrary-wallet/private payee MagicBlock PER settlement.

8. **Umbra receiver-claimable UTXO devnet-only proof**
   - Executable artifact: `artifacts/umbra-devnet-receiver-claimable-utxo/20260507T092405Z/SUMMARY.md`
   - Proves: a devnet-only receiver-claimable UTXO create→scan→claim path with relayer claim transactions and receiver encrypted wSOL balance moving from `497867` to `995734` base units.
   - Does not prove: mainnet payment, production Umbra private settlement, Quasar-native Umbra execution, MagicBlock PER settlement, or general arbitrary receiver/payee settlement.

9. **Live Jupiter quote-only proof**
   - Script: `npm run smoke:economic-demo:jupiter-quote`
   - Proves: public Jupiter route availability for SOL→USDC at the time of the artifact, including output estimate, slippage, and route legs.
   - Does not prove: swap transaction creation, signing, execution, or wallet mutation.

8. **Devnet USDC receipt verification**
   - Script: `npm run verify:economic-demo:devnet-usdc-receipt`
   - Proves: a supplied devnet transaction signature contains a USDC SPL-token transfer to the declared recipient within the approved cap.
   - Does not prove: this repo initiated the payment. It is a verifier, not a signer/sender.

9. **Live payment gate**
   - Script: `npm run check:economic-demo:live-payment-gate`
   - Proves: all required inputs for an actual live receipt lane are explicit before any future executor can run.
   - Does not prove: transfer/swap occurred.

10. **Future gated sender/swap executor**
   - Status: not implemented yet.
   - Required before claiming: exact confirmation token, network, spend cap, signer reference, recipient, asset route, and receipt verification artifact.

## Evidence pack aggregation

Script: `npm run evidence:economic-demo:upfront-payment`

The pack aggregates the latest available artifacts into a public-safe judge packet and fails closed for the local budget proof if:

- upfront funding signature is missing,
- Jupiter route metadata is missing,
- specialist credits do not match downstream transfers,
- upfront funding does not cover downstream budget,
- orchestrator markup is not retained before fees,
- blocked transfer mutates a balance,
- attached live Jupiter quote output is below the upfront fee.

Devnet USDC receipt status is attached as either `blocked` or `verified`. A blocked verifier artifact is acceptable as a boundary disclosure; only `verified` should be described as a real devnet USDC receipt.

## Language to use in judge materials

Safe claims:

- “The demo shows an upfront-funded consumer-agent workflow.”
- “Surfpool/local evidence proves payment ordering and budget reconciliation.”
- “Surfpool/mock-Jupiter evidence proves a successful no-real-funds swap-shaped invoke path.”
- “Pay.sh / `reddi-x402` evidence proves sandbox HTTP 402-to-paid-receipt compatibility for a single-recipient charge.”
- “Pay.sh capped sessions and split payments are extension probes only.”
- “Umbra private x402 adapter-contract evidence proves the SDK-facing receiver-claimable UTXO call path and selective-disclosure receipt shape.”
- “Umbra devnet encrypted-balance deposit completed for a tiny wSOL amount on devnet, with queue/callback transaction evidence and encrypted balance query.”
- “Umbra receiver-claimable UTXO has devnet-only create→scan→claim evidence with relayer claim transactions and receiver encrypted-balance update.”
- “Public Jupiter quote evidence proves route availability, not an executed devnet swap.”
- “Devnet USDC receipt verification is ready and fail-closed; a verified receipt requires a supplied devnet transaction signature.”

Do not claim yet:

- “The app executed a successful public Jupiter devnet swap.”
- “The app executed a live/mainnet Jupiter swap.”
- “The app transferred real USDC from the judge wallet.”
- “The repo submitted a live payment transaction.”
- “Mainnet settlement is supported.”
- “Pay.sh capped-session settlement completed.”
- “Pay.sh split-payment settlement completed.”
- “Pay.sh evidence proves Umbra private settlement or MagicBlock PER settlement.”
- “Umbra mainnet or production settlement completed.”
- “Umbra private settlement executed.”

## Current default boundary

All default commands are safe: they either run local/deterministic checks, fetch a quote without signing, or produce blocked readiness artifacts. Any command that signs, swaps, transfers, spends, or mutates wallets must be separate, approval-gated, cap-bounded, and visibly reviewed before execution.
