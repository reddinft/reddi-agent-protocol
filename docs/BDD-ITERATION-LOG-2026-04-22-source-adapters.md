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

## Iteration 5
- Focus: P3 pi source profile + canonical extension-bundle compatibility checks + cross-source conformance matrix output.
- Delivered:
  - Added pi source profile + manifest builder:
    - `lib/integrations/source-adapter/profiles/pi.ts`
    - registered pi in `lib/integrations/source-adapter/profiles/index.ts`
  - Added pi extension-bundle compatibility validator:
    - `lib/integrations/source-adapter/pi/extension-bundle.ts`
  - Added tests:
    - `lib/__tests__/source-adapter-pi-profile.test.ts`
    - `lib/__tests__/source-adapter-pi-extension-bundle.test.ts`
  - Expanded Bucket-S feature scenarios with pi parity tags (`@S3.3`, `@S5.3`).
  - Enhanced conformance harness with source-specific contract checks per source.
  - Added cross-source matrix runner:
    - `scripts/run-source-conformance-matrix.sh`
    - `npm run test:source:matrix`
- Verified:
  - `npx jest lib/__tests__/source-adapter-schema.test.ts lib/__tests__/register-probe-route.test.ts lib/__tests__/source-adapter-openclaw-profile.test.ts lib/__tests__/source-adapter-openclaw-connector.test.ts lib/__tests__/source-adapter-hermes-profile.test.ts lib/__tests__/source-adapter-hermes-attestor.test.ts lib/__tests__/source-adapter-pi-profile.test.ts lib/__tests__/source-adapter-pi-extension-bundle.test.ts --runInBand` -> 8 suites, 19/19 tests passing.
  - `npm run test:bdd:index` -> PASS.
  - `./scripts/run-source-conformance.sh --source pi --mode smoke` -> PASS.
  - `npm run test:source:matrix` -> PASS.
  - Artifact evidence:
    - `artifacts/source-conformance/20260422-230408-pi-smoke/SUMMARY.md`
    - `artifacts/source-conformance-matrix/20260422-230418/SUMMARY.md`.
- Retrospective:
  - All three sources now have baseline profile coverage with deterministic parity checks.
  - Next iteration should focus on promotion policy wiring for source-aware routing preferences and CI lane gating for matrix artifacts.

## Iteration 6
- Focus: P4 source-aware routing preference policy hooks + CI lane gating for matrix artifacts.
- Delivered:
  - Added source-routing policy evaluator:
    - `lib/integrations/source-adapter/routing-policy.ts`
    - supports `preferredSource` + `strictSourceMatch` guardrails with deterministic scoring/rejection reasons.
  - Wired source-aware routing into resolve tool route:
    - `app/api/planner/tools/resolve/route.ts`
    - applies source policy in candidate filter + score phases.
  - Added OpenClaw source default routing hook:
    - `lib/integrations/source-adapter/openclaw/connector.ts`
    - resolve calls now default `policy.preferredSource = "openclaw"` when not provided.
  - Extended MCP resolve tool schema:
    - `lib/mcp/tools.ts`
    - adds `policy.preferredSource` and `policy.strictSourceMatch`.
  - Added tests:
    - `lib/__tests__/source-adapter-routing-policy.test.ts`
    - `lib/__tests__/planner-resolve-route.test.ts`
    - updated `lib/__tests__/source-adapter-openclaw-connector.test.ts` for default source-policy assertions.
  - Added CI gating workflow:
    - `.github/workflows/source-conformance-matrix.yml`
    - runs `npm run test:source:matrix` and uploads source+matrix artifacts.
  - Updated Bucket-S BDD docs:
    - `docs/bdd/features/bucket-s-source-adapters.feature` (`@S2.2`, `@S5.4`)
    - `docs/bdd/FEATURE-INDEX.md` with new routing policy verification lanes.
- Verified:
  - `npx jest lib/__tests__/source-adapter-routing-policy.test.ts lib/__tests__/planner-resolve-route.test.ts lib/__tests__/source-adapter-openclaw-connector.test.ts --runInBand` -> 3 suites, 7/7 tests passing.
  - `npm run test:bdd:index` -> PASS.
  - `npm run test:source:matrix` -> PASS.
  - Artifact evidence:
    - `artifacts/source-conformance/20260423-054949-openclaw-smoke/SUMMARY.md`
    - `artifacts/source-conformance/20260423-054958-hermes-smoke/SUMMARY.md`
    - `artifacts/source-conformance/20260423-055006-pi-smoke/SUMMARY.md`
    - `artifacts/source-conformance-matrix/20260423-054949/SUMMARY.md`.
- Retrospective:
  - Source-aware routing defaults are now wired with strict guardrails and deterministic reasons.
  - Matrix regressions are CI-gated with retained artifacts for fast diagnosis.
  - Next iteration should add source-aware ranking explainability in API output metadata (per-candidate source match summary) for external supervisor debugging.
