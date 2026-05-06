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

3. **Live Jupiter quote-only proof**
   - Script: `npm run smoke:economic-demo:jupiter-quote`
   - Proves: public Jupiter route availability for SOL→USDC at the time of the artifact, including output estimate, slippage, and route legs.
   - Does not prove: swap transaction creation, signing, execution, or wallet mutation.

4. **Devnet USDC receipt verification**
   - Script: `npm run verify:economic-demo:devnet-usdc-receipt`
   - Proves: a supplied devnet transaction signature contains a USDC SPL-token transfer to the declared recipient within the approved cap.
   - Does not prove: this repo initiated the payment. It is a verifier, not a signer/sender.

5. **Live payment gate**
   - Script: `npm run check:economic-demo:live-payment-gate`
   - Proves: all required inputs for an actual live receipt lane are explicit before any future executor can run.
   - Does not prove: transfer/swap occurred.

6. **Future gated sender/swap executor**
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
- “Jupiter quote evidence proves route availability, not an executed swap.”
- “Devnet USDC receipt verification is ready and fail-closed; a verified receipt requires a supplied devnet transaction signature.”

Do not claim yet:

- “The app executed a live Jupiter swap.”
- “The app transferred real USDC from the judge wallet.”
- “The repo submitted a live payment transaction.”
- “Mainnet settlement is supported.”

## Current default boundary

All default commands are safe: they either run local/deterministic checks, fetch a quote without signing, or produce blocked readiness artifacts. Any command that signs, swaps, transfers, spends, or mutates wallets must be separate, approval-gated, cap-bounded, and visibly reviewed before execution.
