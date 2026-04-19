# BDD Iteration Log — 2026-04-19

This log is append-amended each loop: plan review -> implementation -> verification -> retrospective changes.

## Iteration 1
- Focus: close remaining onboarding Step 8 deterministic harness gap.
- Delivered: removed `test.fixme` and stabilized with `page.addInitScript` seeding.
- Verified: targeted onboarding Playwright set 5/5 passing.
- Retrospective: moved onboarding critical coverage from unstable to complete.

## Iteration 2
- Focus: Bucket B route-level discovery/ranking contract coverage.
- Delivered: `lib/__tests__/registry-route.test.ts`.
- Verified: `jest registry-route + planner-resolve` -> 8/8 passing.
- Retrospective: route filters/sorts now explicitly covered.

## Iteration 3
- Focus: default discovery ordering regression protection.
- Delivered: `lib/__tests__/registry-bridge-sort.test.ts`.
- Verified: `jest registry-bridge-sort + registry-route` -> 6/6 passing.
- Retrospective: no-sort ordering contract locked (`attested > health > feedback`).

## Iteration 4
- Focus: infra-backed integration-lane artifacting.
- Delivered: `scripts/run-integration-lane.sh`, npm script `test:e2e:integration-lane`.
- Verified: latest lane summary `artifacts/integration-lane/20260419-130442/SUMMARY.md` -> 4 passed, 0 skipped, 0 failed.
- Retrospective: local artifact generation complete; CI/nightly upload remains.

## Iteration 5
- Focus: P2 scenario-ID mapping foundation across Buckets A-H.
- Delivered: `docs/BDD-SCENARIO-ID-MAP.md`.
- Verified:
  - Bucket headers present for A-H
  - Explicit gaps section captured for next loop
- Retrospective amendments:
  - Added map as new canonical index for BDD ID -> test file -> lane.
  - Next loop should convert map gaps into executable tests and CI retention tasks.

## Iteration 6
- Focus: close Bucket B tag-filter gap from scenario map.
- Delivered:
  - `/api/registry` support for `tag=<value>` and `tags=<csv>` filters.
  - Added direct contract assertions in `lib/__tests__/registry-route.test.ts`.
- Verified: `jest registry-route + registry-bridge-sort + planner-resolve` -> 10/10 passing.
- Retrospective amendments:
  - Updated `docs/BDD-SCENARIO-ID-MAP.md` to mark B2.1 complete.
  - Removed tag-filter item from active gaps.

## Iteration 7
- Focus: route stability guard for unsupported sort values.
- Delivered: added unsupported-sort resilience contract in `lib/__tests__/registry-route.test.ts`.
- Verified: `jest registry-route + registry-bridge-sort` -> 8/8 passing.
- Retrospective amendments:
  - Stability behavior now explicit: unknown `sortBy` values return 200 and preserve bridge order.

## Iteration 8
- Focus: codify freshness/latency semantics into executable ranking contract.
- Delivered:
  - Updated `/api/registry` ranking sort tie-break policy: ranking_score -> freshness (`health.lastCheckedAt`) -> cost/latency proxy (`perCallUsd`).
  - Added tie-break contract test in `lib/__tests__/registry-route.test.ts`.
- Verified: `jest registry-route + registry-bridge-sort + planner-resolve` -> 12/12 passing.
- Retrospective amendments:
  - Scenario map `B2.3` now marked complete with explicit policy note.
  - Remaining map gap reduced to CI/nightly integration-artifact retention.

## Iteration 9
- Focus: close CI/nightly artifact retention gap for integration lane.
- Delivered: `.github/workflows/integration-lane-nightly.yml` (schedule + manual dispatch + artifact upload retention 14 days).
- Verified: workflow file added and aligned with local integration-lane command (`npm run test:e2e:integration-lane`).
- Retrospective amendments:
  - Scenario map gap reduced from “policy missing” to “infra availability environment-dependent”.

## Iteration 10
- Focus: add integration-lane readiness telemetry to artifacts.
- Delivered:
  - Enhanced `scripts/run-integration-lane.sh` summary with explicit pre-run fields:
    - Ollama up/down + detected model
    - validator up/down
    - Playwright infra hint line
- Verified:
  - `npm run test:e2e:integration-lane` produced enriched summaries:
    - `artifacts/integration-lane/20260419-160720/SUMMARY.md` (4 passed, 0 skipped, 0 failed)
- Retrospective amendments:
  - CI artifact now carries both result counts and infra-readiness context.

## Iteration 11
- Focus: normalize probe-vs-test model ambiguity in integration-lane summaries.
- Delivered:
  - `run-integration-lane.sh` now records probe model, test-selected model, effective model, source label, and mismatch flag.
- Verified:
  - `npm run test:e2e:integration-lane` -> `artifacts/integration-lane/20260419-161403/SUMMARY.md`
  - Summary now explicitly reports: probe model `mistral:latest`, selected model `qwen3:8b`, source `playwright`, mismatch `yes`.
- Retrospective amendments:
  - Ambiguity removed from artifact interpretation; mismatch is now explicit telemetry rather than hidden drift.

