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

### Phase 3 implementation reflection — dry-run endpoint evidence slice B

**Date:** 2026-05-04 AEST  
**Scope shipped:** Promoted all-30 hosted smoke endpoint evidence into committed public-data helper and removed naming-convention fallback from dry-run planning.  
**BDD scenarios touched:** Dry-run orchestration builds a real planned economic graph.  
**Validation:** `npx jest lib/__tests__/economic-demo-dry-run.test.ts --runInBand`; targeted lint; `npm run build`.  
**Result:** PASS.
**Evidence artifacts:** `lib/economic-demo/openrouter-endpoints.ts` generated from local public smoke artifact `artifacts/openrouter-specialists-all30-hosted-smoke-20260504.json`.

#### What worked

Dry-run planning now requires smoke-proven endpoint evidence for every selected specialist. Tests assert the evidence covers exactly all 30 specialist profiles and that each endpoint is a chat-completions endpoint.

#### What failed or surprised us

One assumption was corrected by evidence: `agentic-workflow-system` is deployed at `reddi-agentic-workflow-system.preview.reddi.tech`, not the shorter derived hostname. This validates the need for committed endpoint evidence before later phases.

#### Drift check

This improves payload flow accuracy and keeps the planned graph aligned with deployed infrastructure. Still zero spend.

#### Next phase adjustment

Phase 4 can now fetch balances against wallet addresses from the smoke-proven profile/evidence map. The next step should add balance snapshot types/route/tests with mocked RPC first, then one optional live devnet read-only smoke.

#### Decision log additions

- Dry-run endpoint resolution must fail closed if a profile lacks committed hosted endpoint evidence.
- Do not use naming-convention-derived endpoints for live or rehearsal planning.

## Phase 4 implementation reflection — read-only balance snapshot slice A

**Date:** 2026-05-04 AEST  
**Scope shipped:** Added read-only balance snapshot builder, API route, and mocked-RPC unit tests.  
**BDD scenarios touched:** Real devnet balance snapshots, no spend.  
**Validation:** `npx jest lib/__tests__/economic-demo-balances.test.ts lib/__tests__/economic-demo-dry-run.test.ts --runInBand`; targeted lint; `npm run build`.  
**Result:** PASS for mocked-RPC slice A.
**Evidence artifacts:** `lib/economic-demo/balances.ts`, `app/api/economic-demo/balances/route.ts`, `lib/__tests__/economic-demo-balances.test.ts`.

### What worked

The balance report is read-only, deduplicates orchestrator/specialist wallets, preserves `downstreamCallsExecuted: 0`, and fails soft per wallet with `balance_unavailable` instead of breaking the whole report.

### What failed or surprised us

The picture workflow currently includes `tool-using-agent` as both orchestrator and planned adapter orchestrator edge, so wallet deduplication matters. The report correctly snapshots the wallet once.

### Drift check

This improves wallet-impact proof while remaining no-spend. It does not yet compare before/after deltas because no local transfers occur until the Surfpool phase.

### Next phase adjustment

Add UI rendering for the read-only balance snapshot and optionally run one live devnet read-only smoke. Then proceed to Surfpool rehearsal design with deterministic local wallets.

### Decision log additions

- Balance snapshot failures are per-wallet soft failures, not whole-demo failures.
- Balance snapshot mode must always report zero downstream calls and no transfer attempts.

### Phase 4 implementation reflection — balance snapshot UI slice B

**Date:** 2026-05-04 AEST  
**Scope shipped:** Added `/economic-demo` UI control and render panel for read-only balance snapshots.  
**BDD scenarios touched:** Real devnet balance snapshots, no spend.  
**Validation:** focused Jest for balances + dry-run; targeted lint; `npm run build`.  
**Result:** PASS.
**Evidence artifacts:** `/economic-demo` now has `Read devnet balances` action and a read-only snapshot panel.

#### What worked

The UI now distinguishes fixture ledger economics from live read-only balance reads. Snapshot rendering explicitly says no transfers were attempted and shows `downstreamCallsExecuted: 0`.

#### What failed or surprised us

The balance UI can expose RPC availability issues. That is useful, but we should avoid treating RPC read failures as economic failures; the route already marks them per-wallet.

#### Drift check

Improves wallet-impact visibility without spend. Still not transfer proof; Surfpool remains the transfer-semantics gate.

#### Next phase adjustment

