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

## Iteration 2
- Focus: P0.2 conformance harness skeleton + artifact conventions + first smoke invocation path.
- Delivered:
  - Added `scripts/run-source-conformance.sh` with:
    - source selector (`openclaw|hermes|pi`)
    - mode selector (`smoke|full`)
    - artifact output at `artifacts/source-conformance/<timestamp>-<source>-<mode>/`
    - step table + markdown summary generation
  - Added npm script shortcut:
    - `test:source:conformance` -> `./scripts/run-source-conformance.sh --source openclaw --mode smoke`
- Verified:
  - `npm run test:source:conformance` -> PASS
  - Artifact evidence: `artifacts/source-conformance/20260422-212050-openclaw-smoke/SUMMARY.md`
  - Includes BDD feature-index integrity + source adapter schema/probe tests + build gate.
- Retrospective:
  - P0.2 baseline is now implemented and executable.
  - Next iteration should begin P1 by adding OpenClaw source profile + connector wrapper stubs and corresponding BDD scenario file for Bucket S (`S1-S5`).

## Iteration 3
- Focus: P1 OpenClaw source profile + connector wrapper stubs + Bucket-S BDD scaffold.
- Delivered:
  - Added OpenClaw source profile + registry access:
    - `lib/integrations/source-adapter/profiles/openclaw.ts`
    - `lib/integrations/source-adapter/profiles/index.ts`
  - Added OpenClaw connector wrappers for planner routes:
    - `lib/integrations/source-adapter/openclaw/connector.ts`
    - resolve/invoke/signal wrappers + supervisor resolve→invoke orchestrator helper
  - Added tests:
    - `lib/__tests__/source-adapter-openclaw-profile.test.ts`
    - `lib/__tests__/source-adapter-openclaw-connector.test.ts`
  - Added Bucket-S feature scaffold:
    - `docs/bdd/features/bucket-s-source-adapters.feature` (`@S1.1`..`@S5.1`)
  - Updated BDD feature index:
    - `docs/bdd/FEATURE-INDEX.md` now maps Bucket-S verification commands.
- Verified:
  - `npx jest lib/__tests__/source-adapter-schema.test.ts lib/__tests__/register-probe-route.test.ts lib/__tests__/source-adapter-openclaw-profile.test.ts lib/__tests__/source-adapter-openclaw-connector.test.ts --runInBand` -> 4 suites, 11/11 tests passing.
  - `npm run test:bdd:index` -> PASS.
  - `npm run test:source:conformance` -> PASS.
  - Artifact evidence: `artifacts/source-conformance/20260422-213317-openclaw-smoke/SUMMARY.md`.
- Retrospective:
  - OpenClaw path now has profile + wrapper baseline with BDD scenario scaffold in place.
  - Next iteration should start Hermes profile + strict attestor formatter checks, then extend Bucket-S parity scenarios.

## Iteration 4
- Focus: P2 Hermes source profile + strict attestor formatter checks + Bucket-S parity expansion.
- Delivered:
  - Added Hermes source profile:
    - `lib/integrations/source-adapter/profiles/hermes.ts`
    - registered Hermes in `lib/integrations/source-adapter/profiles/index.ts`
  - Added strict Hermes attestor formatter/validator:
    - `lib/integrations/source-adapter/hermes/attestor.ts`
  - Added tests:
    - `lib/__tests__/source-adapter-hermes-profile.test.ts`
    - `lib/__tests__/source-adapter-hermes-attestor.test.ts`
  - Expanded Bucket-S feature scenarios with Hermes parity tags (`@S3.2`, `@S5.2`).
  - Updated Bucket-S verification commands in `docs/bdd/FEATURE-INDEX.md`.
- Verified:
  - `npx jest lib/__tests__/source-adapter-schema.test.ts lib/__tests__/register-probe-route.test.ts lib/__tests__/source-adapter-openclaw-profile.test.ts lib/__tests__/source-adapter-openclaw-connector.test.ts lib/__tests__/source-adapter-hermes-profile.test.ts lib/__tests__/source-adapter-hermes-attestor.test.ts --runInBand` -> 6 suites, 15/15 tests passing.
  - `npm run test:bdd:index` -> PASS.
  - `./scripts/run-source-conformance.sh --source hermes --mode smoke` -> PASS.
  - Artifact evidence: `artifacts/source-conformance/20260422-213909-hermes-smoke/SUMMARY.md`.
- Retrospective:
  - Hermes attestor strictness baseline is now implemented and tested.
  - Next iteration should start P3 pi source profile + extension-bundle compatibility checks and broaden cross-source conformance matrix output (openclaw + hermes + pi).

