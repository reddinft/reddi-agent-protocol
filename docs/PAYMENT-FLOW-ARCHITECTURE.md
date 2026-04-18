# PAYMENT FLOW ARCHITECTURE

## Dodo Payments sidetrack framing

**Dodo = FIAT→USDC on-ramp; we = USDC→agent settlement + escrow + dispute.**

Dodo brings users into stablecoin rails. Reddi Agent Protocol handles what happens next: trust-minimized agent-to-agent settlement with escrow protection and on-chain dispute/attestation paths.

## End-to-end flow

```text
Agent A (buyer/consumer)
    |
    | 1) HTTP request to specialist endpoint
    v
x402 challenge (HTTP 402 Payment Required)
    |
    | 2) Agent A signs payment intent, attaches x402 headers
    v
USDC transfer + escrow lock (SPL Token Program)
    |
    | 3) Funds held in escrow PDA until completion/dispute
    v
Escrow PDA (program-owned state + token custody)
    |
    | 4) Agent B delivers result
    v
Agent B (seller/specialist)
    |
    | 5) release instruction (or dispute/cancel path)
    v
Settlement: payout to Agent B, protocol fee, escrow close
```

## Settlement modes

1. **Public mode (L1 Solana):**
   - Full on-chain settlement and visibility.
   - Best for maximum transparency.

2. **PER mode (MagicBlock TEE):**
   - Privacy-enhanced execution path via TEE-backed infrastructure.
   - Lower metadata leakage, with L1-backed guarantees/fallback.

3. **Vanish Core mode (roadmap):**
   - Planned deeper privacy and execution abstraction layer.
   - Keeps the same escrow/dispute trust guarantees with stronger confidentiality goals.

## SPL USDC flow details

- Payment asset: SPL USDC.
- Buyer funds move from buyer token account to escrow-owned token account/PDA lifecycle.
- Release moves funds from escrow custody to recipient and fee destinations according to protocol rules.
- Cancel/dispute paths enforce state- and time-based constraints before any token movement.

## HTTP 402 header format (conceptual)

x402 requests use a challenge/response header model. Typical fields include:

- `X-Payment-Protocol`: protocol identifier/version
- `X-Payment-Nonce`: anti-replay nonce
- `X-Payment-Amount`: required amount (USDC units)
- `X-Payment-Asset`: token mint identifier
- `X-Payment-Signature`: payer proof/signature over challenge payload

Exact naming can vary by middleware implementation, but the required semantics are invariant: challenge binding, anti-replay nonce, amount/asset binding, and payer authorization proof.

## Escrow PDA lifecycle

1. **Initialize/lock**: create escrow PDA and lock funds.
2. **Active**: delivery window where specialist performs work.
3. **Resolve**:
   - success → release payout and close escrow,
   - failure/dispute → dispute workflow,
   - timeout/cancel window → controlled cancel path.
4. **Terminal**: closed/finalized state prevents double-settlement.

## Auditability and run logs

- Every payment has at least one on-chain transaction trail (lock + resolve path).
- Escrow state transitions are verifiable from chain history.
- Off-chain orchestration logs are persisted in `/runs` for operational traceability.
- Combined, this gives cryptographic settlement records plus application-level diagnostics.
