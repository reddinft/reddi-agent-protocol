# Jupiter Developer Platform — DX Report
**Project:** Reddi Agent Protocol — Trustless x402 Agent Payment Clearing  
**Repo:** https://github.com/nissan/reddi-agent-protocol  
**Builder:** Nissan Dookeran (@redditech)  
**Jupiter Developer Platform account:** nissan@reddi.tech  
**Submission context:** Colosseum Frontier Hackathon — "Not Your Regular Bounty"

---

## What we built

We integrated Jupiter Swap V2 as the **automatic settlement bridge inside a trustless agent payment protocol**.

The problem: AI agents hold different tokens. An orchestrator agent might hold SOL. The specialist it wants to hire prices its services in USDC. Without a swap layer, the transaction fails before it starts.

Our solution: when the x402 payment middleware detects a token mismatch between payer and payee, it automatically calls Jupiter Swap V2 — `POST /order` then `POST /execute` — converts the payer's token to the settlement currency, and proceeds to lock funds in the on-chain escrow PDA. The agent never knows a swap happened. It just pays.

**The integration sits at `packages/x402-solana/src/jupiter.ts`:**
- `JupiterSwapV2Client` — wraps `/order` + `/execute` with receipt metadata
- `needsAutoSwap(request)` — detects currency mismatch before payment attempt
- `resolveMint` — normalises token addresses for swap routing

Wired through the full execution chain: planner invoke → x402 settlement → swap client → escrow PDA.

**Concrete integration proof in codebase:**
- `packages/x402-solana/src/jupiter.ts` — Swap V2 client (`order` + `execute`) and swap detection logic.
- `packages/x402-solana/src/payment.ts` — settlement path invokes auto-swap on token mismatch before escrow lock.
- `lib/jupiter-client.ts` and planner invoke flow — runtime wiring for policy-driven specialist calls.
- `app/api/planner/tools/invoke/route.ts` — planner tool entry path using x402 settlement stack.

---

## Onboarding

**Time to first successful API call: ~25 minutes.**

Landing on `developers.jup.ag` is clean. One key, one dashboard, everything in one place — that promise is real and it delivered.

What slowed us down:

**1. The unified API base URL isn't obvious.** The landing page promotes the Developer Platform but the actual Swap V2 base URL (`https://api.jup.ag/swap/v2`) isn't on the front page — we had to find it buried in the Swap V2 docs tab. First instinct was `https://api.jup.ag` with no version prefix, which fails silently on some endpoints.

**Suggestion:** Put the base URL on the API key page, right under the key itself. "Your base URL: `https://api.jup.ag/swap/v2`" — one line, saves 10 minutes.

**2. Auth header format isn't consistent across docs pages.** Some examples show `Authorization: Bearer <key>`, others show `x-api-key: <key>`. We tested both. Bearer worked. The inconsistency erodes confidence fast when you're in the middle of debugging something else.

**Suggestion:** Single source of truth for auth — one format, one docs page, link to it everywhere.

---

## What's broken or missing in the docs

**Swap V2 `/order` response shape is underdocumented.**

The response includes `orderId`, `transaction`, and routing metadata but the field descriptions are sparse. Specifically: `transaction` is a base64-encoded versioned transaction — that's not stated in the docs, we had to infer it from examples and community threads. Versioned transactions vs legacy transactions is a Solana footgun that has bitten enough people that it deserves explicit documentation.

**The `/execute` endpoint error surface is underdocumented.**

When a swap fails (slippage exceeded, route not found, insufficient liquidity) the error response structure isn't documented. We handled it with a broad `catch` and surface the raw error message — not ideal. Production code needs to know which errors are retryable vs fatal.

**Suggested addition:**
```
POST /execute — Error responses:
  400 SLIPPAGE_EXCEEDED — Retry with higher slippageBps
  400 ROUTE_NOT_FOUND  — No route exists for this token pair
  400 INSUFFICIENT_LIQUIDITY — Amount too large for current liquidity
  500 TRANSACTION_FAILED — Simulation passed but execution failed, check tx logs
```

**The Gasless Swap feature is mentioned but not shown end-to-end.**

"Gasless swaps built in" is in the landing copy. Great feature. But we couldn't find a complete example showing how gasless interacts with the `/order` + `/execute` flow for a non-custodial wallet. Does the platform wallet sponsor the fee? Is there a flag? This is relevant for our use case (agent wallets with zero SOL but non-zero USDC).

---

## Where the APIs bit us

**Token mint address resolution.**

When you build for agent-to-agent payments you're dealing with arbitrary token pairs — not just SOL/USDC. We needed a way to validate that a mint address is swap-eligible before attempting the order. The `Tokens` API helps here but the `organic score` and `verification status` fields aren't documented well enough to use as swap-eligibility gates. We ended up building our own `resolveMint` helper that normalises native SOL to the wrapped SOL mint address — this should be in the SDK.

