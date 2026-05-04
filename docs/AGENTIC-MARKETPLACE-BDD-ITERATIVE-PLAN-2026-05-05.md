# Agentic Marketplace Manifest + Disclosure Ledger — BDD Iterative Plan

_Date:_ 2026-05-05 AEST  
_Status:_ Active after PR #205 merged public marketplace manifest disclosure  
_Related:_ PR #202, PR #203, PR #205, `ECONOMIC-DEMO-BDD-ITERATIVE-ROADMAP-2026-05-04.md`, Bucket J BDD feature

## North star

A judge or consumer agent can inspect Reddi before purchase, execute a bounded workflow, and verify afterward that the agent economy behaved transparently:

1. public marketplace cards reveal that specialists/attestors have manifests, not just capability tags;
2. specialist detail pages expose public manifest fields: roles, tools, skills, preferred attestors, marketplace-agent calls, external MCP servers, and non-marketplace agent/service calls;
3. `/.well-known/reddi-agent.json` exposes the same disclosure contract for programmatic consumers;
4. every paid response returns `reddi.downstream-disclosure-ledger.v1` for downstream calls;
5. evidence packs and `/economic-demo` explain payload flow, money flow, attestation, and disclosure without claiming hidden production settlement;
6. every phase ends with a retrospective before scope expands.

## Iteration contract

Every phase follows the same loop:

```text
BDD expectation → scoped implementation → validation → evidence artifact → retrospective → plan refinement
```

Phase expansion is not automatic. At the end of each phase, record:

- **What worked:** What did the phase prove?
- **What failed or surprised us:** Missing data, confusing UI, flaky CI, incorrect assumptions.
- **Safety/spend review:** Did anything create hidden spend, wallet mutation, secret exposure, or unbounded retries?
- **Judge clarity:** Can a judge understand the proof in under 30 seconds?
- **Plan adjustment:** What changes before the next loop?

## Current baseline

Shipped:

- PR #202: agentic workflow disclosure contract in runtime and manifests.
- PR #203: evidence tooling rejects future live artifacts without downstream-disclosure ledger evidence.
- PR #205: public `/agents` and `/agents/[wallet]` marketplace pages expose manifest tools, skills, downstream marketplace-agent dependencies, external MCP servers, and non-marketplace agent/service dependencies.

Still pending:

- Hosted Coolify specialist redeploy/smoke before public `/.well-known/reddi-agent.json` endpoints can be claimed current.
- `/economic-demo` UI and evidence packs still need first-class display of `reddi.downstream-disclosure-ledger.v1` entries.
- Research and picture workflows should not expand until webpage evidence is understandable and disclosure-complete.

## Phase 0 — Plan + BDD lock

**BDD expectation:** The repo contains a staged, retrospective-driven plan and BDD scenarios that prevent us from forgetting manifest/dependency disclosure.

**Scope:**

- Add this plan document.
- Add/confirm BDD scenarios covering public marketplace manifest disclosure and downstream ledger evidence display.
- Update `STATUS.md` with resume point and current phase.

**Acceptance criteria:**

- Plan names phase order and retrospective gates.
- BDD feature mentions marketplace tools/skills/MCP/non-marketplace dependency disclosure.
- No runtime behavior changes in this phase.

**Validation:**

- `npm run test:bdd:index`
- `git diff --check`

**Retrospective prompt:** Did the plan make the next executable slice obvious enough that a fresh session can resume without asking where we were?

**Expected next refinement:** If yes, enter Phase 1. If not, tighten the plan before touching code.

---

## Phase 1 — Disclosure ledger evidence summary in artifacts

**BDD expectation:** A live workflow artifact cannot pass evidence packaging unless every paid edge includes `reddi.downstream-disclosure-ledger.v1` summary data.

**Scope:**