Run/record an optional live read-only devnet balance smoke or proceed directly into Surfpool rehearsal implementation if CI is green and the preview page is enough for review.

#### Decision log additions

- Fixture ledger and read-only live balance panel are separate proof layers.
- Read-only devnet balance reads are allowed; they are not payment execution.

## Phase 5 implementation reflection — Surfpool/local rehearsal plan slice A

**Date:** 2026-05-04 AEST  
**Scope shipped:** Added deterministic Surfpool/local rehearsal planning layer, API route, UI panel, and unit tests.  
**BDD scenarios touched:** Surfpool/local-validator rehearsal with local wallets and positive/negative balance-delta proof.  
**Validation:** `npx jest lib/__tests__/economic-demo-surfpool-rehearsal.test.ts lib/__tests__/economic-demo-balances.test.ts lib/__tests__/economic-demo-dry-run.test.ts --runInBand`; targeted lint; `npm run build`.  
**Result:** PASS.
**Evidence artifacts:** `lib/economic-demo/surfpool-rehearsal.ts`, `app/api/economic-demo/surfpool-rehearsal/route.ts`, `lib/__tests__/economic-demo-surfpool-rehearsal.test.ts`, `/economic-demo` Surfpool rehearsal panel.

### What worked

The demo now has a third proof layer after fixture ledger and read-only devnet balances: deterministic local-wallet transfer semantics for Surfpool rehearsal. The report proves planned paid edges debit the orchestrator and credit specialists by equal totals, while blocked not-allowlisted/over-budget transfers produce zero delta.

### What failed or surprised us

This is still an expected-ledger rehearsal plan, not a live Surfpool transaction artifact. That is intentional for slice A, but the next slice needs an executable smoke harness or artifact adapter so judges can see actual local transaction signatures.

### Drift check

Still zero devnet spend and zero downstream specialist calls. Phase 5 has started safely without jumping to live x402.

### Next phase adjustment

Slice B should bind this rehearsal plan to an executable Surfpool/local transaction smoke and capture a bounded artifact with local tx signatures, before/after balances, and blocked-transfer no-delta proof. If existing escrow smoke can be reused, prefer adapting it rather than creating parallel settlement logic.

### Decision log additions

- Surfpool rehearsal has two sub-slices: expected-ledger plan first, executable local transaction artifact second.
- Negative proof remains mandatory before any live specialist edge: non-allowlisted and over-budget attempts must show zero local-wallet delta.

## Phase 5 implementation reflection — Surfpool/local transaction smoke slice B

**Date:** 2026-05-04 AEST  
**Scope shipped:** Added executable Surfpool/offline local-validator smoke for the webpage rehearsal path.  
**BDD scenarios touched:** Surfpool/local-validator rehearsal with real local SOL transfers and negative no-delta proof.  
**Validation:** `npm run smoke:economic-demo:surfpool`; targeted script lint; `npm run build`.  
**Result:** PASS.
**Evidence artifact:** `artifacts/economic-demo-surfpool-rehearsal/20260504T074918Z/summary.json` (git-ignored local artifact).

### What worked

The smoke starts Surfpool offline, derives deterministic in-memory local wallets, airdrops local SOL to the orchestrator, executes four local SOL transfers from `agentic-workflow-system` to webpage specialists, and captures real local transaction signatures. The positive proof shows credited lamports exactly match transfer amount; orchestrator debit is larger by local fees, as expected. Negative proof records not-allowlisted and over-budget attempts as not executed with zero blocked delta.

### What failed or surprised us

The first smoke run produced the artifact but hung during Surfpool child cleanup. The script was fixed to wait for process exit and escalate to SIGKILL after a short grace period. The second run exited cleanly.

### Drift check

Still no devnet mutation and no downstream specialist HTTP calls. This satisfies the local transfer-semantics gate before any live x402 edge.

### Next phase adjustment

Phase 6 can now be scoped as one controlled live x402 specialist edge, but it should consume the same proof structure: pre-balance snapshot, exact allowlisted endpoint, one payment attempt, receipt/402-or-success artifact, post-balance snapshot, and rollback/no-second-call proof. If a valid payment provider is not configured, capture challenge semantics and stop rather than retrying.

### Decision log additions

- Local Surfpool transaction proof may include expected fee delta; positive proof should require specialist credits equal planned transfers and orchestrator debit covering transfers plus fees.
- Child process cleanup is part of the smoke acceptance gate; hung cleanup is a failed harness even if transfers succeeded.
