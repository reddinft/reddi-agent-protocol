# BDD Gap Closure Execution Plan (2026-04-19)

## Goal
Close highest-impact BDD build/testing gaps so submission claims are backed by active executable coverage.

## Scope
From `docs/BDD-COVERAGE-REVIEW-2026-04-19.md`.

## Phase P0 (completed)

### P0.1 Unskip critical onboarding scenarios ✅
Target file: `e2e/onboarding.spec.ts`

Covered:
1. Consent gating requires both checkboxes
2. Next advances to Runtime
3. Back returns to Consent
4. Runtime step Next disabled until runtime ready
5. Step 8 run button disabled with empty prompt

Verification:
- Targeted Playwright set green (5/5)

### P0.2 Add planner contract tests ✅
Added route-level tests:
1. `GET /api/planner/tools` manifest contract
2. `POST /api/planner/tools/resolve`
   - task required validation
   - no-candidate error path
   - success shape path

Verification:
- Jest suites green for new planner contract tests

### P0.3 Add endpoint security compatibility tests (Bucket D) ✅
Added tests verifying:
1. x402 public paths bypass token-gated proxy (`/v1/*`, `/x402/*`, `/healthz`)
2. non-public paths require token

Verification:
- `lib/__tests__/endpoint-security-compat.test.ts` green

## Phase P1 (completed)
1. ✅ E3 RPC config tests (env override + fallback)
2. ✅ H4.3 auditability contract coverage (settlement vs rating independently auditable)
3. ✅ E2.2 operator key rotation runbook + verification tests
4. ✅ Operator status route contract tests (`/api/onboarding/operator-key`, `/api/onboarding/attestation-operator`)

## Iteration loop (active)
For each iteration:
1. Review plan + open gaps.
2. Implement one slice.
3. Verify with explicit tests.
4. Run retrospective and amend plan/docs.

## Iteration 1 retrospective (completed)
- Changed: Step 8 onboarding harness moved from flaky to deterministic (`page.addInitScript` + storage seeding).
- Removed: `test.fixme` blocker for Step 8 disabled-run-button case.
- Verified: targeted onboarding Playwright set reached 5/5.

## Iteration 2 retrospective (completed)
- Added: Bucket B route-level discovery/ranking contract suite `lib/__tests__/registry-route.test.ts`.
- Covered:
  - Filters: `taskType`, `inputMode`, `privacyMode`, `runtimeCap`, `attested`, `health`
  - Sorts: `ranking`, `reputation`, `cost`, `feedback`
- Verified:
  - `npx jest lib/__tests__/registry-route.test.ts lib/__tests__/planner-resolve-route.test.ts --runInBand` → 8/8 passing

## Iteration 3 retrospective (completed)
- Added: default bridge-sort regression test `lib/__tests__/registry-bridge-sort.test.ts`.
- Covered: default ordering contract `attested > health > feedback` when no explicit `sortBy` is requested.
- Verified:
  - `npx jest lib/__tests__/registry-bridge-sort.test.ts lib/__tests__/registry-route.test.ts --runInBand` → 6/6 passing

## Iteration 4 retrospective (completed)
- Added: infra-backed integration-lane artifact runner `scripts/run-integration-lane.sh`.
- Wired: npm command `test:e2e:integration-lane` in `package.json`.
- Verified:
  - `npm run test:e2e:integration-lane` produced timestamped artifacts under `artifacts/integration-lane/*`.
  - Latest lane: 4 passed, 0 skipped, 0 failed (`20260419-130442/SUMMARY.md`).

## Iteration 5 retrospective (completed)
- Added: foundational scenario-ID map `docs/BDD-SCENARIO-ID-MAP.md` for Buckets A-H.
- Added: append-amended iteration journal `docs/BDD-ITERATION-LOG-2026-04-19.md` to preserve per-loop notes.
- Verified:
  - map includes all bucket sections (A-H) and explicit gap list.

## Iteration 6 retrospective (completed)
- Added: Bucket B tag-filter contract coverage in `lib/__tests__/registry-route.test.ts`.
- Implemented: `/api/registry` now supports `tag=<value>` and `tags=<csv>` query filters.
- Verified:
  - `npx jest lib/__tests__/registry-route.test.ts lib/__tests__/registry-bridge-sort.test.ts lib/__tests__/planner-resolve-route.test.ts --runInBand` → 10/10 passing.

