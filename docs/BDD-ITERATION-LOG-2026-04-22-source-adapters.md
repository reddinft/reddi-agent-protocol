# BDD Iteration Log — 2026-04-22 (Source Adapters)

This log follows `playbooks/bdd-gap-closure-loop/PLAYBOOK.md` and is updated every iteration.

## Iteration 1
- Focus: P0 source-adapter contract validation + probe preflight enforcement.
- Delivered:
  - Added `lib/integrations/source-adapter/schema.ts` with `source-adapter.v1` validator.
  - Updated `/api/register/probe` to validate optional `sourceAdapter` payload and return deterministic `invalid_source_adapter` errors.
  - Added tests:
    - `lib/__tests__/source-adapter-schema.test.ts`
    - expanded `lib/__tests__/register-probe-route.test.ts` for valid/invalid sourceAdapter paths and OpenOnion non-regression.
- Verified:
  - `npx jest lib/__tests__/register-probe-route.test.ts lib/__tests__/source-adapter-schema.test.ts --runInBand` -> 2 suites, 6/6 tests passing.
  - `pnpm build` -> PASS.
- Retrospective:
  - P0.1 schema + probe validation is now implemented and test-backed.
  - Next iteration should start P0.2 by wiring a first `run-source-conformance.sh` harness skeleton and artifact output conventions.

