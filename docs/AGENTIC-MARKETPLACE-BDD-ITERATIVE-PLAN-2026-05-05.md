# Agentic Marketplace Manifest + Disclosure Ledger — BDD Iterative Plan

_Date:_ 2026-05-05 AEST  
_Status:_ Active after Phase 7 storyboard dry-run merge; picture storyboard artifact generator local slice in progress
_Related:_ PR #202, PR #203, PR #205, PR #214, `ECONOMIC-DEMO-BDD-ITERATIVE-ROADMAP-2026-05-04.md`, Bucket J BDD feature

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
- PR #214: hosted Coolify specialists redeployed/smoked; final sanitized evidence confirms 30/30 public `/.well-known/reddi-agent.json` endpoints expose dependency disclosure parity.

Still pending:

- Live economic workflow evidence still predates hosted manifest parity and should only be regenerated under an explicit live-run approval gate.
- Research workflow design now has a disclosure-ledger-first dry-run graph and deterministic artifact generator before any live research calls.
- Phase 6 live research is skipped for now because it needs explicit hosted/devnet spend approval; Phase 7 storyboard dry-run is merged and now has a deterministic artifact generator slice underway.
- Picture workflow expansion remains behind research planning and explicit image-generation approval.

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

## Phase 2.5 — Latest generated evidence-pack summaries in `/economic-demo`

**BDD expectation:** When a generated judge evidence pack exists, `/economic-demo` uses that pack's compact summary instead of stale hardcoded ledger data.

**Scope:**

- Load the newest local `artifacts/economic-demo-evidence-pack/*/evidence-pack.json` from the server-side evidence API.
- Prefer its `disclosureLedgerSummary` and evidence-pack metadata in the UI.
- Fall back to the truthful historical pre-ledger summary when no generated pack is present.

**Acceptance criteria:**

- Page load still does not call live specialist endpoints, sign receipts, or mutate wallets.
- The UI labels whether it is showing the latest generated evidence pack or fallback summary.
- Tests prove a generated pack with complete ledger data drives the UI-facing API summary.

**Validation:**

- focused Jest for generated evidence-pack summary selection;
- targeted ESLint;
- `npm run build`;
- `npm run test:bdd:index`;
- `git diff --check`.

**Retrospective prompt:** Does the UI now follow the newest generated artifact without hiding historical incompleteness?

**Expected next refinement:** Continue Phase 3 local manifest parity; hosted redeploy remains approval-gated.

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

### Retrospective — Phase 3 local manifest parity

- **What worked:** The runtime `/.well-known/reddi-agent.json` metadata now exposes the same dependency classes as the public marketplace: tools, skills, marketplace-agent calls, external MCP servers, non-marketplace services, and disclosure policy. A local conformance script checks all 30 OpenRouter specialist profiles.
- **What failed or surprised us:** The package build emits source files under `dist/src/*` because `rootDir` is `.`, so the first conformance script import path targeted the wrong dist root. That was fixed and logged in `.learnings/2026-05-05-openrouter-specialists-dist-root.md`.
- **Safety/spend review:** The slice is local metadata generation and tests only. It performs no hosted redeploy, no live specialist calls, no signing, no wallet mutation, and no paid API calls.
- **Judge clarity:** Programmatic consumers can reject an agent before purchase based on dependency disclosure, while paid responses remain governed by `reddi.downstream-disclosure-ledger.v1`.
- **Plan adjustment:** Do not claim hosted manifest parity until explicit redeploy and public smoke are approved. Next safe step is status/PR for Phase 3; Phase 4 remains operator-gated.

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

### Retrospective — Phase 4 hosted redeploy + public smoke

