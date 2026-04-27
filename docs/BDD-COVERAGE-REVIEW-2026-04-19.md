# BDD Coverage Review + Gap Plan (2026-04-19)

## Objective
Comprehensively verify that built infrastructure is justified by BDD buckets/use-cases/scenarios, identify build/testing gaps, and define a concrete closure plan.

## Sources Reviewed
- `docs/BDD-BUILD-CHECKPOINTS-v3.md`
- `docs/TORQUE-BDD-FEATURE-MAP.md`
- `docs/CONSUMER-ORCHESTRATOR-PLUMBING-PLAN.md`
- E2E specs: `e2e/*.spec.ts`
- Route/unit specs: `lib/__tests__/*.test.ts`
- Package tests: `packages/x402-solana/tests/payment.test.ts`, `packages/per-client/tests/per-client.test.ts`, `packages/eliza-plugin-x402/tests/*`, `packages/sendai-x402/tests/*`

---

## Coverage Summary by Bucket

### Bucket A — Specialist Onboarding
- **BDD spec:** Present (A1, A2)
- **Build state:** Implemented
- **Automated test state:** Improved
  - Active API + UI gate checks in `e2e/onboarding.spec.ts`
  - Critical onboarding scenarios are now active and passing (no remaining Step 8 `fixme` for disabled-run-button gate)
- **Assessment:** Core onboarding gates are now executable; broader infra-backed paths remain integration-lane dependent.

### Bucket B — Discovery + Capability Index
- **BDD spec:** Present (B1, B2)
- **Build state:** Partial
  - B1 baseline shipped (schema capture + linkage)
  - B2 ranking/filter semantics still evolving
- **Automated test state:** Improved
  - Dedicated route-level contracts added: `lib/__tests__/registry-route.test.ts` (filters incl. `tag`/`tags` + explicit sort behavior + unsupported-sort stability)
  - Default bridge sort regression added: `lib/__tests__/registry-bridge-sort.test.ts` (attested > health > feedback)
- **Assessment:** Product depth gap remains, but freshness + cost-latency proxy ranking policy is now codified and test-backed.

### Bucket C — Planner-Native Consumption
- **BDD spec:** Present (C1–C4)
- **Build state:** Implemented
- **Automated test state:** Good, with caveats
  - Route tests exist for invoke/signal and consumer lifecycle
  - x402 payment behavior is tested in package tests
  - Real full-path runtime tests are infra-dependent (local validator + Ollama)
- **Assessment:** Solid contract-level coverage; runtime confidence depends on integration environment availability.

### Bucket D — x402 + Endpoint Security Compatibility
- **BDD spec:** Present (D1)
- **Build state:** Implemented
- **Automated test state:** Good
  - Focused route/unit checks now exist in `lib/__tests__/endpoint-security-compat.test.ts` for `/v1/*`, `/x402/*`, `/healthz` bypass and non-public gating.
- **Assessment:** Security-critical compatibility behavior now has direct executable checks.

### Bucket E — Operational Reliability and Recovery
- **BDD spec:** Present (E1–E3)
- **Build state:** Partial-to-implemented
- **Automated test state:** Improved
  - E2.2 operator rotation runbook + verification implemented (`docs/ONBOARDING-OPERATOR-KEY-ROTATION-RUNBOOK.md`, `lib/__tests__/operator-key-rotation.test.ts`)
  - E3 RPC override/fallback directly unit-tested (`lib/__tests__/program-rpc-config.test.ts`)
- **Assessment:** Reliability claims are now materially backed by executable contracts; CI/nightly integration artifact retention remains open.

### Bucket F — Cross-Token Settlement (Jupiter)
- **BDD spec:** Present (F1)
- **Build state:** Implemented
- **Automated test state:** Good
  - `packages/x402-solana/tests/payment.test.ts`
  - `lib/__tests__/jupiter-client.test.ts`
  - invoke route wiring coverage in `planner-invoke-route.test.ts`
- **Assessment:** Strongest and most coherent BDD-to-test mapping currently.

### Bucket G — Torque Retention
- **BDD spec:** Present (feature map + scenarios)
- **Build state:** Implemented
- **Automated test state:** Good
  - Route/client tests + leaderboard E2E checks present
- **Assessment:** Good coverage and clear BDD traceability.

