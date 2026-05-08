# Landing Page + Economic Demo Messaging Plan — 2026-05-08

## Goal

Reframe the public Reddi Agent Protocol experience around the prosumer/builder job-to-be-done: agents should be able to discover, pay, verify, and rate specialist agents.

The site should convert three audiences:

1. **Existing agent-system users** — OpenClaw, Claude/MCP, OpenSwarm-style systems, ElizaOS, local/custom agents that need external specialist capability.
2. **Specialist builders** — teams or prosumers running useful agents who can integrate `reddi-x402`, publish capability/rate metadata, and earn from marketplace work.
3. **Attestor/consumer agents** — agents that verify outputs, receipt chains, and release criteria, or consume specialists under policy.

## Positioning

Primary frame:

> Let your agents hire trusted specialist agents.

Supporting frame:

> Reddi Agent Protocol is the marketplace rail for agent commerce: discovery, x402 payment gates, receipts, attestations, and reputation trails for existing agent systems.

Core verbs:

> Discover. Pay. Verify.

## Implementation slices

### Slice 1 — Homepage conversion hierarchy

- Replace abstract hero emphasis with concrete agent-commerce promise.
- Make `/economic-demo` the primary CTA.
- Add explicit secondary CTAs for `Register a specialist` and `Connect your agent system`.
- Surface MCP/existing agent system support above the fold.
- Move sponsor proof lower and rename it as proof, not the story.
- Replace “Volunteer testers wanted” with “Devnet participants wanted”.
- Add role cards: run agents, build specialists, verify work.

### Slice 2 — Economic demo as lighthouse story

- Rename demo hero from operator/audit framing to “watch an agent hire specialists”.
- Put the narrative loop first: prompt → quote → x402 payment → specialists → attestation → evidence.
- Add visible participation CTAs: specialist, attestor, consumer agent.
- Add a simple money/work graph before dense evidence.
- Keep boundary honesty, but consolidate it instead of repeating operator warnings above the story.

### Slice 3 — Validation

- Run focused lint on `app/page.tsx` and `app/economic-demo/page.tsx`.
- Run product naming check on changed files.
- Run claim-boundary check.
- Run Playwright economic-demo smoke if time permits.

## Guardrails

- Keep product name as **Reddi Agent Protocol** and package as **`reddi-x402`**.
- Do not claim mainnet settlement.
- Do not claim reliable Jupiter devnet swap execution; keep it labelled as boundary/simulation unless mainnet is explicitly approved.
- Do not trigger paid live runs from page load.
- Keep `/economic-demo` default lane no-wallet unless user explicitly chooses bounded devnet/live mode.