- **What worked:** Hosted manifest parity now matches local expectations. The final public smoke artifact shows 30/30 hosted specialist manifests expose `agenticWorkflowDisclosure`, dependency disclosure parity fields, and `reddi.agent-dependency-manifest.v1`.
- **What failed or surprised us:** Coolify queue backpressure rejected 3 initial redeploy triggers with HTTP 429; retrying after the queue drained succeeded. `collective-intelligence-agent` then failed once because the helper container was not running during artifact setup, and a single redeploy retry fixed it.
- **Safety/spend review:** Phase 4 only redeployed/smoked manifest endpoints. It made no live specialist calls, no paid API calls, no signing, no wallet mutation, and no devnet transfer. Secret grep over Phase 4 artifact JSON returned no matches.
- **Judge clarity:** A judge/consumer agent can now inspect public hosted manifests before purchase and see disclosed tools, skills, marketplace-agent calls, external MCP servers, non-marketplace calls, and ledger disclosure policy.
- **Plan adjustment:** Proceed to Phase 5 as dry-run research design only. Do not regenerate live economic workflow evidence until a separate approval explicitly authorizes the live run.

---

## Phase 5 — Research workflow BDD + dry-run design

**BDD expectation:** The research article workflow has planned specialist graph, citation/evidence caveats, and disclosure-ledger expectations before live calls.

**Scope:**

- Extend BDD for research path evidence quality.
- Define retrieval/research/content/explainability/verification edges.
- Confirm every planned edge has manifest disclosure and ledger output expectations.
- Keep orchestration separate from synthesis unless the dry-run explains why a specialist self-loop is safer than using `agentic-workflow-system` as coordinator.

**Initial dry-run graph candidate:**

1. `agentic-workflow-system` or `scientific-research-agent` plans the article workflow and budget envelope.
2. `knowledge-retrieval-agent` gathers source candidates and citation metadata without calling paid providers in dry-run mode.
3. `scientific-research-agent` synthesizes claims, caveats, and evidence gaps.
4. `content-creation-agent` drafts the article while preserving citations/caveats.
5. `explainable-agent` summarizes provenance, payload flow, and what is intentionally obfuscated.
6. `verification-validation-agent` checks citation coverage, unsupported claims, and release/refund/dispute guidance.

Every planned edge must declare payload class, disclosure-ledger expectation, x402 state (`planned` in Phase 5), attestor expectation, and failure/refund behavior.

**Acceptance criteria:**

- No live research calls in this phase.
- Payload boundaries and evidence caveats are explicit.
- Attestor criteria are defined.

**Validation:**

- BDD index check;
- doc inspection;
- optional dry-run route test.

**Retrospective prompt:** Does research add a new proof category, or does it just repeat webpage with weaker evidence?

**Expected next refinement:** If useful, generate and review the dry-run artifact, then decide whether controlled multi-edge research deserves a separate live-run approval gate. If not, improve evidence criteria first.

### Retrospective — Phase 5 research dry-run disclosure design

- **What worked:** The dry-run graph now uses `agentic-workflow-system` as coordinator and keeps `scientific-research-agent` as a synthesis specialist. Each planned research edge declares payload class, citation/evidence caveat, attestor criteria, refund/dispute behavior, and planned downstream-disclosure ledger expectations before any live call.
- **What failed or surprised us:** The earlier fixture and test expectation treated `scientific-research-agent` as orchestrator. That blurred synthesis with paid-edge coordination, so the implementation corrected the separation.
- **Safety/spend review:** The slice is dry-run metadata/UI/API only: no live specialist calls, no paid provider requests, no signing, no wallet mutation, and no devnet transfer.
- **Judge clarity:** Improved. `/economic-demo` can now show the research graph as a planned evidence contract rather than a vague article workflow.
- **Plan adjustment:** Add a deterministic research dry-run artifact generator and review that artifact before requesting any Phase 6 controlled live research approval.

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

### Retrospective — Phase 5 research dry-run artifact generator

- **What worked:** The research dry-run graph is now serializable as a deterministic local artifact with mode `dry_run_no_live_calls`, planned x402 state on every edge, and zero live/provider/signing/wallet/devnet activity.
- **What failed or surprised us:** The artifact generator needed runtime TypeScript transpilation because the repo does not emit a standalone build artifact for these library helpers. The script keeps alias resolution local and asserts dry-run guardrails before writing output.
- **Safety/spend review:** Local artifact generation only. No hosted specialist calls, no paid provider requests, no Coolify mutation, no signing, no wallet mutation, and no devnet transfer.
- **Judge clarity:** Improved: reviewers can inspect one JSON artifact that names the orchestrator, five planned research edges, disclosure-ledger expectations, and safety review counters.
- **Plan adjustment:** Do not proceed to Phase 6 live research without explicit approval. Continue to Phase 7 storyboard dry-run so the picture path proves adapter gating without hidden image spend.

