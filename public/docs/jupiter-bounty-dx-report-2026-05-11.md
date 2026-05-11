# Jupiter Developer Platform DX Appendix — Not Your Regular Bounty

_Date: 2026-05-11 AEST_

Project: **Reddi Agent Protocol**  
Package: **`reddi-x402`**  
Repo: https://github.com/nissan/reddi-agent-protocol

## What we integrated

Reddi Agent Protocol integrates Jupiter Developer Platform as a cross-token settlement path for x402 agent payments.

The agent-commerce flow is:

1. A planner/orchestrator calls a specialist agent.
2. The specialist returns an HTTP 402 payment challenge.
3. `reddi-x402` checks whether the payer asset matches the specialist settlement asset.
4. If there is a mismatch, the Jupiter integration resolves a SOL→USDC route before the payment/receipt flow proceeds.
5. Reddi Agent Protocol then continues the downstream budget-lane, specialist payment, receipt, and reputation path.

This is not a normal swap-button integration. Jupiter is used as infrastructure inside a machine-to-machine payment protocol.

## Evidence captured for the bounty

Evidence run:

`artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/JUPITER-EVIDENCE-RUN-2026-05-11.md`

Key results:

- Quote API: OK
- Swap V2 `/order`: OK
- Input: `0.042 SOL`
- Quote output estimate: `4.008081 USDC`
- Swap V2 order output estimate: `4.007231 USDC`
- Route plan: `1` leg
- Price API: OK
- Tokens API: USDC found
- No private key used
- No transaction signed
- No transaction submitted

## What worked well

### 1. Jupiter APIs are easy to call from agent/server code

The HTTP APIs are straightforward and JSON-native. This matters for AI-agent builds: no browser wallet, no UI ceremony, and no RPC dependency for simple quote/order evidence.

### 2. Swap V2 `/order` is a strong primitive for autonomous flows

For agent commerce, an API-managed order path is a better mental model than a UI swap widget. Agents need deterministic request/response behavior, not a human approval screen.

### 3. Price and Tokens APIs helped make the evidence pack more complete

The Price API and Tokens API let us show more than a single quote. We can validate the assets involved and record market context in a submission-safe artifact.

### 4. The docs are AI-friendly

`llms.txt` and the concise docs index are genuinely useful for agent-assisted development. They helped us find the right product surface without hallucinating endpoints.

## What blocked full devnet execution

Jupiter Swap appears to target mainnet liquidity and mainnet address/account state. We found no documented devnet Swap base URL, `cluster=devnet` parameter, or devnet-specific Swap liquidity/program address set.

Our wallet-backed attempt reached the expected boundary:

- Jupiter route/build evidence works.
- A wallet-specific transaction can be built/signed in the experimental path.
- Sending that material to devnet fails because the address lookup table/account material is not present on devnet.

That is not a Reddi Agent Protocol bug. It is the expected result when a mainnet-liquidity transaction is submitted to devnet.

## What was unclear in the developer experience

### 1. Devnet/sandbox support is not explicit enough

For hackathon builders who cannot touch mainnet, the docs should plainly answer:

- Does Swap V2 support devnet execution?
- Is there a sandbox endpoint?
- If not, what is the recommended no-mainnet proof path?

A single “Testing without mainnet funds” guide would save hours.

### 2. Quote/order/build boundaries need clearer wording

Agent builders need to know the exact difference between:

- quote-only evidence
- order/build transaction construction
- signed transaction
- submitted transaction
- confirmed swap receipt

That distinction matters when building payment protocols and producing honest bounty demos.

### 3. Address lookup table failures need a clearer diagnostic

When devnet rejects a Jupiter transaction because an address lookup table does not exist, the best error message is not “missing account.” The docs could say:

> If you see a missing address lookup table while using devnet, you are probably submitting mainnet Jupiter transaction material to devnet. Jupiter Swap routes over mainnet liquidity unless a sandbox is explicitly provided.

### 4. Agent-specific preflight is missing

Autonomous payment flows need to know if a swap will be possible before committing state to escrow. A simulation/preflight endpoint would be very valuable:

- input/output mint
- amount
- taker
- slippage policy
- expected route availability
- expected account/table requirements
- retryable vs fatal error classification

### 5. Rate limits are documented, but agent patterns need examples

The rate-limit docs are useful. What is missing is guidance for agent frameworks:

- how often to refresh quote evidence
- when to cache token metadata
- when to re-check route availability
- how to avoid quote spam in planner loops

## What Jupiter could add for agent builders

1. **Sandbox/devnet story**
   - Either provide a supported sandbox/devnet route environment, or document the recommended no-mainnet proof path.

2. **Swap simulation endpoint**
   - A “will this route likely execute?” endpoint without requiring signing/submission.

3. **Route eligibility checker**
   - Given two mints and an amount, return route availability, likely liquidity constraints, and expected slippage class.

4. **Receipt retrieval**
   - Agent protocols need durable receipts for audit and reputation. A short-lived order/execute receipt lookup API would help.

5. **Agent/server SDK examples**
   - Examples for policy-based wallets, no UI, deterministic slippage, and server-side payment flows.

## Submission-safe summary

Reddi Agent Protocol successfully integrates Jupiter Developer Platform into an agent-payment flow as a cross-token route/settlement primitive. For this no-mainnet bounty demo, we show live Jupiter quote/order/price/token evidence and explain the exact devnet execution boundary honestly. The downstream x402 specialist payment flow is demonstrated through Reddi Agent Protocol’s devnet/local budget-lane proof, not by claiming a successful Jupiter devnet swap.


---

## Public evidence summary

# Jupiter bounty evidence run
- Input: 0.042 SOL (42000000 lamports)
- Output mint: USDC (EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
- Slippage: 75 bps
- Auth mode: keyless/public
- Swap V2 base: `https://api.jup.ag/swap/v2`
- Quote base: `https://lite-api.jup.ag/swap/v1`
## Results
- Quote API: ok
- Quote output estimate: 4.008081 USDC
- Swap V2 order: ok
- Swap V2 order output estimate: 4.007231 USDC
- Swap type: aggregator
- Order contains transaction: false
- Price API SOL: 95.39947706932259 USD
- Price API USDC: 0.999803145311252 USD
- Tokens API found USDC: true
## Claim boundary
- Raw summary: `/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/SUMMARY.json`
- Quote: `/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/01-quote-v1-lite.json`
- Swap V2 order: `/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/02-swap-v2-order.json`
- Price: `/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/03-price-v3.json`
- Token search: `/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/jupiter-not-regular-bounty-demo-20260511/evidence/20260511T072725Z/04-token-search-usdc.json`

---

Permanent intended URL after deployment: https://agent-protocol.reddi.tech/docs/jupiter-bounty-dx-report-2026-05-11.md
