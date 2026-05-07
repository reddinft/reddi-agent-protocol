# RAP MCP Bridge Demo Site + Recording Plan

_Date: 2026-05-08 AEST_

## Goal

Create a judge-facing demo flow showing Reddi Agent Protocol as the payment/trust layer for MCP-capable agent swarms.

Narrative:

> “OpenSwarm, OpenClaw, Cursor, and Claude can orchestrate agents. Reddi Agent Protocol lets them safely discover, price, pay, verify, and disclose paid specialist-agent work.”

## Permission boundary

Nissan approved devnet spends **only after** the same payment/verification flow is proven in the local Surfpool validator environment.

No mainnet spending.

Execution ladder:

1. Zero-spend MCP quote demo.
2. Surfpool local payment semantics demo.
3. Review evidence.
4. Bounded devnet spend demo.
5. Screen recording + judge narration.

## Demo site concept

Add an `/mcp-bridge-demo` route or integrate as an option inside `/economic-demo`.

Recommendation: create a distinct route for clarity:

```text
/mcp-bridge-demo
```

### Page sections

1. **Hero**
   - “Paid specialist agents for any MCP swarm”
   - Subcopy: “Discover, quote, pay, verify, and disclose external agent work through Reddi Agent Protocol.”

2. **Host selector**
   - OpenSwarm
   - OpenClaw
   - Cursor
   - Claude

3. **Flow timeline**
   - Discover specialists
   - Request quote
   - Approval boundary
   - Local Surfpool settlement proof
   - Devnet settlement proof
   - Verify receipt
   - Export disclosure ledger

4. **Quote panel**
   - Candidate specialist
   - Capability
   - Price
   - Network
   - `quoteAuthority`
   - `binding`
   - terms hash

5. **Policy guard panel**
   - current mode: dry-run / surfpool / devnet-approved
   - spend cap
   - invoke enabled?
   - payment enabled?
   - private payloads enabled?

6. **Receipt verification panel**
   - boundary: dry_run / surfpool_local / devnet
   - quote check
   - terms hash check
   - payment check
   - identity check
   - disclosure ledger check

7. **Disclosure ledger panel**
   - `reddi.downstream-disclosure-ledger.v1`
   - safe public evidence only
   - specialist wallet
   - capability
   - payload hash
   - output hash
   - payment receipt hash

8. **Integration snippets**
   - Claude Desktop config
   - Cursor MCP config
   - OpenSwarm instruction patch
   - OpenClaw skill callout

## Demo modes

### Mode A — Quote-only MCP governance demo

Purpose: safe zero-spend demo.

Shows:

- MCP host discovers specialists.
- MCP host requests synthetic quote.
- Quote has `quoteAuthority=bridge_synthetic`, `binding=false`.
- Payment is blocked by dry-run policy.
- Disclosure ledger plan is generated.

Claim boundary:

> “No payment submitted. This demonstrates discovery, quote policy, and disclosure planning.”

### Mode B — Surfpool local proof

Purpose: prove local payment/settlement semantics before devnet spend.

Shows:

- Same quote/run flow on local Surfpool validator.
- Local transfer/settlement semantics.
- Local receipt/evidence hash.
- Disclosure ledger marks boundary as local/surfpool.

Claim boundary:

> “Local validator proof. No devnet/mainnet settlement claimed.”

### Mode C — Bounded devnet proof

Prerequisite: Mode B complete and reviewed.

Shows:

- Bounded devnet spend with explicit cap.
- Devnet tx signature.
- Receipt verifier passes devnet boundary.
- Disclosure ledger includes tx/evidence refs.

Claim boundary:

> “Devnet proof only. No mainnet settlement claimed.”

## Demo options

### Option 1 — RAP standalone page

Pros:

- clearest judge narrative
- low coupling with current `/economic-demo`
- easy screen recording

Cons:

- new route/UI work

Recommendation: best for submission.

### Option 2 — Add MCP Bridge tab to `/economic-demo`

Pros:

- reuses existing demo context
- less UI surface

Cons:

- risks crowding already dense economic demo
- MCP bridge story may get buried

Recommendation: okay if time-constrained.

