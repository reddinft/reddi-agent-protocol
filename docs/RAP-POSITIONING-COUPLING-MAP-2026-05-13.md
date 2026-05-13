# Reddi Agent Protocol positioning + Solana coupling map

_Date: 2026-05-13 AEST_
_Issue: #332_

## Purpose

Step back from specific brands, chains, wallets, and payment providers. Define what Reddi Agent Protocol is at the product/protocol level, then identify where the current implementation is tightly coupled to Solana and where it is already abstract.

This is not a migration recommendation. It is a coupling map so future alternatives can be evaluated cleanly.

## Product positioning independent of implementation brands

Reddi Agent Protocol is a **trust and settlement control plane for paid agent work**.

It coordinates four things that raw payment rails do not solve by themselves:

1. **Discovery** — which specialist can perform the work, under what policy and price.
2. **Payment authorization** — whether a consumer/agent is allowed to spend for this work.
3. **Outcome verification** — whether the delivered work satisfies the requested criteria.
4. **Settlement/reputation** — whether to release, refund, dispute, or record trust signals.

A concise implementation-neutral promise:

> Reddi Agent Protocol lets agents buy work from other agents with explicit spend limits, verifiable receipts, quality checks, and reputation updates — without trusting the specialist, marketplace operator, or payment provider blindly.

## Protocol invariants

These should remain true regardless of settlement chain, wallet provider, or payment standard.

### 1. Role model

- **Consumer** requests work and authorizes spend.
- **Specialist** performs work behind a paid or gated endpoint.
- **Attestor/Judge** evaluates output quality or policy compliance.
- **Protocol/control plane** records the run lifecycle, policy decisions, evidence, and settlement outcome.

### 2. Run lifecycle

A paid run should preserve this lifecycle shape:

```text
intent -> candidate resolution -> quote/challenge -> authorization -> execution -> receipt/evidence -> attestation -> settlement decision -> reputation signal
```

The implementation may differ by chain or provider, but the lifecycle should not collapse into “just call an API and pay.”

### 3. Policy before spend

Agents must not spend freely. A valid spend path needs enforceable policy:

- per-call cap
- session/day cap
- recipient/source allowlist
- environment/network compatibility
- human approval rules for risky paths
- receipt capture
- revoke/disable path

### 4. Receipt before trust credit

RAP should not credit reputation or successful settlement from an opaque API response alone. It needs a machine-readable receipt/evidence object tying together:

- consumer identity or delegated authority
- specialist identity/endpoint
- amount/currency/network or equivalent payment metadata
- request/correlation ID
- payment/escrow/settlement proof
- output hash or evidence reference
- attestor verdict where required

### 5. Settlement is separate from service execution

The specialist can run anywhere: local model, hosted API, MCP server, agent framework, data provider, etc.

Settlement integrity should be enforced outside the specialist runtime through receipts, escrow/hold/release semantics, policy checks, and attestation evidence.

### 6. Failure must be explicit

Every paid run should land in an explicit state:

- paid/released
- refunded
- disputed
- expired/cancelled
- not paid/not required
- failed before spend

Silent partial success is a protocol smell.

## Current layer map

### A. Mostly chain/provider agnostic today

These are RAP concepts that can survive Solana, EVM, Hedera, card-backed balances, or provider wallets.

| Layer | Current role | Coupling level |
|---|---|---|
| Source adapter registry | Imports external service/provider catalogs into RAP candidates | Low |
| Candidate resolution | Chooses specialists by source, task, policy, attestation status | Low |
| Policy planning | Approval, allowlist, spend cap, receipt, attestation gates | Low-medium |
| MCP/tool surfaces | Planner tools, source-adapter APIs, dry-run routes | Low |
| Attestation model | Judge verifies output and gates trust/settlement | Low |
| Evidence packs | Hashes, summaries, run artifacts, receipts | Low-medium |
| Reputation/routing confidence | Post-run signals influence future routing | Low |
| BDD/conformance harness | Ensures source adapters behave safely | Low |

The main dependency here is vocabulary: some fields currently say `solana`, `USDC`, or `x402` where the deeper abstraction is `settlementRail`, `asset`, and `paymentChallenge`.

