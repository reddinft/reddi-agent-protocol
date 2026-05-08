# Torque Reputation Ranking Evidence — 20260508T052500Z

## Verdict

Deterministic sandbox evidence is generated for the Torque reputation-ranking story.

Safe claim:

> Reddi Agent Protocol converts protocol activity into Torque-compatible reputation and retention signals: specialist completions, submitted ratings, and onboarding milestones feed leaderboard/ranking evidence.

Do not claim:

- live production Torque rewards campaign
- paid incentives distributed through Torque
- sponsor-side campaign launch or mainnet reward settlement

## Ranking formula used for this evidence

`score = completedJobs * 100 + averageRating * 20 + onboardingMilestones * 10`

This is a deterministic recording artifact that mirrors the product story; it is not a live rewards-campaign receipt.

## Leaderboard

1. Verification & Validation Agent (verification-validation-agent) — score 807.2; jobs 7; avg rating 4.86; wallet 2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq
2. Code Generation Agent (code-generation-agent) — score 604.4; jobs 5; avg rating 4.72; wallet 8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To
3. Document Intelligence Agent (document-intelligence-agent) — score 503; jobs 4; avg rating 4.65; wallet 13CgDqa8K3Mw8iaoUVahbJUmKyQRrUmCRM259NC8Dmy

## Torque-compatible event evidence

- specialist_job_completed → 2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq (verification-validation-agent); source lib/onboarding/x402-settlement.ts
- rating_submitted → 2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq (verification-validation-agent); source lib/onboarding/reputation-signal.ts
- onboarding_completed → 2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq (verification-validation-agent); source lib/onboarding/torque-onboarding.ts
- specialist_job_completed → 8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To (code-generation-agent); source lib/onboarding/x402-settlement.ts
- rating_submitted → 8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To (code-generation-agent); source lib/onboarding/reputation-signal.ts
- onboarding_completed → 8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To (code-generation-agent); source lib/onboarding/torque-onboarding.ts
- specialist_job_completed → 13CgDqa8K3Mw8iaoUVahbJUmKyQRrUmCRM259NC8Dmy (document-intelligence-agent); source lib/onboarding/x402-settlement.ts
- rating_submitted → 13CgDqa8K3Mw8iaoUVahbJUmKyQRrUmCRM259NC8Dmy (document-intelligence-agent); source lib/onboarding/reputation-signal.ts
- onboarding_completed → 13CgDqa8K3Mw8iaoUVahbJUmKyQRrUmCRM259NC8Dmy (document-intelligence-agent); source lib/onboarding/torque-onboarding.ts

## Implementation evidence

- lib/torque/events.ts
- lib/torque/client.ts
- lib/onboarding/x402-settlement.ts
- lib/onboarding/reputation-signal.ts
- lib/onboarding/torque-onboarding.ts
- app/leaderboard/page.tsx
- app/api/torque/event/route.ts
- app/api/torque/leaderboard/route.ts
- docs/TORQUE-BDD-FEATURE-MAP.md

## Validation

Run:

`npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand`

Optional UI check:

`npx playwright test e2e/leaderboard.spec.ts`
