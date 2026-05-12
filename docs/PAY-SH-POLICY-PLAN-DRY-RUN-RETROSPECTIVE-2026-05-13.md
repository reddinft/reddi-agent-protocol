# Pay.sh allowlisted paid-call policy plan — 10-loop retrospective

Issue: #322
Boundary: local dry-run policy planning only. No wallet setup, no top-up, no `pay mcp`, no paid call, no provider invocation, no secrets.

### Loop 1 — issue and branch
- Opened Issue #322 for a dry-run policy-plan object around future allowlisted Pay.sh paid calls.
- Created feature branch.
- Safety shape: planning eligibility only, never execution.

### Loop 2 — core policy-plan object
- Added `buildPayShPolicyPlan` as a pure local dry-run planner.
- Gates include candidate presence, tool allowlist, endpoint allowlist, explicit approval, tiny spend cap, receipt capture, and attestation.
- `livePaymentAllowed` is always false; output only says whether a future live payment would be eligible after approval.

### Loop 3 — policy-plan tests
- Added tests for all-gates-pass-but-still-dry-run, missing approval/allowlist/spend failures, non-curl tool blocking, and missing candidate blocking.
- Confirmed `livePaymentAllowed` remains false even when future eligibility passes.

### Loop 4 — policy-plan API
- Added `/api/source-adapters/pay-sh/policy-plan` POST route.
- Route only returns dry-run plan state and never invokes Pay.sh or providers.
- Added route tests for happy path and required input validation.

### Loop 5 — BDD and conformance wiring
- Added BDD S5.10 for Pay.sh paid-call policy planning.
- Updated feature index notes and Pay.sh source-conformance lane to include policy-plan tests.

### Loop 6 — full Pay.sh conformance smoke
- Ran `./scripts/run-source-conformance.sh --source pay-sh --mode smoke`.
- Passed BDD index, RAP naming, schema/probe contracts, all 7 Pay.sh test files (19 tests), and Next build.
- Latest artifact: `artifacts/source-conformance/20260513-093054-pay-sh-smoke/SUMMARY.md`.

### Loop 7 — durable docs/status packaging
- Copied retrospective to versioned docs.
- Updated STATUS with delivered files, validation evidence, and next resume point.

### Loop 8 — review pass
- Re-ran RAP naming and focused policy-plan route/helper tests after docs/status packaging.
- Confirmed policy output remains dry-run with `livePaymentAllowed=false` even when future-live gates are eligible.
