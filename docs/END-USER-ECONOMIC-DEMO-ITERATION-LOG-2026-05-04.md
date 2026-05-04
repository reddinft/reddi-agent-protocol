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

## Phase 6 implementation reflection — first controlled live x402 edge smoke

**Date:** 2026-05-04 AEST
**Scope executed:** Ran the existing gated private live executor smoke against the exact allowlisted deployed `code-generation-agent` endpoint.
**Command:** `LIVE_DELEGATION_SMOKE_MODE=live LIVE_DELEGATION_SMOKE_CONFIRM=RUN_PRIVATE_DEVNET_SMOKE LIVE_DELEGATION_SMOKE_OUT=artifacts/economic-demo-phase6-live-edge-20260504.json npm run delegation:private-smoke --prefix packages/openrouter-specialists`
**Result:** PASS for controlled one-call live edge attempt; downstream returned expected x402 HTTP 402 rather than a paid completion.
**Evidence artifact:** `artifacts/economic-demo-phase6-live-edge-20260504.json` (git-ignored local artifact).

### What worked

The smoke executed exactly one downstream HTTPS call to `https://reddi-code-generation.preview.reddi.tech/v1/chat/completions`, selected `code-generation-agent`, preserved the exact endpoint allowlist, and recorded `downstreamCallsExecuted: 1`. Rollback proof also passed: missing payment provider produced `payment_provider_missing` with zero downstream calls.

### What failed or surprised us

This is a live x402 challenge/edge attempt, not a paid successful completion. The downstream response was `402 application/json; charset=utf-8`, which means the deployed x402 gate is reachable and enforcing payment, but a valid devnet payment provider/signing path is still needed before we can claim a paid specialist response.

### Drift check

No signer material was used, no signature was attempted, no devnet transfer executed, no Coolify changes occurred, and no second downstream call was made. This remains inside the controlled live-edge boundary.

### Next phase adjustment

Before Phase 7 multi-edge webpage workflow, add or configure a valid devnet payment-provider path for exactly one specialist edge. If payment provider remains unavailable, keep the demo honest: show live x402 challenge enforcement plus Surfpool transfer semantics, and mark paid completion as blocked on signer/payment-provider wiring.

### Decision log additions

- Phase 6 acceptance splits into two states: live x402 challenge reached (done) vs paid specialist completion (blocked until valid devnet payment provider/signing path exists).
- Do not retry live edges repeatedly while payment provider is unavailable; the one-call proof is enough until the payment path is configured.

## Phase 6 implementation reflection — paid-retry readiness probe

**Date:** 2026-05-04 AEST
**Scope executed:** Added and ran a bounded live x402 readiness probe that captures the unpaid challenge and makes one demo-paid retry using the challenge nonce.
**Command:** `ECONOMIC_DEMO_LIVE_X402_CONFIRM=RUN_ECONOMIC_DEMO_LIVE_X402_READINESS ECONOMIC_DEMO_LIVE_X402_PAID_RETRY=1 npm run smoke:economic-demo:live-x402-readiness`
**Result:** PASS for blocker identification; paid completion remains blocked by deployed config.
**Evidence artifact:** `artifacts/economic-demo-live-x402-readiness/20260504T081222Z/summary.json` (git-ignored local artifact).

### What worked

The deployed `code-generation-agent` returned a canonical x402 challenge with network `solana-devnet`, payee wallet `8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To`, amount `0.05`, currency `USDC`, exact endpoint match, and nonce present. The readiness harness then made exactly one paid retry with `demo:<challengeNonce>`.

### What failed or surprised us

The paid retry returned HTTP 402 with `demo_payment_disabled`. This is a better blocker than the prior generic payment-provider gap: the deployed specialist intentionally does not accept demo receipts. Real receipt verification is not implemented in the runtime yet, so the next safe path is either enable demo payment only for the controlled demo deployment or implement a real devnet receipt verifier.

### Drift check

The probe made two bounded downstream calls total, used no signer material, attempted no signature, executed no devnet transfer from the harness, and made no Coolify changes.

### Next phase adjustment

Do not keep probing the live endpoint. The next implementation loop should add a fail-closed payment-mode readiness surface that tells the UI/operator exactly why paid completion is blocked (`demo_payment_disabled` vs real verifier unavailable), then choose one deliberate route: controlled demo receipts for the judge demo, or real devnet receipt verification.

### Decision log additions

- Current paid-completion blocker is `demo_payment_disabled` on the deployed specialist runtime.
- A valid challenge is already emitted for USDC-on-devnet; the missing piece is accepted receipt verification, not endpoint discovery.

## Phase 6 implementation reflection — payment readiness UI/API

**Date:** 2026-05-04 AEST
**Scope shipped:** Added a fail-closed payment-readiness API and UI panel for the economic demo.
**BDD scenarios touched:** Judge-facing evidence must show why paid completion is blocked instead of hiding it behind a generic failure.
**Validation:** focused Jest 9/9 PASS; targeted lint PASS; `npm run build` PASS.
**Result:** PASS.
**Evidence artifacts:** `lib/economic-demo/payment-readiness.ts`, `app/api/economic-demo/payment-readiness/route.ts`, `lib/__tests__/economic-demo-payment-readiness.test.ts`, `/economic-demo` payment readiness panel.

