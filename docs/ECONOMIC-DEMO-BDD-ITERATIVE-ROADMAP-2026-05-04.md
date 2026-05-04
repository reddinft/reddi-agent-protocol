# Economic Demo BDD Iterative Roadmap — Post Multi-Edge Proof

_Date:_ 2026-05-04 AEST  
_Status:_ Active after controlled multi-edge webpage workflow reached  
_Source evidence:_ `artifacts/economic-demo-webpage-live-x402-workflow/20260504T093552Z/summary.json`  
_Related:_ `END-USER-ECONOMIC-DEMO-DELIVERY-PLAN-2026-05-04.md`, `END-USER-ECONOMIC-DEMO-ITERATION-LOG-2026-05-04.md`, Bucket J BDD feature

## North star

A judge can open `/economic-demo`, choose an end-user request, and understand the full economic loop:

1. user request enters a consumer/orchestrator;
2. scoped payloads move to specialist agents;
3. every paid edge returns an x402 challenge and receipt/completion evidence;
4. final output is verified by an attestor;
5. balances/ledger show economic impact or an explicitly labeled controlled-demo receipt state;
6. every phase has a retrospective before expanding scope;
7. every autonomous specialist/attestor that may become a consumer agent discloses that capability in its manifest and returns a downstream-disclosure ledger when it delegates.

## Iteration contract

Every phase follows this loop:

```text
BDD expectation → scoped implementation → validation → evidence artifact → retrospective → plan refinement
```

Phase expansion is not automatic. At the end of each phase we ask:

- Did this prove payload flow, money flow, attestation, final output, or wallet impact?
- Did we accidentally add hidden spend, retries, or secret exposure?
- Did judge-facing clarity improve?
- What did the result change about the next phase?
- Did the phase preserve agentic workflow transparency: manifest disclosure before execution, downstream payload/payment disclosure after execution, and clearly labeled obfuscation only where protecting a specialist's competitive moat?

## Current baseline

Completed before this roadmap:

- Static fixture UI, dry-run planning, balance snapshots, Surfpool/local transfer rehearsal.
- First live x402 challenge reached.
- Controlled demo-paid single edge reached HTTP 200.
- Controlled demo-paid multi-edge webpage workflow reached across:
  - `planning-agent`,
  - `content-creation-agent`,
  - `code-generation-agent`,
  - `verification-validation-agent`.
- Latest live result: `multi_edge_paid_workflow_reached`, 8 bounded downstream calls, no blockers.

## Phase 7A — Surface multi-edge live evidence in `/economic-demo`

**BDD expectation:** A judge can see the latest multi-edge webpage live evidence without opening raw JSON.

**Scope:**

- Add a typed public summary for the latest controlled multi-edge webpage evidence.
- Add an API route returning that summary.
- Add a UI panel on `/economic-demo` showing:
  - conclusion;
  - 4 specialist edges;
  - unpaid HTTP 402 challenge per edge;
  - controlled demo-paid HTTP 200 completion per edge;
  - total bounded downstream calls;
  - guardrail labels.

**Acceptance criteria:**

- UI clearly labels this as controlled demo receipts, not production settlement verification.
- No live endpoint is called by loading the page.
- No artifact includes secrets or raw keys.
- Tests verify conclusion, edge count, status codes, and guardrails.

**Validation:**

- focused Jest for evidence summary;
- targeted lint for new API/UI/helper;
- `npm run build`.

**Retrospective prompt:** Does this panel make the economic proof obvious to a judge in under 30 seconds?

**Expected next refinement:** If the panel is clear, generate a compact evidence pack. If not, improve labels/visual hierarchy before expanding.

## Phase 7B — Judge-facing evidence pack

**BDD expectation:** A judge can download or inspect a single bounded evidence packet for the webpage workflow.

**Scope:**

- Generate a sanitized evidence pack from the latest multi-edge smoke artifact.
- Include summary JSON + human-readable markdown:
  - user request;
  - specialist sequence;
  - receipt/challenge status;
  - output previews;
  - attestor recommendation;
  - guardrails;
  - known limitation: controlled demo receipts.

**Acceptance criteria:**

- Pack is public-data-only.
- Pack includes no API keys, private keys, signer material, or unbounded raw model output.
- The pack references the exact smoke command and artifact timestamp.

**Validation:**

- evidence pack script smoke;
- secret grep over generated pack;
- build if UI links the pack.

**Retrospective prompt:** Is the evidence pack enough to explain why this is an economic agent network, not a normal multi-agent chat?

## Phase 7C — Wallet/economic ledger reconciliation for controlled receipts

**BDD expectation:** The demo explains the difference between controlled demo receipts and real devnet settlement.

**Scope:**

- Add a ledger reconciliation view:
  - x402 challenge amount per edge;
  - controlled-demo receipt status;
  - no harness devnet transfer;
  - link back to Surfpool/local transfer proof for real transfer semantics.

**Acceptance criteria:**

- No false claim of production USDC settlement.
- Shows the exact payee wallet and USDC amount from each challenge.
- Makes Surfpool vs controlled-demo vs future real verifier distinction explicit.

**Validation:**

