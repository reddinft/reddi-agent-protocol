# BDD Comprehensive Review + Gap Plan (2026-04-22, Source Adapters)

## Objective
Implement source ecosystem onboarding (OpenClaw, Hermes, pi.dev) with infrastructure-first controls, then close BDD gaps iteratively with explicit verification and retrospectives each loop.

## Inputs
- `playbooks/bdd-gap-closure-loop/PLAYBOOK.md`
- `docs/BDD-SCENARIO-ID-MAP.md`
- `docs/bdd/FEATURE-INDEX.md`
- `docs/bdd/features/*.feature`
- `projects/reddi-agent-protocol/SOURCE-INTEGRATION-INFRA-FIRST-BDD-PLAYBOOK.md`

## Infra-first phases (must run in order)

### P0 — Contract + preflight
- Define `source-adapter.v1` schema and validation helpers.
- Enforce schema in register probe/preflight path.
- Preserve existing hosted safety controls and OpenOnion contract checks.

### P1 — Conformance harness
- Add repeatable source conformance script + CI hook.
- Add baseline checks: schema integrity, settlement-safe failover, attestor strictness.

### P2 — Source connectors
- OpenClaw connector first.
- Hermes connector second.
- pi.dev connector third.

### P3 — BDD parity buckets
- S1 source registration safety
- S2 supervisor orchestration reliability
- S3 attestor schema integrity
- S4 consumer settlement guarantees
- S5 cross-source parity

## Iteration contract (mandatory every loop)
1. Review this plan and pick one small slice.
2. Implement slice.
3. Run explicit verification commands and record pass/fail.
4. Update plan + iteration log + STATUS + daily memory.
5. Commit scoped change.

## Active iteration target
- Iteration 6: source-aware routing preference policy + CI gating for cross-source matrix artifacts.

## Re-ranking board

### P0 (complete)
1. ✅ Add source-adapter schema helper (`source`, `role`, `runtime`, `capabilities`, `paymentPolicy`, optional `failurePolicy`/`attestationSchema`).
2. ✅ Enforce schema when `sourceAdapter` payload is supplied to `/api/register/probe`.
3. ✅ Add actionable reject reasons and non-regression tests for OpenOnion and hosted target guards.
4. ✅ Add `scripts/run-source-conformance.sh` harness skeleton and artifact folder conventions.

### P1 (complete)
5. ✅ Add OpenClaw source profile and initial connector wrappers.
6. ✅ Add `docs/bdd/features/bucket-s-source-adapters.feature` with S1-S5 tags for source onboarding flow.

### P2 (complete)
7. ✅ Add Hermes source profile + strict attestor formatter checks.
8. ✅ Extend Bucket-S scenarios with Hermes parity checks + verification commands.

### P3 (complete)
9. ✅ Add pi source profile + canonical extension-bundle compatibility checks.
10. ✅ Add cross-source conformance matrix output across openclaw/hermes/pi smoke runs.

### P4 (active)
11. Add source-aware routing preference policy hooks (selection defaults + guardrails).
12. Wire matrix verification into CI so artifact regressions fail fast.
