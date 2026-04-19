# BDD Comprehensive Review + Gap Plan (2026-04-19 v2)

## Objective
Validate that all built infrastructure is justified by BDD buckets/use-cases/scenarios, identify remaining build/testing gaps, and run an iterative closure loop with verification + retrospective updates + commit each iteration.

## Coverage Snapshot (current)

## Bucket A — Onboarding
- **Spec artifacts:** `docs/bdd/features/bucket-a-onboarding.feature`
- **Build state:** Implemented (wizard + runtime + endpoint + wallet + attestation + audit)
- **Test state:** Partial-to-good
  - Covered: operator key/status checks, critical onboarding UI step gates
  - Gap: direct route-level contracts for wallet/healthcheck/attestation/audit/capabilities/endpoint/runtime not yet broadly covered

## Bucket B — Discovery + Capability Index
- **Spec artifacts:** `docs/bdd/features/bucket-b-discovery.feature`
- **Build state:** Implemented
- **Test state:** Good
  - Covered: filter/sort contracts, default order, unsupported sort stability, ranking tie-breakers

## Bucket C — Planner-Native Consumption
- **Spec artifacts:** `docs/bdd/features/bucket-c-planner-consumption.feature`
- **Build state:** Implemented
- **Test state:** Good at route/unit, integration dependent for full runtime path

## Bucket D/E — Security + Reliability
- **Spec artifacts:** `docs/bdd/features/bucket-d-e-reliability.feature`
- **Build state:** Implemented
- **Test state:** Good for D1/E2/E3 contracts; E1 infra/runtime behavior remains partly observational/integration-dependent

## Bucket F — Jupiter Settlement
- **Spec artifacts:** `docs/bdd/features/bucket-f-jupiter-settlement.feature`
- **Build state:** Implemented
- **Test state:** Good
  - Covered in `lib/__tests__/jupiter-client.test.ts` + `packages/x402-solana/tests/payment.test.ts`

## Bucket G — Torque Retention
- **Spec artifacts:** `docs/bdd/features/bucket-g-torque-retention.feature`
- **Build state:** Implemented
- **Test state:** Good
  - Covered by torque route/client tests and leaderboard surface checks

## Bucket H — Consumer Orchestrator
- **Spec artifacts:** `docs/bdd/features/bucket-h-consumer-orchestrator.feature`
- **Build state:** Implemented
- **Test state:** Good
  - Route contracts and auditability coverage in place

---

## Key Remaining Gaps (prioritized)

### P0 (in progress)
1. ✅ **Bucket A route-contract expansion (slice 1+2+3 complete)**
   - Added direct tests for onboarding APIs:
     - `/api/onboarding/wallet`
     - `/api/onboarding/healthcheck`
     - `/api/onboarding/attestation`
     - `/api/onboarding/runtime`
     - `/api/onboarding/endpoint`
     - `/api/onboarding/capabilities` (GET/POST)
     - `/api/onboarding/audit` (GET)
     - `/api/onboarding/wallet/recovery` (GET)
     - `/api/onboarding/settlement-config` (GET)
     - `/api/onboarding/planner/execute` (GET/POST)
     - `/api/onboarding/planner/feedback` (GET/POST)
     - `/api/onboarding/planner/reveal` (GET/POST)
   - Evidence:
     - `lib/__tests__/onboarding-routes-core.test.ts`
     - `lib/__tests__/onboarding-routes-support.test.ts`
     - `lib/__tests__/onboarding-routes-wrappers.test.ts`
     - combined run: 18/18 pass
   - Result: core onboarding and wrapper route coverage now directly test-backed.

### P1
2. **Bucket A/B onboarding support routes**
   - Add route tests for `/api/onboarding/capabilities`, `/api/onboarding/endpoint`, `/api/onboarding/runtime`, `/api/onboarding/audit`.

3. **Bucket E1 runtime reliability explicit contracts**
   - ✅ Added focused checks for offline/online transitions and quick-fix surfacing behavior:
     - `lib/__tests__/endpoint-manager-reliability.test.ts`
   - Remaining reliability follow-up:
     - Evaluate remediation-branch logic for tunnel guidance text, because current heartbeat/status formula makes some tunnel-note conditions hard to hit deterministically.

### P2
4. **Confidence-lane reporting polish**
   - Keep sweep artifacts + quick status, and add workflow step summary output for at-a-glance CI run interpretation.

---

## Iteration Execution Contract (active)
Per iteration:
1. Review this plan and pick highest-priority open slice.
2. Implement one slice.
3. Verify with explicit tests/commands.
4. Retrospective: update plan + iteration log + status + memory.
5. Commit with an intelligent scoped message.

## Immediate Iteration Target
- Continue P1 reliability hardening: review endpoint remediation-branch semantics and decide whether tunnel guidance branch should be made reachable or removed.