### What worked

The UI now clearly separates three states: live x402 challenge is reachable, paid retry was attempted once, and paid completion is blocked because deployed runtime rejects demo receipts with `demo_payment_disabled`. This avoids the judge seeing a silent broken button or ambiguous payment failure.

### What failed or surprised us

The proof is evidence-backed but static until the operator intentionally reruns the readiness smoke. That is deliberate to avoid accidental live retries from the webpage.

### Drift check

No live request is triggered by loading the page. The panel only exposes the latest recorded readiness state and the next two implementation options.

### Next phase adjustment

Proceed by implementing one of two explicit paths: controlled demo receipt enablement for judge demo, or real devnet receipt verification. Recommendation for speed: controlled demo receipts on demo deployment only, with visible labeling and fail-closed production default.

### Decision log additions

- The economic demo UI must show payment-readiness blockers explicitly.
- Live retry remains operator-script-only; the webpage must not trigger live x402 probes automatically.

## Phase 6/7 transition reflection — controlled paid completion and multi-edge webpage proof

**Date:** 2026-05-04 AEST
**Scope shipped:** Enabled controlled demo receipt mode for the webpage path, fixed the unavailable OpenRouter model slug for `code-generation-agent`, and reached controlled demo-paid completions across planning, content, code, and verification specialists.
**BDD scenarios touched:** Webpage demo composes specialists and attestation with bounded paid edges.
**Validation:** PR #195, #196, and #197 checks green; `npm run smoke:economic-demo:live-x402-readiness`; `npm run smoke:economic-demo:webpage-live-x402-workflow`.
**Result:** PASS.
**Evidence artifacts:** `artifacts/economic-demo-live-x402-readiness/20260504T085951Z/summary.json`; `artifacts/economic-demo-webpage-live-x402-workflow/20260504T093552Z/summary.json`.

### What worked

The economic workflow is now real enough to prove the core judge thesis: one user request can become multiple x402-gated specialist calls, each with an unpaid challenge and a controlled demo-paid completion. Passing prior outputs into the verification edge made the attestor response meaningfully inspect the workflow instead of asking for missing context.

### What failed or surprised us

The first paid retry after enabling demo receipts hit HTTP 502 because OpenRouter rejected the stale `anthropic/claude-3.5-sonnet` slug. Fixing the slug to `openai/gpt-4.1-mini` unblocked the path. This means model availability is now part of payment-readiness, not just a model-quality concern.

### Drift check

This improves payload flow, payment/challenge flow, final output, and attestation. It does **not** prove production USDC settlement; receipts are controlled demo receipts and must remain labeled as such.

### Next phase adjustment

Before expanding to research or picture workflows, surface the latest multi-edge evidence directly in `/economic-demo` and then generate a judge-facing evidence pack. The UI must not trigger live retries.

### Decision log additions

- Controlled demo receipts are acceptable for judge demo proof only when clearly labeled.
- Model endpoint availability belongs in readiness gates.
- Multi-edge evidence should be UI-visible before adding more live workflow categories.

## Phase 7A implementation plan — surface multi-edge live evidence

**Status:** in progress.
**Roadmap:** `docs/ECONOMIC-DEMO-BDD-ITERATIVE-ROADMAP-2026-05-04.md`

### Scope slice

Add a sanitized evidence summary helper, API route, and `/economic-demo` panel for the latest controlled multi-edge webpage run.

### BDD check

A judge can click one button and see: 4 specialist edges, 4 unpaid HTTP 402 challenges, 4 controlled demo-paid HTTP 200 completions, total bounded calls, guardrails, and the controlled-demo limitation.

### Validation target

- focused Jest for evidence summary;
- targeted lint;
- `npm run build`.

### Retrospective gate

After validation, decide whether the next loop should be evidence-pack generation or more UI clarity work.

### Phase 7A implementation reflection — multi-edge evidence UI/API

**Date:** 2026-05-04 AEST
**Scope shipped:** Added typed sanitized evidence summary, `/api/economic-demo/webpage-live-workflow`, and `/economic-demo` panel for the latest controlled multi-edge webpage run.
**BDD scenarios touched:** Webpage multi-edge workflow with visible x402 challenge/payment evidence and attestation summary.
**Validation:** `npx jest --runTestsByPath lib/__tests__/economic-demo-webpage-live-workflow-evidence.test.ts lib/__tests__/economic-demo-payment-readiness.test.ts`; targeted lint; `npm run build`.
**Result:** PASS.
**Evidence artifacts:** `lib/economic-demo/webpage-live-workflow-evidence.ts`, `app/api/economic-demo/webpage-live-workflow/route.ts`, `/economic-demo` multi-edge evidence panel.

#### What worked

The judge-facing page can now show the latest multi-edge proof without sending live requests. It summarizes the four specialist edges, their HTTP 402 x402 challenges, HTTP 200 controlled demo-paid completions, outputs, and guardrails in one place.