## Iteration 7 retrospective (completed)
- Added: route-level unsupported-sort stability contract in `lib/__tests__/registry-route.test.ts`.
- Verified:
  - `npx jest lib/__tests__/registry-route.test.ts lib/__tests__/registry-bridge-sort.test.ts --runInBand` → 8/8 passing.
- Behavior locked: unknown `sortBy` values do not fail request and preserve incoming bridge order.

## Iteration 8 retrospective (completed)
- Added: executable freshness/latency ranking policy for Bucket B.
- Implemented in `/api/registry` ranking sort:
  1) `ranking_score` (desc),
  2) freshness (`health.lastCheckedAt`, desc),
  3) latency/cost proxy (`perCallUsd`, asc).
- Verified:
  - `npx jest lib/__tests__/registry-route.test.ts lib/__tests__/registry-bridge-sort.test.ts lib/__tests__/planner-resolve-route.test.ts --runInBand` → 12/12 passing.

## Iteration 9 retrospective (completed)
- Added: CI/nightly integration artifact retention hook via `.github/workflows/integration-lane-nightly.yml`.
- Workflow behavior:
  - schedule + manual dispatch
  - runs `npm run test:e2e:integration-lane`
  - uploads `artifacts/integration-lane/` (14-day retention)
- Verification:
  - workflow is present and wired to the integration-lane command surface.

## Iteration 10 retrospective (completed)
- Added: readiness telemetry in integration summary artifacts.
- `scripts/run-integration-lane.sh` now records:
  - Ollama status/model
  - validator status
  - Playwright infra hint line
- Verified:
  - `npm run test:e2e:integration-lane` → artifact `artifacts/integration-lane/20260419-160720/SUMMARY.md` with enriched readiness block.

## Iteration 11 retrospective (completed)
- Added: explicit model-source normalization telemetry in integration-lane artifacts.
- Summary now reports:
  - probe model,
  - test-selected model,
  - effective model,
  - source label (`probe|playwright`),
  - mismatch flag.
- Verified:
  - `npm run test:e2e:integration-lane` -> `artifacts/integration-lane/20260419-161403/SUMMARY.md`.

## Iteration 12 retrospective (completed)
- Started Gherkin extraction from scenario map with Bucket B feature file:
  - `docs/bdd/features/bucket-b-discovery.feature`
- Includes tagged scenarios: `@B2.1`, `@B2.2`, `@B2.3`, `@B2.default-order` mapped to existing route tests.
- Verified:
  - scenario tags present via `rg` check.

## Iteration 13 retrospective (completed)
- Added Bucket H Gherkin extraction:
  - `docs/bdd/features/bucket-h-consumer-orchestrator.feature`
- Verified:
  - scenario tags present via `rg`
  - mapped planner H-suite remains green:
    - `npx jest lib/__tests__/planner-register-consumer-route.test.ts lib/__tests__/planner-tools-manifest-route.test.ts lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-resolve-attestor-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-release-route.test.ts lib/__tests__/planner-signal-route.test.ts lib/__tests__/planner-auditability.test.ts --runInBand`
    - result: 8 suites, 16/16 passing

## Iteration 14 retrospective (completed)
- Added Bucket A Gherkin extraction:
  - `docs/bdd/features/bucket-a-onboarding.feature`
- Verified:
  - scenario tags present via `rg`
  - mapped operator/onboarding gates remain green:
    - `npx jest lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts --runInBand` -> 6/6
    - `npx playwright test e2e/onboarding.spec.ts --grep "consent gates|next button advances|back button returns|step 2 runtime — next is disabled|run button disabled when prompt is empty"` -> 5/5

## Iteration 15 retrospective (completed)
- Added Bucket D/E Gherkin extraction:
  - `docs/bdd/features/bucket-d-e-reliability.feature`
- Verified:
  - scenario tags present via `rg`
  - mapped D/E contract suites green:
    - `npx jest lib/__tests__/endpoint-security-compat.test.ts lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts lib/__tests__/program-rpc-config.test.ts --runInBand`
    - result: 4 suites, 11/11 passing

