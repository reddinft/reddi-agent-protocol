# Economic Demo Submission Readiness — BDD Iterative Plan

_Date:_ 2026-05-05 AEST  
_Status:_ Phase 0 in progress  
_Related:_ Issue #228, PR #225, PR #226, PR #227, `/economic-demo`, `artifacts/economic-demo-submission-prep/latest`

## North star

A judge can open the economic demo, understand the agentic workflow economy in under 30 seconds, and verify the proof chain without us accidentally spending money, generating images, mutating wallets, or overstating production settlement.

The work proceeds as a loop, not a one-way checklist:

```text
BDD expectation → staged implementation → validation/evidence → retrospective → plan refinement → next loop
```

No phase expands until its retrospective is written and the next phase is adjusted from what we learned.

## Global guardrails

- No Phase 6 controlled live research unless Nissan explicitly approves hosted/devnet calls and spend.
- No OpenAI/Fal image generation unless Nissan explicitly approves provider, model, and budget cap.
- No paid provider requests.
- No signing operations.
- No wallet mutation.
- No devnet transfer.
- No Coolify/env/secret mutation.
- Do not commit ignored `artifacts/` outputs; only reference sanitized paths or generated summaries.
- Preserve exact opaque identifiers and wallet/address literals.

## Phase 0 — Plan + BDD lock

**BDD expectation:** The repo contains a durable staged plan and a BDD scenario that makes retrospective-driven demo/submission readiness part of the product workflow.

**Scope:**

- Add this plan document.
- Add BDD coverage for the submission-readiness loop and local evidence proof chain.
- Update `STATUS.md` with the new resume point.

**Acceptance criteria:**

- Phase order, guardrails, validation, and retrospective prompts are explicit.
- BDD names local evidence paths, green CI chain, and approval-gated no-go actions.
- No runtime behavior changes.

**Validation:**

- `npm run test:bdd:index`
- `git diff --check`

**Retrospective prompt:** Can a fresh session continue from `STATUS.md` + this plan + Issue #228 without asking what the next loop is?

**Expected next refinement:** If yes, enter Phase 1. If not, tighten phase boundaries before touching UI/runtime.

---

## Phase 1 — Submission prep artifact index

**BDD expectation:** A local operator can find the latest safe demo prep pack and evidence paths without inspecting raw ignored artifact trees.

**Scope:**

- Formalize `artifacts/economic-demo-submission-prep/latest` as the local pointer.
- Add a tiny generator/checker if needed to verify referenced local paths exist.
- Keep generated prep packs ignored; commit only docs/scripts/tests if useful.

**Acceptance criteria:**

- The latest prep pack lists demo route, local evidence paths, CI proof chain, recording outline, and hard no-go list.
- Checker fails clearly if a referenced path is missing.
- No live calls or provider calls.

**Validation:**

- local checker/script test if added;
- `npm run test:bdd:index`;
- targeted lint/check;
- `git diff --check`.

**Retrospective prompt:** Did the prep artifact reduce ambiguity without exposing private/local logs?

**Expected next refinement:** If yes, surface a sanitized operator checklist in repo docs or UI. If not, revise the pack schema.

---

## Phase 2 — Demo operator checklist UI/docs

**BDD expectation:** The demo page or committed docs explain exactly what to click, what to say, and which proof chain to cite.

**Scope:**

- Add a committed checklist, or a compact `/economic-demo` operator panel if UI is more useful.
- Show the five-beat recording outline.
- Link to public PR/CI proof chain by identifiers, not private logs.
- Keep local ignored artifact paths as pointers only.

**Acceptance criteria:**

- Judge-facing language distinguishes controlled demo evidence, local Surfpool proof, storyboard-only proof, and future approval-gated live research/image generation.
- Page/docs load without live specialist calls, signing, wallet mutation, or provider requests.
- No private artifact contents are published.

**Validation:**

- targeted ESLint if UI changes;
- `npm run build` if UI changes;
- `npm run test:bdd:index`;
- `git diff --check`.