### Bucket H — Consumer Orchestrator Lifecycle
- **BDD spec:** Present (H1–H4)
- **Build state:** Implemented for plumbing + lifecycle
- **Automated test state:** Good at route level, light at end-to-end
  - Route tests: register-consumer, resolve-attestor, invoke, release, signal
  - Planner UI E2E validates contract surfaces, but not full deterministic release/dispute-to-signal audit trail end-to-end
- **Assessment:** Major progress done; a small but important E2E auditability slice remains.

---

## Gaps Identified (Prioritized)

## P0 (high priority, next)
1. **Unskip critical onboarding UI BDD scenarios**
   - File: `e2e/onboarding.spec.ts`
   - Impact: A-bucket claims are under-validated in active CI surface.
2. **Add direct tests for Bucket D security invariants**
   - Validate x402/public path bypass and token gating on non-public paths.
3. **Add tests for planner tool manifest + resolve route contracts**
   - Missing direct checks for `GET /api/planner/tools` and `POST /api/planner/tools/resolve` no-candidate + candidate ranking contract.

## P1 (next sprint)
4. ✅ **Add dedicated E3 RPC config unit tests**
   - Added `lib/__tests__/program-rpc-config.test.ts` for env override + fallback.
5. ✅ **Add auditability scenario for H4.3**
   - Added executable contract test `lib/__tests__/planner-auditability.test.ts` verifying settlement decision and quality signal remain independently auditable for the same run.
6. ✅ **Close E2.2 operator rotation runbook + verification test**
   - Convert runbook into an executable verification check.

## P2 (strategic hardening)
7. **Promote BDD spec to executable feature format**
   - Add `.feature` files for buckets A–H and map to test IDs; keep markdown as dashboard.
8. **Nightly infra-backed integration lane**
   - Local artifact runner now implemented: `scripts/run-integration-lane.sh` (timestamped summary/log/json under `artifacts/integration-lane/`).
   - Remaining: wire this into scheduled CI/nightly retention.

---

## Gap Closure Plan

### Phase 1 — Coverage Integrity (P0)
- ✅ Unskip + stabilize onboarding UI tests (A1/A2 core gates).
- ✅ Added tests:
  - `lib/__tests__/planner-tools-manifest-route.test.ts`
  - `lib/__tests__/planner-resolve-route.test.ts`
  - `lib/__tests__/endpoint-security-compat.test.ts`
  - `lib/__tests__/registry-route.test.ts`
  - `lib/__tests__/registry-bridge-sort.test.ts`
- Exit criteria status:
  - ✅ Critical onboarding gate set activated and passing.
  - ✅ D/H manifest+resolve security contracts covered by direct automated tests.
  - ✅ B-route filter/sort contracts now covered at route level.

### Phase 2 — Reliability + Auditability (P1)
- ✅ Add RPC config tests (E3.1-E3.3).
- ✅ Add planner auditability test for release/dispute + signal independent checks (H4.3).
- ✅ Implement and validate operator rotation runbook check (E2.2).
- Exit criteria:
  - E2/E3/H4.3 marked ✅ with executable tests and linked files.

### Phase 3 — BDD Execution System (P2)
- ✅ Scenario-ID mapping foundation added: `docs/BDD-SCENARIO-ID-MAP.md` (Buckets A-H, status + evidence + lane).
- ✅ Local integration-lane artifacting for infra-dependent scenarios (`scripts/run-integration-lane.sh`, npm `test:e2e:integration-lane`).
- ✅ CI/nightly artifact upload + retention policy now wired (`.github/workflows/integration-lane-nightly.yml`).
- Remaining: promote map into Gherkin/feature-backed IDs over time and improve infra-readiness observability in lane artifacts.
- Exit criteria:
  - Every bucket scenario has explicit mapping: BDD ID -> test file -> CI lane.

---

## Recommended Immediate Execution Order
1. Unskip onboarding critical tests (A1 consent, A1 step transitions, A2 gate behavior).
2. Add planner tools manifest + resolve route tests.
3. Add endpoint security compatibility tests.
4. Then move to E3 RPC and H4.3 auditability E2E.

## Decision
Current architecture is well-justified by BDD buckets, but **test completeness is uneven**. We should prioritize P0 now so submission claims are backed by active, non-skipped executable scenarios.