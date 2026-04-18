# Torque Integration — BDD Feature Map

Date: 2026-04-18

This maps business purpose -> use case -> BDD scenarios -> executable tests.

## Feature A: Protocol activity becomes measurable loyalty signals

Purpose:
- Convert real protocol behavior into retention events that can power incentives.

Use cases:
- Specialist job completed (post-settlement)
- Consumer planner usage
- Reputation signal submission
- Onboarding completion milestone

BDD scenarios:
- G1.1-G1.5: Torque client auth + no-op/failure behavior
- G1.6: SPECIALIST_JOB_COMPLETED emitted after `release_escrow`
- G1.7: CONSUMER_QUERY_RUN emitted after planner invoke
- G1.8: RATING_SUBMITTED emitted after rating commit
- G1.9: ONBOARDING_COMPLETED emitted when specialist finalizes onboarding (step 8 completion action)

Automated coverage:
- `lib/__tests__/torque-client.test.ts`
- `lib/__tests__/torque-onboarding-event.test.ts`
- `lib/__tests__/torque-event-route.test.ts` (accepts `onboarding_completed`)
- wiring in:
  - `lib/onboarding/x402-settlement.ts`
  - `lib/onboarding/planner-execution.ts`
  - `lib/onboarding/reputation-signal.ts`
  - `app/onboarding/page.tsx`
  - `lib/onboarding/torque-onboarding.ts`

Status:
- G1.1-G1.9: implemented and validated

## Feature B: Public leaderboard loop for trust + growth

Purpose:
- Show visible protocol outcomes (ranked specialists) to reinforce quality and loyalty loop.

Use cases:
- Leaderboard endpoint returns ranked entries
- Leaderboard page renders safely
- No secret leakage in rendered HTML

BDD scenarios:
- G2.1: leaderboard API returns ranked list
- G2.2: leaderboard API returns empty list gracefully
- G2.3: page renders without server error
- G2.4: page shows table or empty state
- G2.5: page includes Torque attribution
- G2.6: page does not expose API secrets

Automated coverage:
- `lib/__tests__/torque-leaderboard-route.test.ts`
- `e2e/leaderboard.spec.ts`

Status:
- G2.1-G2.6: implemented and validated

## Feature C: Event ingestion API safety

Purpose:
- Ensure only valid event payloads are accepted before emission.

Use cases:
- reject missing user/event
- reject unknown event names
- accept known events and emit

BDD scenarios:
- V1: returns 400 for malformed payload
- V2: returns 400 for unknown event names
- V3: returns 200 and calls emission for valid payload

Automated coverage:
- `lib/__tests__/torque-event-route.test.ts`

Status:
- V1-V3: implemented and validated

---

## Test commands (current)

- Unit/route:
  - `npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand`
- E2E:
  - `npx playwright test e2e/leaderboard.spec.ts e2e/planner.spec.ts`

## Optional Surfpool local smoke (for protocol-layer confidence)

- Goal: validate planner/settlement path emits expected events while running against localnet-like environment.
- Suggested command sequence:
  1. start Surfpool
  2. point app RPC env to Surfpool endpoint
  3. execute planner + settlement smoke run
  4. verify event route logs + no regressions

Note: current Torque tests already validate client/route/UI behavior. Surfpool adds protocol-runtime confidence, not replacement for BDD unit/e2e coverage.
