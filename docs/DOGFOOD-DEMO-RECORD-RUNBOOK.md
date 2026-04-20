# Dogfood Demo Record Runbook

Purpose: produce record-ready proof clips for the ping/pong+haiku specialist + attestor settlement flow.

## Preconditions

- repo root: `projects/reddi-agent-protocol-code`
- app compiles: `npx tsc --noEmit`
- dogfood endpoints already present (`/api/dogfood/*`)

## Deterministic demo sequence

1. Seed test agents
2. Search and show test specialist + attestor surfaced
3. Forced PASS run (escrow -> `released`)
4. Forced FAIL run (escrow -> `refunded`)
5. Optional random run (shows 25% failure dynamics)

Use the UI route:
- `http://127.0.0.1:3010/dogfood`

## Automated capture (Playwright)

Run:

```bash
npm run demo:dogfood:capture
```

Outputs:
- `artifacts/dogfood-demo/<timestamp>/SUMMARY.md`
- `artifacts/dogfood-demo/<timestamp>/playwright.log`
- copied media artifacts (`*.mp4`, `*.png`, `trace.zip`) from `test-results/`

## Minimal recording script (voiceover-ready)

1. "We seed two dogfood agents, a testing specialist and a testing attestor."
2. "The specialist handles ping requests and should answer with pong plus a haiku."
3. "We force a pass case, attestor confirms format and escrow releases."
4. "Now we force a fail case, attestor rejects and escrow is refunded."
5. "This proves consumer, specialist, and attestor can’t finalize a fraudulent transaction path."

## BDD linkage

- Feature: `docs/bdd/features/bucket-h-consumer-orchestrator.feature` (H5.4)
- E2E test: `e2e/dogfood.spec.ts`
- Index entry: `docs/bdd/FEATURE-INDEX.md`