**Slippage and agent context.**

In a human-facing app, you can ask the user to approve a 0.5% slippage. In an autonomous agent payment flow, slippage has to be pre-configured and deterministic. We hard-coded `50 bps` as default, but there's no guidance in the docs on what's reasonable for common token pairs. A reference table (SOL/USDC: ~10bps, long-tail tokens: ~100–300bps) would help.

**Rate limits aren't documented.**

We're building a heartbeat system that calls Solana RPC every hour per registered specialist. If we route swap quotes through Jupiter for every payment attempt, we need to know the rate limit shape. None of the API reference pages document rate limits.

---

## AI stack feedback

We used Claude Code (via OpenClaw) for the entire build. Here's honest signal on the Jupiter AI tools:

**Agent Skills — useful, would use again.**

We fed the Swap V2 skill file to our coding agent when implementing `JupiterSwapV2Client`. It gave the agent structured context that reduced hallucination on the endpoint paths and request shapes. The agent got the `/order` request shape right on the first attempt — that's directly attributable to the skill file.

**What's missing from Agent Skills:**
- Error handling patterns (the skill shows the happy path, not failure modes)
- Authentication examples using the new unified key format
- The versioned transaction handling for `/execute` — this is the most common failure point and it's not in the skill

**Jupiter CLI — didn't integrate, here's why.**

Our build is entirely server-side TypeScript. The CLI is great for terminal-first workflows but there's no obvious path from "CLI command succeeds" to "TypeScript SDK call equivalent." A translation table — `jup swap SOL USDC 0.1` → equivalent `JupiterSwapV2Client` SDK call — would bridge that gap.

**Docs MCP — not tested.**

Our agent has filesystem access and the repo checked out locally, so we used the skill files and direct API reference rather than the MCP. Would be valuable for agents in sandboxed environments.

**llms.txt — actually used this.**

Pointed our agent at `jup.ag/llms.txt` early in the build. It gave a clean index that helped the agent navigate to the right docs section without hallucinating endpoint paths. This is underrated tooling.

---

## How we'd rebuild developers.jup.ag

The current developer platform is genuinely good — one key, one dashboard, clear API categories. These are the changes that would make it exceptional:

**1. Guided path for first-time integrators.**

The homepage lists 8+ APIs. A new developer doesn't know where to start. A short quiz ("What are you building? Agent payment layer / Trading bot / DCA tool") that routes to a focused quickstart would cut onboarding time in half.

**2. Live API explorer on the docs page.**

Every endpoint page should have a "Try it" panel with your authenticated key pre-populated. No Postman collection setup, no curl copy-paste. The key is already in the platform — use it.

**3. Token pair coverage checker.**

Before writing any code: "Will Jupiter route between these two tokens?" should be answerable in one query. A simple UI on the dashboard: enter two mint addresses, see if a route exists and at what typical slippage. Saves the build → test → fail → debug loop for token pairs with no liquidity.

**4. Swap receipt persistence.**

After a successful `/execute`, the transaction receipt is returned but not stored anywhere on the platform. For audit-heavy use cases (like ours — we log every agent payment on-chain), being able to retrieve historical swap receipts via API would be valuable. Even a 24-hour rolling log.

**5. Agent-specific SDK.**

The current SDK is built for user-facing apps — it assumes a connected wallet, browser context, and human approval flows. Autonomous agent payments need: pre-signed transactions, deterministic slippage, no UI prompts, and reliable error classification. A thin `@jup-ag/agent-sdk` package that exposes only the server-side flow would make Jupiter the default settlement layer for every agent framework on Solana.

---

## What we wish existed

**A swap simulation endpoint** — similar to Solana's `simulateTransaction` but Jupiter-native. "Will this swap succeed at this slippage, given current on-chain state?" without sending anything. Essential for payment protocols that need a preflight before committing funds to escrow.

**Webhook on swap completion** — for long-settlement flows, polling `/execute` status is fragile. A registered webhook URL that Jupiter calls on confirmation would make the integration cleaner.

**Native USDC → any-token payment routing** — we had to build `resolveMint` ourselves. A `GET /routes?from=USDC&to={any_mint}` that returns available routes + estimated slippage would remove a whole class of integration bugs.

---

## Summary

Jupiter Swap V2 is the right primitive for autonomous agent payments. The API surface is clean, the Developer Platform consolidates things that used to be scattered, and the Agent Skills show that the team is thinking about AI-native integrations seriously.

The gaps are all in the edges: error surface documentation, agent-specific patterns, and auth consistency. None of them are blockers — we shipped. But fixing them would make Jupiter the obvious default for the next wave of agent protocol builders.

The integration is live. The code is open source. Happy to be a reference implementation for agent-native Jupiter swap flows.