## Iteration 16 retrospective (completed)
- Added Bucket C Gherkin extraction:
  - `docs/bdd/features/bucket-c-planner-consumption.feature`
- Verified:
  - scenario tags present via `rg`
  - mapped C-suite contracts green:
    - `npx jest lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-signal-route.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-client.test.ts --runInBand`
    - result: 5 suites, 20/20 passing

## Iteration 17 retrospective (completed)
- Added Bucket F/G Gherkin extraction:
  - `docs/bdd/features/bucket-f-jupiter-settlement.feature`
  - `docs/bdd/features/bucket-g-torque-retention.feature`
- Verified:
  - tags present via `rg` checks
  - mapped F/G suites green:
    - `npx jest lib/__tests__/jupiter-client.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand` -> 25/25
    - `cd packages/x402-solana && npm test -- --runInBand tests/payment.test.ts` -> 19/19

## Iteration 18 retrospective (completed)
- Added: `docs/bdd/FEATURE-INDEX.md` linking each bucket feature file to mapped verification commands.
- Verified:
  - index references all current feature files (7/7 coverage).
  - `rg` + directory count cross-check confirms no missing bucket feature linkage.

## Iteration 19 retrospective (completed)
- Added BDD feature-index drift guard automation:
  - `scripts/check-bdd-feature-index.sh`
  - npm command `test:bdd:index`
- Verified:
  - `./scripts/check-bdd-feature-index.sh` -> OK
  - `npm run test:bdd:index` -> OK
- FEATURE-INDEX now includes the drift-guard command section.

## Iteration 20 retrospective (completed)
- Added PR-time CI enforcement for BDD index drift guard:
  - `.github/workflows/bdd-index-guard.yml`
- Workflow behavior:
  - triggers on pull requests touching `docs/bdd/**`, guard script, or package manifests
  - runs `npm run test:bdd:index`
- Verified:
  - local guard command remains green (`npm run test:bdd:index` -> OK)

## Iteration 21 retrospective (completed)
- Added one-command representative per-bucket sweep:
  - `scripts/run-bdd-bucket-sweep.sh`
  - npm command `test:bdd:sweep`
- Verified:
  - `npm run test:bdd:sweep` -> representative suites across buckets A-H all green
  - aggregate in run output: 19 suites, 80/80 tests passing
- FEATURE-INDEX updated with sweep command section.

## Iteration 22 retrospective (completed)
- Added CI/manual-dispatch BDD confidence lane for representative bucket sweep:
  - `.github/workflows/bdd-bucket-sweep-confidence.yml`
- Workflow behavior:
  - scheduled daily + manual dispatch
  - runs `npm run test:bdd:sweep` with non-blocking step semantics
  - uploads `bdd-bucket-sweep.log` artifact (14-day retention)
- Verified:
  - local sweep remains green (`npm run test:bdd:sweep`) -> 19 suites, 80/80 pass

## Iteration 23 retrospective (completed)
- Added structured sweep artifact generation in `run-bdd-bucket-sweep.sh`:
  - `artifacts/bdd-sweep/<timestamp>/SUMMARY.md`
  - `artifacts/bdd-sweep/<timestamp>/bdd-sweep.log`
  - `artifacts/bdd-sweep/<timestamp>/steps.tsv`
- Updated CI confidence lane to upload full sweep artifact directory:
  - `.github/workflows/bdd-bucket-sweep-confidence.yml` now uploads `artifacts/bdd-sweep/`.
- Verified:
  - `npm run test:bdd:sweep` generated summary artifact with per-step pass/fail table.

## Iteration 24 retrospective (completed)
- Added quick-status helper for latest sweep artifacts:
  - `scripts/bdd-sweep-latest-status.sh`
  - npm command `test:bdd:status`
- Verified:
  - `./scripts/bdd-sweep-latest-status.sh` outputs one-line status with timestamp, pass/total, fail count, and summary path
  - `npm run test:bdd:status` matches script output
- FEATURE-INDEX updated with status helper command.

## Next iteration candidates
1. Add CI step to print `test:bdd:status` after sweep for faster workflow log readability.