### Retrospective — Phase 7 storyboard dry-run design

- **What worked:** The picture path now models `tool-using-agent` as an adapter-gating orchestrator, marks `image-generation-adapter` as blocked, and produces storyboard frames with positive prompts, negative prompts, and evidence caveats.
- **What failed or surprised us:** The existing picture dry-run graph included `tool-using-agent` as an edge target as well as orchestrator. The dedicated storyboard design makes that self-planning step explicit and keeps the provider adapter blocked.
- **Safety/spend review:** Design/API/UI only. No OpenAI call, no Fal.ai call, no paid provider request, no signing, no wallet mutation, and no devnet transfer.
- **Judge clarity:** Improved: storyboard mode can be shown as an honest visual proof plan, not mistaken for generated image evidence.
- **Plan adjustment:** If the storyboard is sufficient for judging, stop before spend. If a real image is needed, request separate approval with provider, budget cap, and disclosure evidence requirements.

### Retrospective — Phase 7 storyboard artifact generator

- **What worked:** The picture storyboard can now be exported as a deterministic local artifact with schema `reddi.economic-demo.picture-storyboard-artifact.v1`, blocked adapter details, storyboard frames, disclosure-ledger expectations, and zero-execution safety counters.
- **What failed or surprised us:** Artifact validation needs to treat the disabled adapter as a first-class edge, not as absence of an edge. The blocked state is the useful evidence because it proves adapter gating before spend.
- **Safety/spend review:** Local artifact generation only. No OpenAI request, no Fal.ai request, no paid provider request, no signing, no wallet mutation, and no devnet transfer.
- **Judge clarity:** Improved: reviewers can inspect one JSON artifact that says what would be generated, why it is not generated yet, and which disclosure fields must be preserved if the adapter is later approved.
- **Plan adjustment:** Keep real image generation approval-gated. Next safe work is either CI Node.js 20 deprecation cleanup or a compact UI link to latest local evidence artifacts.

---

## Running retrospective log

### Phase 2.5 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** The webpage evidence API now checks the newest generated judge evidence pack and prefers its compact `disclosureLedgerSummary` for `/economic-demo`. The client visibly labels whether it is reading a latest generated pack or the fallback summary.
- **What failed or surprised us:** Existing committed historical artifacts still predate the downstream ledger contract, so fallback remains intentionally yellow/not evidence-complete until a new approved live/synthetic evidence pack is generated.
- **Safety/spend review:** Server-side local file read only. No specialist endpoint calls, no signing, no wallet mutation, no external redeploy, no paid model calls.
- **Plan adjustment:** Proceed to Phase 3 local manifest parity next. Do not run hosted Coolify redeploy/smoke without explicit operator approval.

### Phase 2 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** `/economic-demo` now consumes the normalized `disclosureLedgerSummary` shape and renders a dedicated downstream disclosure-ledger panel next to the multi-edge proof. The UI does not inspect raw source artifact edge JSON.
- **What failed or surprised us:** The currently committed 2026-05-04 live webpage artifact predates `reddi.downstream-disclosure-ledger.v1`, so the truthful UI state is **not evidence-complete** rather than a green ledger. This is useful judge-facing honesty, not a failure.
- **Safety/spend review:** UI/API summary only. No live endpoint calls from page load, no wallet mutation, no signing, no external infra mutation, no paid model calls.
- **Judge clarity:** Improved: the panel names the missing ledger contract and lists each edge with `missing_pre_ledger_artifact`, so a judge can distinguish historical x402 proof from complete downstream-disclosure proof.
- **Plan adjustment:** Next phase should either (a) wire latest generated evidence-pack summaries into the UI when available, or (b) move to local manifest parity. Do not claim hosted endpoints are ledger-complete until Coolify redeploy/smoke is explicitly approved and new artifacts are generated.

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