- unit test for reconciliation totals;
- UI smoke/build.

**Retrospective prompt:** Is the money-flow story honest and still compelling?

## Phase 7D — Agentic workflow manifest and downstream-disclosure contract

**BDD expectation:** Consumer agents can discover, before purchase, whether a specialist or attestor may hire other marketplace agents; after completion, they receive transparent downstream delegation evidence.

**Scope:**

- Extend the Reddi agent manifest with `mayCallMarketplaceAgents`, expected downstream capabilities/categories, budget/allowlist policy, attestor expectations, and payload-disclosure policy.
- Define a response-level downstream-disclosure ledger for live and controlled-demo delegation runs.
- Show disclosure in `/economic-demo` beside the receipt chain.
- Allow proprietary value-add obfuscation only for returned implementation details; never for called-agent identity, payload class/summary or hash, wallet/endpoint, payment evidence, or attestation links.

**Acceptance criteria:**

- Manifest makes downstream delegation optically obvious to consumer agents before execution.
- Response ledger lists each downstream agent call, payload summary/hash, amount/challenge/receipt status, and any obfuscation reason.
- Tests fail if a downstream call is executed without disclosure metadata.
- Documentation distinguishes autonomous agentic workflow from a central orchestrator fan-out.

**Validation:**

- manifest/runtime unit tests;
- BDD index check;
- targeted lint/build.

**Retrospective prompt:** Does this preserve full disclosure to the consumer agent while still allowing specialists to keep their proprietary synthesis/value-add opaque?

**Expected next refinement:** Wire manifest fields into all 30 hosted agents, then require disclosure-ledger evidence in webpage/research/picture live smokes.

## Phase 8A — Research workflow dry-run/evidence design

**BDD expectation:** Research article workflow has a planned specialist graph and evidence criteria before live calls.

**Scope:**

- Confirm retrieval → research → content → explainability → verification sequence.
- Add/refine BDD scenarios for citation/evidence caveats.
- Decide whether controlled demo receipts should be enabled for all research path specialists.

**Acceptance criteria:**

- Clear payload boundaries per specialist.
- Evidence caveat format defined.
- No live calls until plan/guardrails are updated.

**Retrospective prompt:** Are citations/evidence meaningful enough, or would this become fluent-but-unverified text?

## Phase 8B — Controlled multi-edge research workflow

**BDD expectation:** Research workflow reaches paid completions and attestation with bounded controlled receipts.

**Scope:**

- Add guarded research live x402 workflow smoke.
- Execute only after Coolify/env readiness is confirmed.
- Save bounded artifact.

**Acceptance criteria:**

- All edges return 402 challenge then 200 controlled demo-paid completion.
- Attestor gives release/refund/dispute guidance.
- Output includes citations or explicit evidence caveats.

**Retrospective prompt:** Does research add a new proof category beyond webpage, or just repeat the same pattern?

## Phase 9A — Picture/storyboard path without external image spend

**BDD expectation:** Picture case can be judge-explained without hidden image API cost.

**Scope:**

- Produce visual brief/storyboard through specialists.
- Keep image generation disabled unless explicitly approved.
- Vision/verification agents validate storyboard/prompt alignment.

**Acceptance criteria:**

- No OpenAI/Fal call unless enabled.
- UI labels storyboard mode clearly.
- Evidence still includes payload/payment/attestation flow.

**Retrospective prompt:** Is storyboard mode acceptable for judging, or do we need actual image generation?

## Phase 9B — Actual image adapter run, approval-gated

**BDD expectation:** Actual image generation stays inside the economic protocol story.

**Scope:**

- Enable `ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true` only with explicit approval and configured provider.
- Generate image through `/api/economic-demo/image` only.
- Validate via `vision-language-agent` and attestor.

**Acceptance criteria:**

- Provider/model recorded.
- Cost/external-call boundary documented.
- Generated artifact safely persisted.

**Retrospective prompt:** Did image generation improve the protocol demo enough to justify the external spend?

## Phase 10 — Real devnet receipt verifier design/implementation

**BDD expectation:** Move from controlled demo receipts to real receipt verification without breaking demo UX.

**Scope:**

- Specify canonical receipt fields and verification semantics.
- Implement verifier behind fail-closed feature flag.
- Add negative tests: wrong nonce, wrong payee, wrong amount, duplicate receipt.

**Acceptance criteria:**

- Controlled demo receipts remain visibly separate.
- Real verifier proves payment semantics before OpenRouter execution.
- Replay protection tested.

**Retrospective prompt:** Did real verifier reduce demo ambiguity enough to warrant replacing controlled receipts for judge run?

## Phase 11 — Submission polish and final judge rehearsal

**BDD expectation:** The submission can be rehearsed from cold open.

**Scope:**

- Final `/economic-demo` walkthrough.
- Evidence pack links.
- Known limitations copy.
- Screenshots/video capture if needed.

**Acceptance criteria:**

- Cold-open judge flow under 2 minutes.
- No broken buttons or stale blocker states.
- Latest artifacts and statuses are synchronized.

**Retrospective prompt:** Would a judge understand Reddi Agent Protocol as a paid, attestable agent economy?