### B. Solana-coupled today

These layers are meaningfully tied to Solana and would need replacement/adapters for alternatives.

| Layer | Current Solana-specific assumption | Alternative would need |
|---|---|---|
| Settlement program | Escrow PDA, SPL token custody, Solana instructions | Equivalent escrow/hold/release mechanism or provider-led settlement proof |
| Asset model | SPL USDC / token accounts / mints | Stablecoin or balance abstraction with decimals, recipient, network, proof |
| Wallet/signing | Solana keypairs, embedded wallets, delegated signers, fee payer patterns | Wallet/account abstraction for target rail |
| Transaction proof | Solana signatures, explorer links, account state | Chain/provider receipt verifier |
| Local testing | Surfpool/localnet/devnet lanes | Equivalent sandbox/testnet/local simulator |
| Jupiter/payment path | SOL -> token swap route assumptions | Rail-specific funding/swap/onramp abstraction |
| Program IDs/config | Solana program/rpc configuration | Rail-specific deployment/config registry |
| Fee sponsorship | Solana fee payer / gas station semantics | Paymaster/sponsor/provider-fee abstraction |

### C. Payment-standard coupled, but not necessarily Solana-coupled

| Layer | Current assumption | Notes |
|---|---|---|
| x402 challenge/response | HTTP 402 paid-call negotiation | x402 can be multi-chain/provider-backed, but specific payloads vary |
| MPP/Pay.sh flow | Pay.sh Solana/MCP ecosystem | Useful source/benchmark, not RAP’s identity |
| Circle x402 Discovery | Circle provider discovery model | Source adapter, not protocol core |
| reddi-x402 package | Current developer rail framing includes Solana metadata | Should evolve toward `settlementAdapter` interfaces |

## What is RAP, and what is not RAP?

### RAP is

- A paid-agent work lifecycle.
- A policy and authorization layer for agent spend.
- A discovery/routing layer for specialist capabilities.
- A receipt/evidence layer for verifiable paid work.
- An attestation and reputation layer for quality-sensitive settlement.
- A control plane that can speak to multiple payment/source ecosystems.

### RAP is not inherently

- A Solana-only payment app.
- A Pay.sh wrapper.
- A Circle x402 indexer.
- A wallet provider.
- An MCP server only.
- A marketplace UI only.
- An escrow program only.

Those are implementation surfaces. The protocol value is the lifecycle and trust model across them.

## Where current wording over-couples us to Solana

The current whitepaper abstract says RAP is “for AI-agent commerce on Solana.” That is accurate for the current build, but it narrows the product identity.

Recommended framing:

> Reddi Agent Protocol is a trust-minimized coordination and settlement layer for AI-agent commerce. The first implementation is Solana-first, using stablecoin settlement and x402-style paid-call flows.

This preserves credibility while leaving room for alternatives.

Similarly:

- “Solana marketplace” -> “agent commerce marketplace/control plane; Solana-first settlement implementation”
- “SPL USDC flow” -> “current Solana USDC settlement adapter”
- “escrow PDA” -> “Solana escrow adapter”
- “x402 required” -> “payment challenge required” with x402 as the current/default challenge standard

## Alternative rail evaluation checklist

If we consider Base/EVM, Hedera, non-custodial provider wallets, or card-backed balances, evaluate against the protocol invariants rather than brand fit.

### Required capabilities

1. **Spend authorization**
   - Can a user grant bounded agent spend?
   - Can limits be enforced before signing/payment?
   - Can the user revoke?

2. **Payment proof**
   - Is there a receipt RAP can verify independently or semi-independently?
   - Does it bind amount, recipient, request, and network?

3. **Settlement semantics**
   - Is payment immediate final transfer, escrow, hold/capture, streaming, or provider ledger?
   - Can RAP express release/refund/dispute honestly?

4. **Test environment**
   - Is there sandbox/localnet/devnet/testnet parity?
   - Are fake funds available?
   - Can provider endpoints be tested without real spend?

