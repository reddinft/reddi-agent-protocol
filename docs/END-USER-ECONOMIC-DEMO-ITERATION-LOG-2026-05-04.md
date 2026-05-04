# End-User Economic Workflow Demo — BDD Iteration Log

_Date started:_ 2026-05-04 AEST  
_Plan:_ `docs/END-USER-ECONOMIC-DEMO-DELIVERY-PLAN-2026-05-04.md`  
_Feature:_ `docs/bdd/features/bucket-j-end-user-economic-demo.feature`  
_Issue:_ #187  
_PR:_ #188

## Loop rules

Each phase follows:

```text
scope slice → BDD scenario/check → implementation → validation → retrospective → refine next phase
```

Do not expand from fixture/dry-run to live spend without a completed retrospective and explicit next-phase go decision.

## Phase 0/1/2 — Plan, fixture UI, gated image adapter

**Date:** 2026-05-04 AEST  
**Scope shipped:** Static `/economic-demo` page, OpenAI/Fal image adapter route disabled by default, delivery plan and Bucket J BDD feature.  
**BDD scenarios touched:** static fixture, image disabled gate, OpenAI/Fal adapter readiness.  
**Validation:** `npm run test:bdd:index`; targeted lint; `npm run build`.  
**Result:** PASS  
**Evidence artifacts:** commits `7a442cba`, `e54e8d4c`, `9a568adf`.

### What worked

The demo now has a visible judge-facing proof surface and a disabled-by-default image adapter path without external spend.

### What failed or surprised us

The phrase “one live x402 specialist edge” was ambiguous and sounded like only one specialist was live. Nissan caught this; the plan was corrected to say first controlled live edge against the already deployed 30-agent network.

### Drift check

Improved payload flow, money-flow visualization, final-output framing, and wallet impact. No live economic proof yet.

### Next phase adjustment

Before live devnet edges, add Surfpool/local-validator rehearsal to prove real SOL transfer semantics safely.

### Decision log additions

- `/economic-demo` is the judge-facing proof surface.
- Image generation is an explicit adapter edge, not an untracked API shortcut.
- Surfpool rehearsal is mandatory before devnet live payment expansion.

## Phase 5 planning addendum — Surfpool rehearsal gate

**Date:** 2026-05-04 AEST  
**Scope shipped:** Phase 5 inserted into plan and Bucket J scenario.  
**Validation:** `npm run test:bdd:index`; `git diff --check`.  
**Result:** PASS  
**Evidence artifacts:** commit `6c1147ac`.

### What worked

The local-validator rehearsal makes the money-transfer proof safer and more convincing before a real devnet run.

### What failed or surprised us

The phase order needed adjustment: balance snapshots alone are insufficient before live devnet execution; we need local transfer semantics first.

### Drift check

Improves money-flow and wallet-impact proof directly.

### Next phase adjustment

Proceed to Phase 3 dry-run orchestrator integration, then Phase 4 balance snapshots, then Phase 5 Surfpool rehearsal.

### Decision log additions

- Surfpool/local validator is the required dress rehearsal environment for full transfer semantics.
- Negative path must prove over-budget/non-allowlisted calls produce zero balance delta.

## Phase 3 — Dry-run orchestrator integration

**Status:** in progress.

### Phase 3 implementation reflection — dry-run orchestrator integration slice A

**Date:** 2026-05-04 AEST  
**Scope shipped:** Added dry-run economic planner, API route, UI button/render path, and unit coverage.  
**BDD scenarios touched:** Dry-run orchestration builds a real planned economic graph.  
**Validation:** `npx jest lib/__tests__/economic-demo-dry-run.test.ts --runInBand`; targeted lint; `npm run build`.  
**Result:** PASS for slice A.
**Evidence artifacts:** `lib/economic-demo/dry-run.ts`, `app/api/economic-demo/dry-run/route.ts`, `lib/__tests__/economic-demo-dry-run.test.ts`, `/economic-demo` dry-run graph button.

#### What worked

The page can now ask the app for a dry-run economic graph. Plans are built from the deployed 30-profile specialist catalog metadata: orchestrator, downstream specialist IDs, wallets, endpoint URLs, prices, and required attestors. The route guarantees `downstreamCallsExecuted: 0`.

#### What failed or surprised us

The repo's exact endpoint enrichment map only covers the first five in committed code. For non-first-five profiles, this slice derives URLs from the deployed naming convention. That is acceptable for dry-run visualization, but Phase 3 slice B should promote the all-30 endpoint map/evidence into a committed public-data artifact or helper so dry-run plans use exact smoke-proven endpoints for every profile.

#### Drift check

This improves payload flow and planned money flow without introducing spend. It does not yet prove wallet balances or transfers.

#### Next phase adjustment

Before Phase 4 balance snapshots, add Phase 3 slice B: exact all-30 endpoint evidence map + UI plan/fixture reconciliation so the dry-run graph and static ledger cannot drift apart.

#### Decision log additions

- Phase 3 remains zero-spend: no x402 payment header generation and no downstream fetch.
- Dry-run graph should become evidence-backed by all-30 hosted smoke data before live edges.
