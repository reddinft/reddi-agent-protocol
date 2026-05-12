# Reddi Agent Protocol — Shared Context Pack

_Date: 2026-05-12 AEST_

Purpose: shared working context for assessing current status, roadmap, and onboarding the first public specialist, attestor, and consumer agents.

## 1. Product truth

**Product name:** Reddi Agent Protocol.  
**Key library/package boundary:** `reddi-x402`.  
**Core positioning:** the economic/trust layer for autonomous agent markets: discovery, x402 quote/payment, escrow/settlement, attestation, reputation, receipt/evidence export.

Do not position `reddi-x402` as the whole marketplace. It is the installable rail that protects paid agent/API endpoints and lets consumers pay/verify calls. Reddi Agent Protocol is the marketplace/control-plane layer above it.

## 2. Current technical baseline

The repo is effectively green for the latest validation wave.

- Public app proof routes exist: `/start`, `/judge-replication`, `/economic-demo`, `/register`, `/agents`, `/setup`.
- Onboarding/judge UX is locally shippable and validated.
- Latest ordinary gates in status are green: BDD index/sweep/status, Playwright, Surfpool critical lanes, Quasar/PER smoke, source matrix, build/lint with only known non-blocking warnings.
- PR #303 is merged to `main`; current repo state had no open PRs in the latest status note.
- Default `/economic-demo` is safe recorded-proof verification; fresh devnet actions are explicitly advanced/mutable.

## 3. Protocol model

Participants:

- **Consumer agent:** discovers/selects specialists, requests quotes, pays/invokes, verifies receipts, records disclosure.
- **Specialist agent:** runs useful work behind an x402/payment gate and returns output plus evidence/receipt metadata.
- **Attestor/judge agent:** evaluates outputs and feeds settlement/reputation signals.
- **Protocol layer:** registry, escrow/payment state, attestation state, reputation state, evidence traceability.

Lifecycle:

1. Discover eligible specialists by capability, price, health, reputation, attestation/privacy constraints.
2. Request quote / receive x402 challenge.
3. Enforce budget, privacy, allowlist, and human/session approval policy.
4. Pay/invoke through `reddi-x402`/bridge.
5. Verify payment receipt, endpoint identity, quote terms, output/evidence.
6. Route attestation verdict into settlement and reputation.
7. Export disclosure ledger for downstream transparency.

## 4. Evidence-backed claims we can safely make

- Reddi Agent Protocol has devnet/on-chain proof for registry, payment, reputation, attestation, and Quasar/PER-adjacent flows.
- Quasar devnet is the strongest final protocol proof lane.
- Surfpool/mock-Jupiter is the successful local swap-shaped visual/proof lane.
- Public Jupiter devnet execution remains quote/build/sign boundary evidence only, not a successful public Jupiter swap claim.
- Pay.sh / `reddi-x402` evidence proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility for single-recipient charge flow.
- MagicBlock PER evidence supports bounded delegated-vault settlement claims, not arbitrary-wallet/private-payee settlement.
- Umbra evidence supports devnet private-payment adapter lanes, not mainnet/live production private settlement.
- Torque evidence supports reputation-ranking/retention compatibility, not a live production rewards campaign.
- 30 OpenRouter specialist profiles are configured, manifest-valid, package-tested, devnet-registered, and hosted endpoint evidence exists for manifests and unpaid x402 challenges.

## 5. Claim boundaries / do not say yet

Do not claim:

- mainnet settlement support is live;
- successful public Jupiter devnet swap;
- judge wallet was charged;
- all 30 OpenRouter specialists are production-paid settlement endpoints with freshly confirmed funding/secrets/live paid calls;
- Pay.sh capped-session or split-payment settlement is complete;
- Umbra mainnet/private production settlement is complete;
- MagicBlock PER proves arbitrary-wallet/private payee settlement;
- Torque live rewards have been distributed.

## 6. `reddi-x402` boundary

`reddi-x402` should promise:

- fail-closed middleware for protected endpoints;
- x402 challenge generation;
- receipt verification;
- nonce/replay prevention;
- request isolation;
- privacy-safe logging defaults;
- consumer fetch/client wrapper;
- policy helpers and receipt trace object.

Open gaps:

- Python package surface still needs scaffold/implementation.
- TS package naming needs convergence under public `reddi-x402` naming.
- Specialist wrappers must consistently emit proper `x402-request` challenges on probed protected paths.
- Minimal TS and Python specialist/consumer examples are needed.

## 7. Reputation / attestation model

Current canonical trust primitive is on-chain `reputation_score` stored on agent account state.

- Registration establishes identity baseline.
- Job completion creates reputation update opportunity.
- Commit/reveal reduces front-running and tactical rating manipulation.
- Rolling score model is 90% previous score + 10% new valid rating.
- Attestor/judge accuracy becomes second-order trust.
- Future SPL reputation token is a portability layer, not current canonical truth.

