# End-User Economic Workflow Demo — BDD Delivery Plan

_Date:_ 2026-05-04 AEST  
_Issue:_ #187  
_PR:_ #188  
_Status:_ Phase 0/1 started on `feature/end-user-economic-demo-187`

## Intended outcome

A judge can open one page, submit or select an end-user request, and watch Reddi Agent Protocol turn it into a visible agent economy:

1. request payload moves from user → orchestrator → specialists → attestors;
2. x402 challenge/payment/receipt evidence moves with each paid edge;
3. the final output is returned to the user;
4. the page shows starting balance, ending balance, and net delta for every participating wallet.

This is the north star. Any implementation phase that does not improve proof of payload flow, money flow, attestation, final output, or wallet impact should be treated as drift.

## Non-negotiable guardrails

- Devnet only for live economic runs.
- Fixture/dry-run phases must execute zero paid API calls and zero wallet mutations.
- Image generation is disabled unless `ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true`.
- Live image generation uses OpenAI first, Fal.ai fallback, through the adapter route only.
- No private keys, signer material, OpenAI/Fal keys, or payment secrets in UI, logs, fixtures, artifacts, or PR text.
- Live downstream specialist calls require exact endpoint allowlist, max call count, lamport cap, and bounded evidence artifact.
- No automatic spend retries.
- Each phase ends with reflection before expanding scope.

## Phase map

### Phase 0 — Planning contract and BDD scenarios

**Status:** complete in project plan; repo docs added in PR #188.

**Goal:** lock the end-user demo outcome and prevent drift.

**Acceptance criteria:**

- Three user scenarios are named: webpage, research article, picture.
- Demo evidence schema includes agents, edges, receipts, final output, and wallet balances.
- Reflection template exists.
- Picture case has explicit OpenAI/Fal adapter path and disabled-by-default guardrail.

**Validation:** direct doc inspection.

**Reflection prompt:** Did the plan preserve the economic proof, or just add another product demo?

---

### Phase 1 — Static economic fixture UI

**Status:** implemented in PR #188 (`/economic-demo`).

**Goal:** make the intended demo visible immediately without spend.

**Acceptance criteria:**

- `/economic-demo` renders all three scenarios.
- User request, orchestrator, specialists, attestors, payload edges, x402 amount placeholders, receipt placeholders, final output summary, and wallet balance deltas are visible.
- Fixture mode is clearly labeled as zero-spend.
- No network calls are required to render the page.

**Validation:**

- `npm run lint -- app/economic-demo/page.tsx lib/economic-demo/fixture.ts`
- `npm run build`

**Reflection prompt:** Is the static view understandable to a judge in under 30 seconds?

---

### Phase 2 — Gated image-generation adapter readiness

**Status:** implemented as disabled-by-default route in PR #188.

**Goal:** turn the picture case from “missing capability” into an explicit provider adapter path.

**Acceptance criteria:**

- `GET /api/economic-demo/image` reports readiness without exposing secrets.
- `POST /api/economic-demo/image` returns `403 image_generation_disabled` unless `ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true`.
- When enabled, provider selection is OpenAI first if configured, otherwise Fal.ai if configured.
- OpenAI model and Fal model are configurable by env.
- No provider is called during normal build/static demo.

**Validation:**

- targeted lint for route + adapter;
- `npm run build`;
- optional local readiness smoke with generation disabled.

**Reflection prompt:** Did we add capability without creating a hidden external-spend path?

---

### Phase 3 — Dry-run orchestrator integration

**Status:** next implementation phase.

**Goal:** replace fixture edges with real delegation plans while still executing zero downstream paid calls.

**Acceptance criteria:**

- User scenario maps to a consumer-capable orchestrator:
  - webpage → `agentic-workflow-system` or `planning-agent`;
  - research → `scientific-research-agent` or `agentic-workflow-system`;
  - picture → `tool-using-agent`.
- Orchestrator returns candidate specialist edges from the marketplace profile data.
- UI renders actual plan edges with candidate endpoint, wallet, price, and required attestors.
- `downstreamCallsExecuted` remains `0`.
- Ledger is labeled `planned`, not paid.

**Validation:**

- unit tests for scenario → plan mapping;
- route test for dry-run graph generation;
- build.

**Reflection prompt:** Are selected specialists explainable and aligned with the user task, or just hardcoded decorations?

---

### Phase 4 — Real devnet balance snapshots, no spend

**Status:** pending.

**Goal:** prove the wallet ledger plumbing against live devnet balances before payments.

**Acceptance criteria:**

- Before/after balance fetch works for all wallets in a dry-run plan.
- Deltas remain zero in no-spend mode.
- RPC failures fail soft with explicit `balance_unavailable` markers.
- No private signer access is required.

**Validation:**

- route tests with mocked RPC;
- one manual devnet snapshot smoke if RPC available;
- build.

**Reflection prompt:** Does the ledger use real wallet addresses and balances, or fixture economics?

---

### Phase 5 — One live x402 specialist edge

**Status:** pending; requires explicit go decision before execution.

**Goal:** execute exactly one paid devnet specialist edge and show the resulting economic delta.

**Recommended first edge:** `agentic-workflow-system` → `code-generation-agent` for the webpage case.

**Acceptance criteria:**