- Normalize artifact summary shape for downstream-disclosure ledger entries.
- Include each edge's ledger schema, called profile/wallet/endpoint, payload summary or hash, x402 challenge/receipt state, attestor links, and obfuscation reason.
- Keep existing guard that rejects historical artifacts without ledger evidence.

**Acceptance criteria:**

- Generated evidence summary has a compact `downstreamDisclosureLedger` block.
- Missing ledger entries fail closed with actionable error.
- Historical pre-PR #202 artifacts remain invalid for new evidence packs.

**Validation:**

- script smoke for webpage evidence pack generation;
- targeted `node --check` / ESLint for scripts;
- focused Jest if helper added.

**Retrospective prompt:** Does the artifact prove the agentic workflow disclosure contract without requiring raw JSON archaeology?

**Expected next refinement:** If the artifact is clear, surface it in UI. If not, revise the summary schema first.

---

## Phase 2 — `/economic-demo` ledger disclosure UI

**BDD expectation:** A judge opening `/economic-demo` can see downstream disclosure ledger entries next to the multi-edge workflow proof.

**Scope:**

- Add a panel to the latest live evidence section showing `reddi.downstream-disclosure-ledger.v1` entries.
- Show marketplace agent identity, wallet/endpoint, payload class/summary/hash, amount/receipt/challenge state, attestor links, and obfuscation reasons.
- Label controlled-demo receipts distinctly from production settlement.

**Acceptance criteria:**

- Page load does not call live endpoints.
- UI distinguishes planned, attempted, paid, failed, and no-call ledger states.
- No secrets/raw provider output are rendered.
- Empty/missing ledger state is visibly treated as not evidence-complete.

**Validation:**

- targeted Jest/helper tests;
- targeted ESLint;
- `npm run build`.

**Retrospective prompt:** Can a judge understand exactly which downstream agents were called and what was paid/disclosed in under 30 seconds?

**Expected next refinement:** If clear, move to programmatic manifest parity. If not, adjust visual hierarchy and labels.

---

## Phase 3 — Programmatic manifest parity for hosted agents

**BDD expectation:** Programmatic consumers reading `/.well-known/reddi-agent.json` see the same tools/skills/dependency disclosure as the public marketplace.

**Scope:**

- Confirm runtime manifest fields match marketplace registry enrichment.
- Add conformance smoke for local runtime manifest disclosure.
- Prepare hosted redeploy checklist without mutating external infra automatically.

**Acceptance criteria:**

- Local runtime manifests expose tools/skills, marketplace-agent calls, external MCP servers, non-marketplace services, and disclosure policy.
- Conformance output lists any profile missing disclosure.
- External redeploy remains separately approved.

**Validation:**

- package tests for OpenRouter specialists;
- manifest conformance script;
- targeted lint/build if app code changes.

**Retrospective prompt:** Is there any mismatch between what humans see in `/agents` and what consumer agents discover programmatically?

**Expected next refinement:** If local conformance passes, request/perform approved hosted redeploy + smoke.

---

## Phase 4 — Hosted redeploy + public smoke, approval-gated

**BDD expectation:** Public hosted specialist endpoints expose current manifest disclosure fields.

**Scope:**

- Only after explicit operator approval, redeploy hosted Coolify specialists.
- Smoke `/.well-known/reddi-agent.json` for all hosted specialists.
- Save sanitized evidence artifact with endpoint, profile id, wallet, manifest disclosure presence, and timestamp.

**Acceptance criteria:**

- Every hosted endpoint returns current manifest disclosure or is listed with a blocker.
- No secrets or Coolify credentials in artifacts.
- Failed endpoints have clear remediation.

**Validation:**

- hosted manifest smoke script;
- secret grep over artifact;
- STATUS update.

**Retrospective prompt:** Did external infra match local expectations, and did any deployment gap change the next phase?

**Expected next refinement:** If public manifests are current, continue research workflow design. If not, fix infra/runtime drift first.

---

## Phase 5 — Research workflow BDD + dry-run design

