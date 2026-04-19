# BDD Feature Index

_Last updated: 2026-04-19 AEST_

Purpose: single lookup from BDD feature file -> bucket -> executable verification command(s).

## Features and mapped verification commands

### Bucket A — Onboarding
- Feature: `docs/bdd/features/bucket-a-onboarding.feature`
- Verify:
  - `npx jest lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts --runInBand`
  - `npx playwright test e2e/onboarding.spec.ts --grep "consent gates|next button advances|back button returns|step 2 runtime — next is disabled|run button disabled when prompt is empty"`

### Bucket B — Discovery + Capability Index
- Feature: `docs/bdd/features/bucket-b-discovery.feature`
- Verify:
  - `npx jest lib/__tests__/registry-route.test.ts lib/__tests__/registry-bridge-sort.test.ts lib/__tests__/planner-resolve-route.test.ts --runInBand`

### Bucket C — Planner-Native Consumption
- Feature: `docs/bdd/features/bucket-c-planner-consumption.feature`
- Verify:
  - `npx jest lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-signal-route.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-client.test.ts --runInBand`

### Bucket D/E — Security + Reliability
- Feature: `docs/bdd/features/bucket-d-e-reliability.feature`
- Verify:
  - `npx jest lib/__tests__/endpoint-security-compat.test.ts lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts lib/__tests__/program-rpc-config.test.ts --runInBand`
  - `npm run test:e2e:integration-lane`

### Bucket F — Jupiter Cross-Token Settlement
- Feature: `docs/bdd/features/bucket-f-jupiter-settlement.feature`
- Verify:
  - `npx jest lib/__tests__/jupiter-client.test.ts lib/__tests__/planner-invoke-route.test.ts --runInBand`
  - `cd packages/x402-solana && npm test -- --runInBand tests/payment.test.ts`

### Bucket G — Torque Retention
- Feature: `docs/bdd/features/bucket-g-torque-retention.feature`
- Verify:
  - `npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand`
  - `npx playwright test e2e/leaderboard.spec.ts`

### Bucket H — Consumer Orchestrator Lifecycle
- Feature: `docs/bdd/features/bucket-h-consumer-orchestrator.feature`
- Verify:
  - `npx jest lib/__tests__/planner-register-consumer-route.test.ts lib/__tests__/planner-tools-manifest-route.test.ts lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-resolve-attestor-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-release-route.test.ts lib/__tests__/planner-signal-route.test.ts lib/__tests__/planner-auditability.test.ts --runInBand`

## Drift guard
- Validate index coverage against feature files:
  - `npm run test:bdd:index`
  - (script: `scripts/check-bdd-feature-index.sh`)

## One-command representative sweep
- Run representative verification across all active buckets:
  - `npm run test:bdd:sweep`
  - (script: `scripts/run-bdd-bucket-sweep.sh`)

## Suggested cadence
- Per iteration: run only affected bucket commands.
- End-of-day confidence sweep: run representative command per bucket.
- Nightly: rely on CI integration-lane workflow artifact uploads.
