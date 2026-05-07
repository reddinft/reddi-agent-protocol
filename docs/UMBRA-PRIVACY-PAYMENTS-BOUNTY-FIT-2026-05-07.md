# Umbra Privacy Payments Bounty Fit — 2026-05-07

## Inputs crawled / ingested

- Superteam Umbra side track: `https://superteam.fun/earn/listing/umbra-side-track`
- Superteam MagicBlock privacy track: `https://superteam.fun/earn/listing/privacy-track-colosseum-hackathon-powered-by-magicblock-st-my-and-sns`
- Umbra SDK seed: `https://sdk.umbraprivacy.com/introduction`
- Umbra docs index: `https://sdk.umbraprivacy.com/llms.txt`
- Local ingest: `ingests/umbra-docs-2026-05-07/two-deep-sdk/`
  - `crawl-index.json`: 64 pages fetched, 2 non-blocking errors
  - `raw-md/llms_full_txt.md`: complete inline docs for LLM use
  - `raw-html/*.html`: page snapshots from the two-deep SDK/docs crawl
- Superteam listing payload snapshots:
  - `ingests/umbra-docs-2026-05-07/umbra-side-track-nextdata.json`
  - `ingests/umbra-docs-2026-05-07/privacy-track-colosseum-hackathon-powered-by-magicblock-st-my-and-sns-nextdata.json`

## Umbra side track summary

Prize: 10,000 USDC total — 5,000 / 3,000 / 2,000.
Deadline: 2026-05-12 11:59:59.999Z.

Sponsor asks for a product/prototype using the Umbra SDK that brings real financial privacy to Solana. Explicit suggested ideas include:

- Private Solana Pay.
- X402 private payments.
- Payment links where the recipient receives funds without revealing their final wallet.
- Private gift cards.
- Private payroll, neobank, billing, compliance, tax tooling.

Judging criteria emphasize core Umbra SDK integration, innovation, technical execution, commercial/product potential, impact, UX, and clarity.

## MagicBlock privacy track summary

Prize: 5,000 USDC total — 2,500 / 1,500 / 1,000.
Deadline: 2026-05-12 11:59:59.999Z.

Sponsor asks for privacy-first Solana systems powered by MagicBlock ER/PER/Private Payments API. Submission requires a working demo with successful MagicBlock integration, public repo, deployment/demo links, and short demo video. Judging weights:

- Technology 40%: effective use of ER, PER, or Private Payments API; working demo; architecture/smart-contract quality.
- Impact 30%.
- Creativity and UX 30%.

## Umbra SDK capabilities relevant to Reddi Agent Protocol

Umbra is app/SDK-level privacy infrastructure for Solana SPL and Token-2022 tokens. The key pieces that map well to our x402/agent-commerce work:

1. Encrypted balances
   - Public ATA → encrypted token account (ETA) via deposit.
   - ETA → public ATA via withdraw.
   - Balances are hidden on-chain, with Shared mode enabling local user balance queries after X25519 registration.
   - Uses Arcium MPC dual-instruction flow: handler queues computation, callback updates state.

2. Mixer / UTXOs
   - UTXO commitments inserted into an on-chain Indexed Merkle Tree.
   - ZK claim proves knowledge of a commitment without linking deposit and withdrawal.
   - Supports public-balance or encrypted-balance sources; self-claimable or receiver-claimable UTXOs; claims to encrypted or public balances.
   - Claim operations require explicit ZK prover dependency plus Umbra relayer so the claimant wallet is not fee payer.

3. Compliance
   - Hierarchical viewing keys for disclosure/reporting.
   - X25519 compliance grants for encrypted balance re-encryption.
   - This fits our existing disclosure-ledger / auditability story much better than a purely opaque mixer pitch.

4. Network/support constraints
   - SDK supports `mainnet`, `devnet`, and `localnet`.
   - Docs list mainnet supported mints: USDC, USDT, wSOL, UMBRA.
   - Docs expose devnet program and devnet indexer/relayer endpoints, so a devnet demo should be feasible without mainnet spend.
   - ZK provers must be supplied explicitly via `@umbra-privacy/web-zk-prover`.

## Fit against what we already have

### Strong fit: private x402 settlement layer

Our product already has:

- Agent-to-agent / x402 payment framing.
- Disclosure ledger and judge evidence tooling.
- Quasar-native public settlement proof for final demo-critical on-chain paths.
- MagicBlock boundary evidence that motivates a fallback privacy rail.

Umbra can be introduced as a secondary privacy payment adapter without replacing Quasar as the final program target:

```text
Reddi Agent Protocol payment policy
  ├─ public settlement: Quasar escrow/reputation/attestation path
  └─ privacy settlement option: Umbra SDK shielded x402 payment adapter
       ├─ register payer/recipient
       ├─ deposit/shield supported token
       ├─ create receiver-claimable UTXO or encrypted-balance payment
       ├─ claim via relayer
       └─ produce selective-disclosure receipt / viewing-key evidence
```

This is cleaner than forcing MagicBlock PER into Quasar today because Umbra is designed as SDK-level privacy around SPL/Token-2022 flows. It does not require our Quasar programs to execute inside a MagicBlock TEE.

### Medium fit: Quasar integration

Umbra does not appear to be a Quasar program framework. It has its own deployed on-chain program, Arcium MPC backend, indexer, relayer, and SDK. Therefore the safest architecture is an adapter lane, not a rewrite of Quasar escrow internals.

Recommended framing:

- Quasar remains the final core protocol proof.
- Umbra is a privacy settlement option / rail for private payments.
- The app chooses rail by policy: `public-quasar` vs `private-umbra`.
- Evidence explicitly distinguishes Quasar public settlement from Umbra private settlement.