**BDD expectation:** The research article workflow has planned specialist graph, citation/evidence caveats, and disclosure-ledger expectations before live calls.

**Scope:**

- Extend BDD for research path evidence quality.
- Define retrieval/research/content/explainability/verification edges.
- Confirm every planned edge has manifest disclosure and ledger output expectations.

**Acceptance criteria:**

- No live research calls in this phase.
- Payload boundaries and evidence caveats are explicit.
- Attestor criteria are defined.

**Validation:**

- BDD index check;
- doc inspection;
- optional dry-run route test.

**Retrospective prompt:** Does research add a new proof category, or does it just repeat webpage with weaker evidence?

**Expected next refinement:** If useful, run controlled multi-edge research. If not, improve evidence criteria first.

---

## Phase 6 — Controlled research live workflow

**BDD expectation:** Research article workflow reaches bounded paid completions and returns disclosure-complete evidence.

**Scope:**

- Add guarded research live x402 workflow smoke.
- Execute only after endpoint readiness and spend gates are explicit.
- Save bounded artifact and evidence pack.

**Acceptance criteria:**

- All edges capture 402 challenge and controlled 200 completion or fail-closed reason.
- Output includes citations or explicit evidence caveats.
- Disclosure ledger is complete for every attempted downstream call.

**Validation:**

- live smoke artifact;
- evidence pack generation;
- secret grep;
- retrospective.

**Retrospective prompt:** Did this prove a richer agent economy than webpage, with honest evidence quality?

---

## Phase 7 — Picture/storyboard path, no hidden image spend

**BDD expectation:** Picture path is explainable without accidental image-generation spend.

**Scope:**

- Produce visual brief/storyboard through marketplace specialists.
- Keep real image generation disabled unless explicitly approved.
- Validate prompt/storyboard alignment through vision/verification specialists where possible.

**Acceptance criteria:**

- No OpenAI/Fal call unless explicitly enabled.
- Storyboard mode is clearly labeled.
- Disclosure ledger still includes payload/payment/attestation flow.

**Validation:**

- disabled-generation smoke;
- build;
- optional approval-gated image run later.

**Retrospective prompt:** Is storyboard mode sufficient for judging, or do we need approval-gated real image generation?

---

## Running retrospective log

### Phase 1 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** Evidence pack generation now creates a compact `reddi.economic-demo.disclosure-ledger-summary.v1` block and repeats the ledger in human-readable markdown, so reviewers do not need to inspect raw edge JSON to understand downstream disclosure.
- **What failed or surprised us:** The existing markdown renderer assumed raw source-edge shape; once the pack switched to normalized edge summaries, the smoke caught a shape mismatch before commit.
- **Safety/spend review:** Used a synthetic local source artifact only. No live endpoints, wallet mutation, external infra mutation, provider calls, or hidden retries. Secret scan still runs over generated pack output.
- **Judge clarity:** Improved: the evidence pack now states total disclosure entries and includes a dedicated compact downstream disclosure ledger section.
- **Plan adjustment:** Phase 2 should consume `disclosureLedgerSummary` from evidence packs/UI helpers rather than re-parsing raw source edge ledgers.

### Phase 0 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** The phase produced a single resumeable plan with explicit phase order, validation gates, and retrospective prompts. BDD now locks public marketplace manifest dependency disclosure and disclosure-ledger evidence expectations.
- **What failed or surprised us:** PR #205 already shipped the public UI slice before this plan existed, so Phase 0 had to document the already-completed marketplace baseline rather than starting from a blank plan.
- **Safety/spend review:** Docs/BDD-only change; no runtime calls, wallet mutations, external infra mutation, or provider spend.
- **Judge clarity:** The next proof gap is now concrete: artifacts and `/economic-demo` must display `reddi.downstream-disclosure-ledger.v1`, not merely require it behind the scenes.
- **Plan adjustment:** Phase 1 should focus on evidence artifact summary shape before more UI work; external Coolify redeploy remains approval-gated.
