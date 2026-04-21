# Runtime Diversity Onboarding — BDD Playbook

Date: 2026-04-21
Owner: Loki
Companion: `docs/runtime-onboarding/INFRASTRUCTURE-PLAN.md`

## Goal
Execute runtime-diversity onboarding changes through a test-first, evidence-first cycle with progressive PR checkpoints.

## Feature buckets

### Bucket R1 — Probe contract normalization
Covers runtime detection and API-shape tolerance.

Scenarios:
1. Given endpoint exposes `/v1/models`, when probed, then runtime is detected as OpenAI-compatible.
2. Given endpoint exposes `/api/tags`, when probed, then runtime is detected as Ollama-compatible.
3. Given endpoint lacks runtime paths but has `/healthz`, then endpoint is reachable but runtime unknown.
4. Given endpoint is unreachable/invalid, then probe returns `unreachable` with actionable hint.

Primary test lane:
- `app/api/register/probe/route.ts` route tests

PR gate: **PR-A** must include R1 green.

---

### Bucket R2 — Quick Setup runtime selector + guidance
Covers UX for runtime-specific setup instructions and verification.

Scenarios:
1. Given runtime=llama.cpp, quick setup shows llama-server command and manual verify guidance.
2. Given runtime=vLLM, quick setup shows vLLM OpenAI server command and expected base URL hints.
3. Given runtime=LM Studio, quick setup shows Local Server start flow guidance.
4. Given auto-probe failure, user can manually verify and bypass to next step.

Primary test lane:
- Component behavior tests for `GuidedSetupModal`
- Existing quick-setup e2e smoke updated for selector path

PR gate: **PR-B** must include R2 green.

---

### Bucket R3 — Register page runtime-aware validation
Covers endpoint probe messaging and model detection on registration page.

Scenarios:
1. Given endpoint probe succeeds, UI shows detected runtime label and models.
2. Given runtime mismatch/non-detection, UI shows neutral warning, not Ollama-only text.
3. Given models returned, model field can be prefilled from returned list.

Primary test lane:
- `app/register/page.tsx` behavior tests
- probe route integration checks

PR gate: **PR-C** must include R3 green.

---

### Bucket R4 — Onboarding wizard runtime parity
Covers wizard flow with non-Ollama runtime path while preserving Ollama compatibility.

Scenarios:
1. Given runtime=Ollama, existing bootstrap path remains functional.
2. Given runtime!=Ollama, wizard supports manual runtime mode and does not block on Ollama-only checks.
3. Given selected runtime path complete, endpoint step can proceed.

Primary test lane:
- onboarding flow tests (`e2e/onboarding.spec.ts` and/or targeted wizard tests)

PR gate: **PR-D** must include R4 green.

## Execution cycle (accountable loop)
For each PR checkpoint:
1. Write/update scenarios (Given/When/Then) in this playbook and mapped test files.
2. Implement minimal code slice.
3. Run targeted test lane.
4. Capture evidence in PR body:
   - tests run
   - pass counts
   - screenshots/log snippets where relevant
5. Update this playbook with any scope shifts before next PR.

## Suggested verification commands
- Route tests (probe/local-check):
  - `npx jest app/api/register/probe/route.ts --runInBand` (or project-equivalent route test path)
- Quick setup + register component lanes:
  - `npx jest <targeted-ui-tests> --runInBand`
- Onboarding e2e subset:
  - `npx playwright test e2e/onboarding.spec.ts --project=chromium`

(Use repository-specific test files as finalized in each PR.)

## Evidence requirements per PR
- ✅ Test output snippet in PR description
- ✅ List of files touched
- ✅ Explicit statement of which bucket(s) closed
- ✅ Any deferred scenarios listed as open follow-ups

## Definition of done
All buckets R1-R4 are marked closed with:
- merged PR trail (A through D)
- no Ollama-only blocking language in runtime-diverse paths
- wizard/register/quick-setup flows each support the four target runtimes at instruction + probe level