- Exact endpoint allowlist contains only the selected specialist endpoint.
- `MAX_DOWNSTREAM_CALLS=1`.
- Lamport cap enforced.
- x402 challenge/payment/receipt or fail-closed reason captured.
- Before/after balances are captured for payer and payee.
- No automatic retry.

**Validation:**

- tests proving non-allowlisted endpoints fail before payment;
- one bounded private devnet smoke with artifact;
- reflection before any second live edge.

**Reflection prompt:** Did the run produce real economic evidence, or just reach a protected endpoint?

---

### Phase 6 — Multi-edge webpage workflow with attestation

**Status:** pending.

**Goal:** complete the most demo-friendly workflow end-to-end.

**Acceptance criteria:**

- Webpage request triggers 2–3 specialist calls plus one attestor call.
- Final output is a page/spec/code artifact.
- UI shows receipt chain and balance deltas for each participant.
- Attestor recommendation is visible: release, refund, or dispute.
- Evidence artifact is downloadable/savable.

**Validation:** bounded devnet run + evidence artifact inspection.

**Reflection prompt:** Is the final output useful enough to justify the economic path shown?

---

### Phase 7 — Research article workflow with evidence/attestation

**Status:** pending.

**Goal:** prove a non-code knowledge workflow with citations/evidence caveats.

**Acceptance criteria:**

- Research request triggers retrieval/synthesis/drafting/review roles.
- Final output includes citations or explicit evidence caveats.
- Explainability and verification attestors are represented.
- Ledger and receipts show all paid edges.

**Validation:** bounded devnet run + evidence artifact inspection.

**Reflection prompt:** Are citations/evidence meaningful, or is the article just fluent text?

---

### Phase 8 — Picture workflow with OpenAI/Fal adapter + vision validation

**Status:** pending; requires image-generation env enablement and cost approval.

**Goal:** produce an actual image, then pay/route validation work.

**Acceptance criteria:**

- Image generation goes through `/api/economic-demo/image` only.
- Provider is recorded as OpenAI or Fal.ai with model name.
- Generated image URL/data is displayed or safely persisted as an artifact.
- `vision-language-agent` validates against the prompt.
- `verification-validation-agent` attests the run.
- Ledger includes adapter/specialist/attestor deltas.

**Validation:** one bounded image-generation run + artifact inspection.

**Reflection prompt:** Did image generation stay inside the economic protocol story, or become a disconnected API demo?

---

### Phase 9 — Evidence pack, judge script, and regression sweep

**Status:** pending.

**Goal:** make the demo repeatable and reviewable.

**Acceptance criteria:**

- Evidence pack links latest fixture, dry-run, balance, and live artifacts.
- Judge walkthrough script explains the three scenarios and guardrails.
- BDD feature index includes this demo bucket.
- Representative tests/build pass.
- Known gaps are explicit.

**Validation:** `npm run test:bdd:index`, targeted tests, `npm run build`, manual page inspection.

**Reflection prompt:** Can a fresh reviewer understand what is real, what is fixture, and what remains gated?

## Iteration reflection template

Append this after each phase/loop in the PR or repo iteration log:

```md
## Phase N reflection — <name>

**Date:** YYYY-MM-DD AEST  
**Scope shipped:**  
**BDD scenarios touched:**  
**Validation:**  
**Result:** PASS / PARTIAL / FAIL / BLOCKED  
**Evidence artifacts:**

### What worked

### What failed or surprised us

### Drift check

Did this phase improve at least one intended outcome: payload flow, money flow, attestation, final output, wallet impact?

### Next phase adjustment

### Decision log additions
```

## Current next action

Proceed to **Phase 3 — Dry-run orchestrator integration** after PR #188 review/merge or continue in the same PR if speed is more important than PR size.

## Phase 0/1/2 reflection — initial plan, fixture UI, gated image adapter

**Date:** 2026-05-04 AEST  
**Scope shipped:** delivery plan, BDD feature bucket, static `/economic-demo` fixture, disabled-by-default OpenAI/Fal image adapter route.  
**BDD scenarios touched:** static fixture, disabled image generation gate, OpenAI/Fal adapter readiness.  
**Validation:** `npm run test:bdd:index`; targeted lint for economic demo files; `npm run build`.  
**Result:** PASS  
**Evidence artifacts:** PR #188, commits `7a442cba`, `e54e8d4c`, plus this docs update.

### What worked

The phases now separate fixture storytelling, dry-run planning, balance plumbing, live x402 edges, multi-edge workflows, image generation, and evidence-pack work. That should make progress reviewable instead of letting the demo sprawl.

### What failed or surprised us

The picture case looked like a capability gap until we reframed it as a gated provider adapter. OpenAI and Fal.ai can both fit, but only if the adapter remains explicit and disabled by default.

### Drift check

This phase improves payload flow, money-flow explanation, final-output framing, and wallet-impact visualization. It does not yet prove real paid flow; that starts at Phase 5.

### Next phase adjustment

Phase 3 should not add live calls. It should replace hardcoded fixture edges with real dry-run plans selected from marketplace profile/capability metadata.

### Decision log additions

- Add Bucket J for end-user economic demo tracking.
- Treat `/economic-demo` as the judge-facing proof surface for the remaining live-delegation work.
- Treat image generation as an adapter/tool edge owned by `tool-using-agent`, not as an untracked external shortcut.