#### What failed or surprised us

The evidence is intentionally a sanitized static summary, not a raw artifact loader. That keeps the UI safe and stable, but the next evidence-pack phase should make the source artifact and derived summary relationship more formal.

#### Drift check

This improves judge clarity and keeps live-spend safety intact: loading the panel performs no specialist calls, no signing, and no devnet transfers. It still does not prove production settlement verification.

#### Next phase adjustment

Proceed to Phase 7B: generate a judge-facing evidence pack from the latest multi-edge smoke artifact, with a human-readable markdown summary and secret scan. Include the controlled-demo receipt limitation prominently.

#### Decision log additions

- UI evidence panels should consume sanitized summaries, not raw live artifact blobs.
- Evidence-pack generation is now the next loop before research/picture expansion.

## Phase 7B implementation reflection — judge-facing evidence pack generator

**Date:** 2026-05-04 AEST
**Scope shipped:** Added a local evidence-pack generator for the latest multi-edge webpage live x402 workflow artifact.
**BDD scenarios touched:** Judge can inspect one bounded public evidence packet for request → specialist payload flow → x402 challenge/payment status → attestation summary → guardrails.
**Validation:** `npm run evidence:economic-demo:webpage`; generated secret scan PASS; targeted script lint PASS with package.json ignored warning only; `npm run build` PASS.
**Result:** PASS.
**Evidence artifacts:** `artifacts/economic-demo-evidence-pack/20260504T103840Z/evidence-pack.json`, `artifacts/economic-demo-evidence-pack/20260504T103840Z/EVIDENCE.md`, `artifacts/economic-demo-evidence-pack/20260504T103840Z/SECRET-SCAN.json`.

### What worked

The pack turns raw smoke JSON into judge-readable proof: 4 specialist edges, 4 HTTP 402 x402 challenges, 4 controlled demo-paid HTTP 200 completions, payee wallets, USDC challenge amounts, output previews, and guardrails. The script also runs a local secret scan before declaring success.

### What failed or surprised us

The pack is intentionally generated under git-ignored `artifacts/`, so it is not committed by default. That is good for avoiding stale or oversized evidence blobs, but the UI still needs a stable way to reference or regenerate the latest pack for judges.

### Drift check

This improves judge clarity and evidence portability without adding live calls or spend. It still clearly states controlled demo receipts are not production USDC settlement verification.

### Next phase adjustment

Proceed to Phase 7C: ledger reconciliation. It should total the x402 challenge amounts, distinguish controlled-demo receipts from real settlement, and link the money-flow story back to Surfpool/local transfer proof.

### Decision log additions

- Evidence packs are generated artifacts, not committed source truth.
- Secret scan is mandatory for every public evidence pack.
- Next UI work should reconcile challenge amounts and receipt mode before expanding to research/picture workflows.

## Phase 7C implementation reflection — ledger reconciliation

**Date:** 2026-05-04 AEST
**Scope shipped:** Added ledger reconciliation helper, API route, unit test, and `/economic-demo` panel that bridges controlled x402 receipts to Surfpool/local transfer semantics.
**BDD scenarios touched:** Judge can distinguish x402 challenge/payment evidence, controlled demo receipt completion, local transfer-semantics proof, and not-yet-implemented real devnet receipt verification.
**Validation:** `npx jest --runTestsByPath lib/__tests__/economic-demo-ledger-reconciliation.test.ts lib/__tests__/economic-demo-webpage-live-workflow-evidence.test.ts`; targeted lint; `npm run build`.
**Result:** PASS.
**Evidence artifacts:** `lib/economic-demo/ledger-reconciliation.ts`, `app/api/economic-demo/ledger-reconciliation/route.ts`, `lib/__tests__/economic-demo-ledger-reconciliation.test.ts`, `/economic-demo` ledger reconciliation panel.

### What worked

The UI now states the money-flow story honestly: x402 challenges total `0.13 USDC`, controlled demo receipts satisfied 4/4 completions, real settlements verified remain 0, and Surfpool/local proof covers 3,500,000 lamports of transfer semantics. This makes the difference between challenge/payment gating and production settlement explicit instead of hand-wavy.

### What failed or surprised us

The live x402 challenge amounts are denominated as USDC while Surfpool local rehearsal uses SOL lamports for transfer semantics. The reconciliation has to show them as separate proof layers rather than pretending they are the same unit.

### Drift check

This improves money-flow honesty and judge clarity without live calls, signing, or devnet transfer from the UI. It still does not implement real devnet receipt verification.

### Next phase adjustment

Now that webpage proof is judge-readable and financially reconciled, choose between: (A) research workflow expansion using the same controlled-demo pattern, or (B) real devnet receipt verifier design. Recommendation: do Phase 8A research workflow design next for breadth, unless judging feedback demands production settlement semantics first.

### Decision log additions

- Never equate Surfpool SOL transfer semantics with live USDC challenge settlement; show them as separate proof layers.
- Controlled demo receipt count and real settlement verified count must both be visible.
- Phase 8A should reuse the reconciliation pattern for research if we expand breadth.