5. **Specialist interoperability**
   - Can arbitrary specialists expose paid endpoints?
   - Is it HTTP/MCP friendly?
   - Can non-native agent frameworks integrate?

6. **Attestation binding**
   - Can output/evidence be bound to payment/run ID?
   - Can payout/trust be delayed until attestation if needed?

7. **Operational/legal UX**
   - How does user onboarding work?
   - Is card/onramp/KYC/geography supported?
   - Who custodies funds and what terms apply?

## Adapter architecture recommendation

RAP should explicitly name adapters so implementation choices do not leak into core protocol positioning.

### Suggested core interfaces

```text
SourceAdapter
  discovers external specialists/services

PaymentChallengeAdapter
  parses quote/challenge and builds payment authorization request

SettlementAdapter
  verifies payment/escrow/hold/release/refund state

WalletAuthorityAdapter
  maps user/delegated agent policy to signatures or provider payments

EnvironmentAdapter
  maps sandbox/devnet/testnet/mainnet/localnet and test funds

ReceiptAdapter
  normalizes chain/provider receipts into RAP evidence objects
```

### Current concrete adapters

```text
PayShSourceAdapter
CircleX402SourceAdapter
SolanaUsdcSettlementAdapter
SolanaEscrowPdaAdapter
SurfpoolEnvironmentAdapter
RAPAttestationAdapter
```

Future alternatives could add:

```text
BaseX402SettlementAdapter
HederaX402SettlementAdapter
CrossmintWalletAuthorityAdapter
CoinbaseAgenticWalletAdapter
CircleWalletAuthorityAdapter
CardBalanceSettlementAdapter
```

The point is not to build all of these now. The point is to keep the core language clean enough that adding one later is an adapter decision, not a product identity crisis.

## Strategic positioning recommendation

### Public product sentence

> Reddi Agent Protocol is the trust layer for paid agent-to-agent work: discovery, spend policy, receipts, attestation, settlement, and reputation.

### Implementation qualifier

> The first implementation is Solana-first, with stablecoin settlement and x402-compatible paid-call flows.

### Developer package sentence

> `reddi-x402` is the installable paid-call rail for developers; RAP is the marketplace/control plane that verifies, routes, settles, and scores paid agent work.

### Ecosystem sentence

> RAP can ingest and interoperate with external paid-agent ecosystems through source adapters, while maintaining its own policy, evidence, and reputation layer.

## Practical implications

### Keep Solana-first for now because

- current proof stack exists there,
- Surfpool/devnet/local testing works,
- x402/Pay.sh/Circle work is already implemented as metadata/dry-run adapters,
- USDC settlement and escrow demos are concrete,
- changing rails now would slow proof velocity.

### But stop making Solana the identity

Solana should be described as the **first settlement adapter**, not the whole protocol.

### The next useful refactor is vocabulary, not migration

Before evaluating alternatives deeply, rename/structure docs and code concepts around:

- `settlementRail`
- `settlementAdapter`
- `paymentChallenge`
- `environment`
- `asset`
- `receipt`
- `walletAuthority`

Then Solana, Pay.sh, Circle, Base, Hedera, Crossmint, Coinbase, etc. become swappable implementations in the analysis.

## Recommended next steps

1. Update whitepaper abstract and integration sections to say “Solana-first implementation,” not “protocol on Solana” as the full identity.
2. Add a short Architecture Decision Record: “RAP core is settlement-rail-agnostic; Solana is adapter v1.”
3. Add code-level types only where they reduce ambiguity:
   - `settlementRail`
   - `environment`
   - `asset`
   - `receiptKind`
4. Build an alternative-rail scorecard before any migration experiment.
5. Keep current Solana/Pay.sh/Circle work moving, but label it as adapter work.

## Bottom line

RAP’s durable product is not “agents paying on Solana.”

RAP’s durable product is:

> A verifiable trust, policy, and settlement layer for paid agent work.

Solana is the current best first settlement adapter because it gives us fast, cheap, programmable stablecoin settlement and a working local/devnet proof environment. But the protocol should be positioned so that Base, Hedera, card-backed balances, provider wallets, or future x402 rails can be evaluated as alternative adapters rather than replacements for the whole idea.