### Option 3 — CLI-first recording with minimal page

Pros:

- fastest implementation
- proves MCP is real

Cons:

- less judge-friendly
- harder to visually understand

Recommendation: fallback only.

## Screen recording script — draft

### Scene 1 — Problem

“Agent swarms are getting good at orchestrating work. But when an agent needs to hire an external specialist, it needs more than a tool call. It needs pricing, payment policy, receipt verification, and disclosure.”

Visual: OpenSwarm/OpenClaw/Cursor/Claude icons flowing into Reddi Agent Protocol.

### Scene 2 — Discovery

“Here the host asks Reddi Agent Protocol for specialists that can perform a research task under budget.”

Visual: candidate list with capability, price, reputation, health.

### Scene 3 — Quote

“Before any spend, the bridge returns a quote: what agent, what capability, what price, which network, and a hash of the terms.”

Visual: quote panel with `quoteAuthority`, `binding`, terms hash.

### Scene 4 — Approval boundary

“In dry-run mode, the bridge refuses payment and invocation. This is intentional: an MCP client cannot accidentally spend money just because a prompt asked it to.”

Visual: policy guard panel red/locked.

### Scene 5 — Surfpool local proof

“After the dry-run path, we prove the payment semantics locally on Surfpool. Same flow, local validator, no external spend.”

Visual: Surfpool receipt/local transfer evidence.

### Scene 6 — Devnet proof

“Only after local proof do we run a bounded devnet spend. The receipt verifier checks the transaction boundary and the disclosure ledger records the downstream agent work.”

Visual: devnet tx signature + verification checks.

### Scene 7 — Disclosure ledger

“The final output is not just content. It includes a machine-readable disclosure ledger: who was hired, what was paid, what evidence backs the work, and what verification boundary applies.”

Visual: JSON ledger panel.

### Scene 8 — Closing

“Reddi Agent Protocol turns external agent calls into accountable economic relationships: discover, quote, pay, verify, disclose.”

## Recording checklist

Before recording:

- local app builds
- `/mcp-bridge-demo` route loads
- quote-only demo fixture deterministic
- Surfpool local artifact generated
- devnet spend artifact generated only after Surfpool proof/review
- claim-boundary checker passes
- product naming checker passes: Reddi Agent Protocol, `reddi-x402`

Capture assets:

```text
artifacts/rap-mcp-bridge-demo-YYYYMMDD/
  quote-only-summary.json
  surfpool-local-summary.json
  devnet-summary.json
  disclosure-ledger.json
  screen-recording.mp4
  voiceover-script.md
  operator-checklist.md
```

## Implementation slices for demo site

### Slice 1 — static fixture page

- Add `/mcp-bridge-demo` route.
- Render static quote/disclosure fixtures.
- No backend calls.
- No payment.

### Slice 2 — live local discover/quote wiring

- Wire quote-only mode to local RAP/MCP fixture or backend endpoint.
- Keep payment/invoke disabled.

### Slice 3 — Surfpool evidence panel

- Read generated Surfpool artifact.
- Show local proof boundary.

### Slice 4 — devnet evidence panel

- Read generated devnet artifact after approval boundary.
- Show devnet tx and verifier result.

### Slice 5 — recording polish

- Add visual sequence, copy, CTA, and evidence download links.

## Demo acceptance criteria

- Demo can be recorded without mainnet.
- Quote-only mode works with no spend.
- Surfpool mode is proven before devnet mode.
- Devnet mode uses explicit bounded spend only.
- Every panel labels proof boundary honestly.
- Disclosure ledger is downloadable.
- Screen recording script does not overclaim production settlement.


## Devnet proof execution guard

The bounded devnet proof helper mutates Solana devnet and therefore requires explicit opt-in:

```bash
RAP_MCP_DEVNET_PROOF_APPROVED=1 npm run smoke:rap-mcp-bridge:devnet-proof
```

When a pre-funded devnet wallet is available, pass it via `RAP_MCP_DEVNET_FUNDER_KEYPAIR=/path/to/keypair.json` to avoid relying on the public faucet. The helper still enforces the default `100050` lamport total-debit cap and has no mainnet path.
