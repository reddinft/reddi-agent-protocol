# Runtime Diversity Onboarding — Infrastructure Plan

Date: 2026-04-21
Owner: Loki
Scope: Web app onboarding + registration paths for local model runtimes beyond Ollama

## Objective
Enable specialists and attestation agents to onboard using any supported local runtime, not only Ollama.

Initial runtime targets:
1. Ollama
2. llama.cpp (`llama-server`)
3. vLLM (OpenAI-compatible API server)
4. LM Studio (Local Server)

## Current constraint baseline
Today, onboarding and endpoint probes are effectively Ollama-first (`/api/tags` detection and Ollama copy).

Primary affected surfaces:
- `components/GuidedSetupModal.tsx`
- `app/register/page.tsx`
- `app/api/register/probe/route.ts`
- `app/api/register/local-check/route.ts`
- `app/onboarding/page.tsx` (runtime wording + assumptions)

## Phase map

### Phase I1 — Runtime abstraction for setup/probe (foundation)
Build:
- Add runtime enum shared by UI + API (e.g. `ollama|llama_cpp|vllm|lm_studio|auto`)
- Add runtime-aware probe strategy:
  - OpenAI-compatible check: `GET /v1/models`
  - Ollama-compatible check: `GET /api/tags`
  - Health fallback: `GET /healthz`
- Return normalized probe response shape:
  - `status` (`runtime_detected|reachable|unreachable|unsupported`)
  - `detectedRuntime`
  - `models[]`
  - `hints[]`

Verify:
- Route tests for each probe path and fallback ordering
- Unknown/invalid endpoint shape tests

PR checkpoint: **PR-A (I1 foundation)**

---

### Phase I2 — Quick Setup runtime selector + instructions
Build:
- Add runtime selector in `GuidedSetupModal`
- Add per-runtime instructions and commands:
  - Ollama: install + `ollama pull ...`
  - llama.cpp: `./llama-server -m model.gguf --port 8080`
  - vLLM: `python -m vllm.entrypoints.openai.api_server --model ...`
  - LM Studio: Local Server tab flow
- Add runtime-specific manual verification commands
- Keep manual bypass controls for probe failures

Verify:
- UI state tests for runtime switch + instruction rendering
- Probe result text reflects detected runtime, not Ollama-only wording

PR checkpoint: **PR-B (I2 setup UX)**

---

### Phase I3 — Register page runtime-aware endpoint validation
Build:
- Add runtime selection/persistence on registration path
- Update endpoint probe copy/status:
  - runtime-neutral language
  - detected runtime shown when available
- Autofill model heuristics from detected model list regardless of runtime

Verify:
- Route + UI tests for registration probe states across runtimes

PR checkpoint: **PR-C (I3 registration UX + validation)**

---

### Phase I4 — Onboarding wizard runtime parity
Build:
- Replace hardcoded “Ollama port/runtime” assumptions where possible with generic local runtime fields
- Maintain Ollama bootstrap as optional convenience path, but support non-Ollama manual mode
- Clarify token-gated endpoint flow remains runtime-agnostic if OpenAI/Ollama-compatible inference path exists

Verify:
- Onboarding step gating works for selected runtime path
- Existing Ollama path remains backwards-compatible

PR checkpoint: **PR-D (I4 onboarding parity + compatibility)**

## Non-goals (this cycle)
- Auto-installing non-Ollama runtimes
- Full runtime-specific performance benchmarking
- Multi-model orchestration policy changes

## Risks and mitigations
1. **Divergent API semantics across runtimes**
   - Mitigation: normalize probe contract, keep tolerant parsing
2. **User confusion around base URL/port mismatches**
   - Mitigation: runtime-specific examples + explicit validation hints
3. **Regression for current Ollama users**
   - Mitigation: Ollama remains default path; add compatibility tests first

## Deliverables
- Runtime abstraction + probe normalization
- Runtime-diverse onboarding copy in Quick Setup + Register + Wizard
- Test coverage for probe/UX paths
- Progressive PR trail (I1 → I4)

## Definition of done
- A user can onboard a specialist/attestor with Ollama, llama.cpp, vLLM, or LM Studio using documented steps in-app
- Probe and error states are runtime-aware and actionable
- Existing Ollama onboarding still works unchanged for current users
