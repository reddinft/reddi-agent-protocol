# Appendix B — Benchmark Methodology and Reproducibility

_Status: Phase 5 hardening draft_

## Objective

Provide a repeatable baseline for validating protocol behavior across:

- specialist discovery and routing
- paid invocation and settlement handling
- attestation-gated release/refund decisions
- end-to-end UI operator flows

## Benchmark lanes

### Lane 1 — Route/unit correctness

Run dogfood and planner route-level tests:

```bash
npx jest \
  lib/__tests__/dogfood-testing-specialist-route.test.ts \
  lib/__tests__/dogfood-testing-attestor-route.test.ts \
  lib/__tests__/dogfood-consumer-run-route.test.ts \
  --runInBand
```

Expected outcome:
- all suites pass
- pass path resolves to `released`
- fail path resolves to `refunded`

### Lane 2 — BDD index integrity

```bash
npm run test:bdd:index
```

Expected outcome:
- feature files and verification command map remain in sync

### Lane 3 — Browser workflow lane

```bash
npx playwright test e2e/dogfood.spec.ts
```

Expected outcome:
- `/dogfood` loads
- forced pass run shows released escrow
- forced fail run shows refunded escrow

### Lane 4 — Demo artifact lane

```bash
npm run demo:dogfood:capture
```

Expected outcome:
- timestamped artifacts under `artifacts/dogfood-demo/<timestamp>/`
- logs and media traces available for review/demo editing

## Environment notes

- Node/Next versions should match repository lock constraints.
- Local and CI should use consistent browser channel for Playwright where possible.
- If using worktrees, ensure dependencies are available in that working directory.

## Metrics to track over time

- Test pass/fail rates per lane
- Median `consumer-run` completion time (pass vs fail)
- Rate of attestor disagreement events
- Route regressions found before vs after PR merge

## Reporting template

For each benchmark run record:

- git SHA
- timestamp
- lane commands executed
- pass/fail summary
- notable variance or flaky behavior

## Caveats

- Benchmark values are environment-sensitive and should be compared relative to baseline in the same environment.
- Dogfood lane is intentionally synthetic for harness validation; it does not represent full marketplace complexity.