## Iteration 12
- Focus: start Gherkin extraction from scenario-ID map.
- Delivered: `docs/bdd/features/bucket-b-discovery.feature` with tagged scenarios:
  - `@B2.1` tag filtering
  - `@B2.2` attestation/health filtering
  - `@B2.3` ranking tie-break semantics
  - `@B2.default-order` no-sort bridge ordering
- Verified:
  - `rg` confirms all scenario tags present in feature file.
- Retrospective amendments:
  - Shifted from map-only governance to executable BDD artifacting start.

## Iteration 13
- Focus: continue Gherkin extraction with Bucket H orchestrator lifecycle.
- Delivered: `docs/bdd/features/bucket-h-consumer-orchestrator.feature` with tagged scenarios:
  - `@H1.1..@H1.4` registration + manifest
  - `@H2.1..@H2.3` specialist/attestor resolution
  - `@H3.1..@H3.5` invoke + settlement lifecycle
  - `@H4.1..@H4.3` signaling + independent auditability
- Verified:
  - Tag presence check via `rg`
  - Mapped executable suite green:
    - `npx jest ...planner-register-consumer...planner-auditability... --runInBand` -> 8 suites, 16/16 tests passing.
- Retrospective amendments:
  - Gherkin extraction now covers Buckets B and H.
  - Next extraction should prioritize Bucket A onboarding lifecycle.

## Iteration 14
- Focus: continue Gherkin extraction with Bucket A onboarding lifecycle.
- Delivered: `docs/bdd/features/bucket-a-onboarding.feature` with tagged scenario groups:
  - `@A1.1..@A1.8` onboarding progression + registration/integration notes
  - `@A2.1..@A2.6` healthcheck/attestation/audit/operator-signer behavior
- Verified:
  - Tag presence check via `rg`
  - Mapped executable checks:
    - `npx jest lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts --runInBand` -> 2 suites, 6/6 pass
    - targeted onboarding Playwright gate set -> 5/5 pass
- Retrospective amendments:
  - Gherkin extraction now covers Buckets A, B, and H.
  - Hydration-mismatch warning persists in Next render logs (non-blocking for current assertions).

## Iteration 15
- Focus: continue Gherkin extraction with Bucket D/E security + reliability.
- Delivered: `docs/bdd/features/bucket-d-e-reliability.feature` with tagged scenario groups:
  - `@D1.1..@D1.3` endpoint security compatibility
  - `@E2.1..@E2.2` operator key reliability + rotation
  - `@E3.1..@E3.3` RPC config override/fallback consistency
  - `@E.integration` runtime-lane artifact evidence
- Verified:
  - Tag presence check via `rg`
  - Mapped executable suite green:
    - `npx jest lib/__tests__/endpoint-security-compat.test.ts lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts lib/__tests__/program-rpc-config.test.ts --runInBand` -> 4 suites, 11/11 pass
- Retrospective amendments:
  - Gherkin extraction now covers Buckets A, B, D/E, and H.
  - Remaining extraction candidates are Bucket C, F, G.

## Iteration 16
- Focus: continue Gherkin extraction with Bucket C planner-native consumption.
- Delivered: `docs/bdd/features/bucket-c-planner-consumption.feature` with tagged scenario groups:
  - `@C1.1..@C1.3` resolution policy + deterministic candidate behavior
  - `@C2.1..@C2.3` invoke policy/trace contracts
  - `@C3.1..@C3.2` quality signal persistence/trigger behavior
  - `@C4.1..@C4.3` reputation-event pathway coverage linkage
- Verified:
  - Tag presence check via `rg`
  - Mapped executable suite green:
    - `npx jest lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-signal-route.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-client.test.ts --runInBand` -> 5 suites, 20/20 pass
- Retrospective amendments:
  - Gherkin extraction now covers Buckets A, B, C, D/E, and H.
  - Remaining extraction candidates are Bucket F and G.

## Iteration 17
- Focus: continue Gherkin extraction with Bucket F and Bucket G.
- Delivered:
  - `docs/bdd/features/bucket-f-jupiter-settlement.feature`
  - `docs/bdd/features/bucket-g-torque-retention.feature`
- Verified:
  - Tag presence checks via `rg` for F/G scenario tags.
  - Mapped executable suites green:
    - `npx jest lib/__tests__/jupiter-client.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand` -> 6 suites, 25/25 pass
    - `cd packages/x402-solana && npm test -- --runInBand tests/payment.test.ts` -> 1 suite, 19/19 pass
- Retrospective amendments:
  - Gherkin extraction now covers Buckets A, B, C, D/E, F, G, and H.
  - Remaining extraction work is effectively closed for listed buckets.

## Iteration 18
- Focus: add a single index linking all Gherkin features to executable verification commands.
- Delivered: `docs/bdd/FEATURE-INDEX.md`.
- Verified:
  - `rg` confirms all 7 feature files are referenced in index.
  - feature count cross-check: index references = 7, `docs/bdd/features` files = 7.
- Retrospective amendments:
  - BDD feature extraction now has an operational command index for fast per-bucket verification.

## Next loop candidates
1. Add a lightweight script to validate feature-index coverage automatically (prevent drift).