## MagicBlock qualification recommendation

Recommendation: do **not** prioritize MagicBlock as a primary bounty submission unless the judges/sponsor explicitly accept delegation-only evidence.

Reason:

- The listing requires a working demo with successful MagicBlock integration.
- We can honestly show successful Quasar-native MagicBlock delegation.
- We cannot honestly show successful MagicBlock PER settlement or TEE execution of the delegated Quasar program.
- The track is only 5,000 USDC total and explicitly judges effective use of ER/PER/Private Payments API. Our strongest evidence is a boundary/repro, not a complete privacy-payment product.

Suggested posture:

- Submit MagicBlock as appendix / honorable technical evidence: “Quasar-native delegation and TEE private authorization proven; private payee lamport settlement not claimed.”
- Do not spend more live-smoke cycles chasing PER settlement unless MagicBlock/Quasar provides guidance or we build a full native control probe.
- Do not pitch MagicBlock as the privacy payments rail in the final story.

## Umbra qualification recommendation

Recommendation: prioritize Umbra as the secondary privacy-payments option.

Why:

- The Umbra listing explicitly calls out “X402 Private Payments” as a desired idea.
- Our product is already an agentic x402 payment protocol, so the story is direct rather than forced.
- Umbra has devnet SDK/program/indexer/relayer support, making a bounded demo plausible.
- Compliance/viewing-key features map to our disclosure-ledger and auditability differentiator.
- Prize pool is larger than MagicBlock privacy track: 10,000 USDC vs 5,000 USDC.

Risk:

- We need enough time to integrate `@umbra-privacy/sdk` + ZK prover in a demo-safe way.
- Devnet supported mints/pools need a live smoke before we claim functionality.
- Umbra relayer/indexer availability is an external dependency.

## Recommended build plan — Umbra x402 private payments lane

### 2026-05-07 devnet update

Bounded Umbra devnet evidence is now attached at `artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.md`.

Confirmed devnet flow:

- SDK package upgraded to `@umbra-privacy/sdk@4.0.0` because `2.0.3` has `devnet: null` network config and cannot construct a devnet client.
- Devnet relayer/indexer were reachable: `https://relayer.api-devnet.umbraprivacy.com` and `https://utxo-indexer.api-devnet.umbraprivacy.com`.
- Supported devnet mint used: wSOL/native mint `So11111111111111111111111111111111111111112`.
- Wrapped tiny devnet SOL to wSOL ATA.
- Submitted Umbra confidential registration transactions.
- Submitted public-balance-to-encrypted-balance deposit queue transaction; Umbra callback finalized; rent cleanup transaction submitted.
- Encrypted balance query returned `1000000` base units for the wSOL mint.

Claim boundary: this proves a bounded Umbra devnet encrypted-balance deposit, not mainnet payment, production/live private settlement, receiver-claimable UTXO claim flow, Quasar-native Umbra execution, or MagicBlock PER settlement.

### Phase 0 — BDD claim boundary

Expectation: Reddi Agent Protocol can offer a private payment rail without weakening the Quasar-only final-program claim.

Scenario:

- Given an x402 agent payment intent
- When payer selects privacy mode
- Then the app routes through Umbra SDK and records a selective-disclosure receipt
- And Quasar public settlement remains available and independently validated

Deliverable:

- `docs/UMBRA-X402-PRIVATE-PAYMENTS-BDD-PLAYBOOK-2026-05-07.md`
- Guard that UI/docs never claim Umbra is Quasar-native.

### Phase 1 — SDK feasibility spike, no mainnet

- Add a small adapter boundary, e.g. `lib/privacy/umbra/`.
- Avoid touching Quasar program code.
- Use dependency injection so tests can run with fake SDK clients.
- Validate imports/types for:
  - `getUmbraClient`
  - registration function
  - deposit function
  - UTXO creator/scanner/claimer functions
  - `getUmbraRelayer`
- Gate: unit tests with mocked SDK and `node --check`/ESLint.

### Phase 2 — Demo UX / evidence wiring

- Add an “Umbra private payment” option to the economic demo / x402 workflow.
- Explain three modes:
  - Public Quasar escrow settlement.
  - Umbra encrypted balance transfer / shielded payment.
  - Umbra UTXO claim/payment link mode.
- Generate an evidence pack that includes:
  - payer privacy mode
  - Umbra operation type
  - transaction signatures if live
  - disclosure/viewing-key note if available
  - explicit “not Quasar program execution” boundary.

### Phase 3 — Devnet live smoke, approval-gated

Only after local adapter/tests pass:

- Use devnet Umbra program `DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ`.
- Use devnet indexer `https://utxo-indexer.api-devnet.umbraprivacy.com`.
- Use devnet relayer `https://relayer.api-devnet.umbraprivacy.com`.
- Test minimal path first:
  1. create test signer
  2. register user
  3. deposit tiny amount of devnet supported token
  4. query encrypted balance
- Then attempt UTXO/payment-link flow if token faucet/pool availability is confirmed.

### Phase 4 — Submission packaging

Pitch:

> Reddi Agent Protocol gives autonomous agents a policy-routed payment layer: Quasar for auditable program-native settlement, Umbra for private x402 payments with encrypted balances, receiver-claimable UTXOs, relayer-based claims, and selective disclosure.

Evidence:

- Public repo.
- README section: “Umbra private x402 payments.”
- Demo video under 5 minutes.
- Deployed frontend.
- Clear instructions and claim boundary.

## Bottom line

- MagicBlock: keep as proof/repro appendix, not primary bounty push.
- Umbra: best secondary privacy-payments bounty lane; it directly asks for x402 private payments and avoids the Quasar-on-MagicBlock-TEE blocker.