**Retrospective prompt:** Can Nissan record the demo from this checklist without needing hidden context from chat?

**Expected next refinement:** If yes, prepare capture rehearsal. If not, revise script and hierarchy.

---

## Phase 3 — Local capture rehearsal, dry-run only

**BDD expectation:** The demo can be rehearsed locally with deterministic, non-live proof and without fresh spend.

**Scope:**

- Run only safe local commands and app build/start/capture steps.
- Capture screenshots/log notes if useful under ignored artifacts.
- Confirm `/economic-demo#local-evidence-artifacts` renders the intended proof path.

**Acceptance criteria:**

- Rehearsal produces an ignored local artifact pack with timestamped notes/screenshots or a concise operator report.
- Any confusion or missing proof is recorded in the retrospective.
- No hosted/devnet/provider/signing/wallet/Coolify mutation.

**Validation:**

- local build/lint as needed;
- direct artifact inspection;
- secret grep if capture includes logs.

**Retrospective prompt:** Did the rehearsal reveal UI/script gaps that need a polish loop before submission?

**Expected next refinement:** If yes, open a focused polish phase. If no, move to final packaging.

---

## Phase 4 — Final judge/submission packet

**BDD expectation:** The submission packet can be handed to a judge or pasted into a form without unsupported claims.

**Scope:**

- Produce a concise public-safe summary: what is proven, what is simulated/local, what remains approval-gated.
- Include PR/CI proof chain and exact demo route.
- Include an explicit “not claimed” section for production settlement and real image generation.

**Acceptance criteria:**

- No secrets, private logs, or raw ignored artifact dumps.
- Claims match evidence exactly.
- Approval-gated next steps are separated from submitted proof.

**Validation:**

- doc inspection;
- secret/identifier sanity check;
- final retrospective.

**Retrospective prompt:** Is the packet honest, compelling, and safe enough to submit?

**Expected next refinement:** If Nissan wants a stronger proof category, ask for the exact approval gate (live research or real image generation) with provider/spend caps; otherwise stop.

---

## Running retrospectives

### Phase 0 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** Issue #228, this plan, and the Bucket J BDD scenario now make the loop durable: each phase must declare BDD expectation, scope, acceptance criteria, validation, evidence, and retrospective prompt before scope expands.
- **What failed or surprised us:** The first validation caught a trailing blank line in the feature file via `git diff --check`; the whitespace gate did its job before commit.
- **Safety/spend review:** Docs/BDD/status only. No live research, OpenAI/Fal image generation, paid provider calls, signing, wallet mutation, devnet transfer, or Coolify/env mutation.
- **Judge clarity:** Improved. The plan separates local proof, controlled demo evidence, storyboard-only proof, and approval-gated future work so the submission story stays honest.
- **Plan adjustment:** Phase 1 should stay local and add/check the submission prep artifact index before any UI/runtime polish. If the index is confusing or leaks too much local detail, revise the pack schema before moving to Phase 2.

### Phase 1 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** Added `check:economic-demo:submission-prep` so the ignored local prep pack can be validated without publishing its contents. The checker confirms required sections/guardrails and verifies referenced local evidence paths exist.
- **What failed or surprised us:** The existing `latest` symlink was broken because it pointed to `artifacts/economic-demo-submission-prep/...` from inside the same directory. The checker now falls back to the newest timestamped prep directory when `latest` is absent or broken. `git diff --check` also caught a trailing blank line in the BDD feature before commit.
- **Safety/spend review:** Local filesystem validation only. No hosted specialist calls, provider requests, signing, wallet mutation, devnet transfer, Coolify/env mutation, or paid spend.
- **Judge clarity:** Improved for operators: the prep pack now has a repeatable validation command before recording/submission, reducing reliance on chat memory.
- **Plan adjustment:** Phase 2 should surface a committed operator checklist or UI panel using sanitized claims, not raw ignored artifact contents. Keep the checker as a local preflight before any rehearsal.