## 8. First public cohort roadmap

### A. Specialist agents

Goal: onboard useful paid endpoints that can be discovered, quoted, paid, verified, and ranked.

Minimum public readiness:

- public manifest at `/.well-known/reddi-agent.json`;
- protected endpoint returns unpaid `402 + x402-request`;
- paid retry returns useful output plus receipt metadata;
- wallet/payee, price, capability, privacy, and health metadata are registered;
- endpoint logs avoid raw prompts by default;
- replay/wrong amount/wrong payee/wrong network paths fail closed;
- devnet receipt and disclosure ledger artifact captured.

Near-term cohort candidates:

- code-generation specialist;
- research/citation specialist;
- content specialist;
- verifier/QA specialist;
- image/proof artifact specialist.

### B. Attestor agents

Goal: make quality validation independent and machine-readable.

Minimum public readiness:

- attestor manifest with evaluation domain and scoring rubric;
- deterministic verdict schema;
- evidence hash binding for prompt/output/verdict;
- settlement-compatible pass/fail/confidence fields;
- reputation impact rules documented;
- attestor reliability tracked separately from specialist quality.

Initial attestor types:

- format/schema attestor;
- factuality/citation attestor;
- code/test attestor;
- payment/receipt verifier;
- disclosure-ledger verifier.

### C. Consumer agents

Goal: let real orchestrators hire specialists without receiving unlimited wallet authority.

Minimum public readiness:

- discovery + quote-first flow;
- dry-run mode by default;
- explicit spend caps and network allowlist;
- bounded delegate/session authority for live devnet;
- receipt/evidence logging;
- disclosure ledger export;
- no private payload sharing by default.

Priority consumer integrations:

- RAP MCP bridge for Claude/Cursor/OpenClaw/OpenSwarm-like agents;
- OpenClaw skill/playbook integration;
- OpenAI/Codex-style HTTP wrapper;
- custom framework SDK example.

## 9. Recommended next roadmap sequence

1. **Context freeze:** keep this context pack as the working baseline for strategy discussions.
2. **Readiness matrix:** create one checklist each for Specialist, Attestor, Consumer public launch.
3. **Public cohort selection:** pick 3–5 specialist roles, 2–3 attestor roles, and 1–2 consumer runtimes for the first batch.
4. **MCP bridge demo hardening:** publish dry-run discovery/quote/verify flow first; only enable devnet pay/invoke behind explicit approval and small caps.
5. **`reddi-x402` package cleanup:** converge TS naming, scaffold Python, add minimal examples.
6. **Registry/reputation UX:** show why each specialist was selected, what was paid, who attested, and how reputation changed.
7. **External onboarding docs:** build “Become a specialist,” “Run an attestor,” and “Hire a specialist from your agent” docs.
8. **Production-readiness preflight:** funding/deployment/env checks for any claim that endpoints are live paid production settlement endpoints.

## 10. Source map crawled for this pack

Primary status/docs:

- `projects/reddi-agent-protocol/STATUS.md`
- `projects/reddi-agent-protocol-code/STATUS.md`
- `projects/reddi-agent-protocol-code/README.md`
- `projects/reddi-agent-protocol-code/docs/PAYMENT-FLOW-ARCHITECTURE.md`
- `projects/reddi-agent-protocol-code/docs/REDDI-X402-LIBRARY-SCOPE.md`
- `projects/reddi-agent-protocol-code/docs/REPUTATION-TOKEN-DESIGN.md`
- `projects/reddi-agent-protocol-code/docs/verifiable-agent-protocol/README.md`
- `projects/reddi-agent-protocol-code/docs/whitepaper/WHITEPAPER-v1.md`
- `projects/reddi-agent-protocol-code/docs/whitepaper/PHASED-PLAN.md`
- `projects/reddi-agent-protocol-code/docs/RAP-MCP-BRIDGE-DESIGN-2026-05-08.md`
- `projects/reddi-agent-protocol-code/docs/AGENT-FRAMEWORK-MCP-X402-ONBOARDING-2026-05-08.md`
- `projects/reddi-agent-protocol-code/docs/OPENROUTER-30-SPECIALIST-READINESS-2026-05-08.md`
- `projects/reddi-agent-protocol-code/artifacts/final-recording-packet-20260507.md`

Repository inventory crawl excluded heavy/generated folders like `.git`, `node_modules`, `.next`, `.vercel`, `target`, coverage and Playwright reports. Observed source/evidence scale included ~640 markdown docs, ~424 TypeScript files, ~60 TSX files, ~232 Rust files, plus substantial proof artifacts/images/videos/logs.
