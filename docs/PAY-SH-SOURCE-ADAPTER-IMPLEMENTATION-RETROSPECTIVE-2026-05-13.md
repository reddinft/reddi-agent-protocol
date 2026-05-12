# Pay.sh Source Adapter — 10-loop Retrospective

Issue: #317
Branch: feature/pay-sh-source-adapter

## Loop log

### Loop 1 — profile contract
- Added Pay.sh source profile and provider→candidate mapping.
- Registered `pay-sh` in source profile registry.
- Guardrail: metadata-only; no wallet setup/top-up/payment surfaces.

### Loop 2 — profile tests
- Added profile tests for registry discovery, category mapping, manifest validation, and candidate conversion.
- This pins Pay.sh candidates as externally listed and not RAP-attested.

### Loop 3 — deterministic ID hygiene
- First profile test exposed over-normalized Pay.sh FQNs.
- Fixed candidate IDs to preserve provider slug hyphens while converting namespace separators to colons.

### Loop 4 — catalog loader and API
- Added Pay.sh catalog artifact loader with category/search/limit filters.
- Added `/api/source-adapters/pay-sh` dry-run catalog endpoint.
- Boundary explicitly forbids wallet creation, top-up, payment, or external invocation.

### Loop 5 — catalog route tests
- Added mocked API route tests for dry-run catalog success and missing-artifact guidance.
- Confirmed route forwards limit/category/search filters to loader.

### Loop 6 — quote preview
- Added Pay.sh quote-preview helper and route.
- Added required gates for top-up verification, tiny spend caps, receipt capture, attestation, and preventing arbitrary agent sends.
- Added route tests for success and missing candidate validation.

### Loop 7 — ingest and conformance wiring
- Added `scripts/ingest-pay-sh-catalog.mjs` and `npm run ingest:pay-sh`.
- Added `pay-sh` to source-conformance and matrix scripts.
- Added BDD scenarios for Pay.sh provider import and dry-run quote-preview gates.

### Loop 8 — source-aware surfaces
- Added `pay-sh` to MCP preferredSource/sourceRouting type surfaces.
- Fixed source-conformance help text after adding the new source.
- Updated BDD feature-index validation command notes to include Pay.sh tests and conformance lane.

### Loop 9 — live metadata ingest rehearsal
- Ran `npm run ingest:pay-sh` against the public Pay.sh catalog.
- Produced local metadata artifact only; no wallet setup, top-up, payment, or API invocation.

### Loop 10 — final gate and PR packaging
- Ran live metadata ingest only: 72 providers captured from public Pay.sh catalog.
- Ran Pay.sh source-conformance smoke including build: PASS.
- Added STATUS update and committed retrospective as durable repo evidence.
- Remaining boundary: next slice may inspect Pay CLI sandbox/MCP, but must not run top-up or paid calls without explicit approval.
