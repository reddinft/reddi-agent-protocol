# Quasar CI Cutover BDD Playbook — 2026-05-06

## Goal

Replace final-demo integrity checks that currently depend on legacy Anchor `programs/escrow` with required CI that compiles and tests the Quasar-based Solana programs used by the final Colosseum demo.

The target state is **not** “no LiteSVM.” LiteSVM/QuasarSVM-style local execution remains useful. The target state is **no Anchor program tests masquerading as final Quasar proof**.

## Non-negotiable success criteria

1. Final required CI includes Quasar program compile/test coverage for escrow, registry, reputation, and attestation.
2. `quasar-readiness-guard.yml` remains required for app/demo/runtime wiring, so code cannot drift back to Anchor IDs/layouts.
3. Legacy Anchor CI is either removed from final-required checks or renamed/de-scoped as historical reference only.
4. Every phase ends with a retrospective and a refined next-step plan before proceeding.
5. No deployment, env/Coolify/Vercel mutation, paid/live specialist work, or live PER/TEE claim is introduced by this CI cutover.

## Current inventory — Phase 0 baseline

### Existing repo CI

- `.github/workflows/anchor-test.yml`
  - Current name: `Anchor Tests`
  - Job: `Build & Test (Anchor 1.0.0 / LiteSVM)`
  - Builds `programs/escrow` via `anchor build --ignore-keys`
  - Runs `cargo test --manifest-path programs/escrow/Cargo.toml`
  - This is legacy/reference coverage only.
- `.github/workflows/quasar-readiness-guard.yml`
  - Runs `npm run check:quasar:submission`
  - Validates runtime/config/readiness guardrails.
  - Does **not** compile or test Quasar program source.

### Quasar source locations discovered locally

- Registry: `/Users/loki/projects/reddi-agent-protocol/experiments/quasar-registry`
- Reputation: `/Users/loki/projects/reddi-agent-protocol/experiments/quasar-reputation`
- Attestation: `/Users/loki/projects/reddi-agent-protocol/experiments/quasar-attestation`
- Escrow POC used by final demo layout: `/Users/loki/.openclaw/workspace/projects/rrap-poc/experiments/quasar-escrow`
- Quasar framework dependency source: `/Users/loki/.openclaw/workspace/projects/colosseum-frontier/research/quasar/quasar-repo` at `0e7559496b86aebe300254d90baa7210672c1cbf`, remote `https://github.com/blueshift-gg/quasar`

### Immediate implication

The app repo currently does not contain the Quasar program source directories. A real Quasar program CI must first vendor/import those sources, then make their `quasar-lang` dependency CI-resolvable without relying on Nissan’s local absolute path.

## Phase plan

### Phase 0 — CI truth inventory and acceptance criteria

**BDD scenario**

Given PR #244 is the final Quasar cutover PR
When CI is evaluated for final readiness
Then we can distinguish legacy Anchor reference checks from Quasar final-proof checks
And the next phase has explicit inputs, blockers, and acceptance criteria.

**Actions**

- Inventory current workflows and local Quasar source locations.
- Document required target state and non-goals.
- Record whether the repo already contains Quasar program source.

**Validation**

- `find ... Cargo.toml` confirms Quasar sources exist locally but not in the app repo.
- Existing workflows inspected: `anchor-test.yml` and `quasar-readiness-guard.yml`.

**Retrospective checkpoint**

- If sources are missing from the app repo, do not edit required CI yet. First create/import stable source layout.
- If CI dependency paths are absolute/local-only, phase 1 must make them portable before adding a required workflow.

**Phase 0 retrospective — completed 2026-05-06**

- Expected: find an existing Quasar program test workflow or program source in repo.
- Actual: only runtime readiness guard exists in repo; Quasar program sources are split across local worktrees and use absolute `quasar-lang` paths.
- Adjustment: Phase 1 must be a source/dependency normalization phase, not a workflow-only phase.

### Phase 1 — Vendor/import Quasar program sources into this repo

**BDD scenario**

Given the final demo uses four Quasar programs
When a developer checks out the repo on CI
Then the escrow, registry, reputation, and attestation Quasar sources are present under a stable repo path
And no test depends on `/Users/loki/...` absolute paths.

**Proposed repo layout**

```text
experiments/quasar-escrow/
experiments/quasar-registry/
experiments/quasar-reputation/
experiments/quasar-attestation/
third_party/quasar/   # or a pinned git checkout/submodule strategy, decided in phase 1
```

**Actions**

- Copy/import the four Quasar program directories into `experiments/`.
- Decide dependency strategy:
  - preferred for hackathon stability: vendor/pin `third_party/quasar` from `blueshift-gg/quasar@0e7559496b86aebe300254d90baa7210672c1cbf`;
  - alternative: GitHub Actions checkout of `blueshift-gg/quasar` to a known path and patch Cargo paths during CI.
- Replace absolute `quasar-lang` paths with repo-relative paths.
- Run local compile/test for one program first, then all four.

**Validation target**

- `cargo test --manifest-path experiments/quasar-registry/Cargo.toml`
- `cargo test --manifest-path experiments/quasar-reputation/Cargo.toml`
- `cargo test --manifest-path experiments/quasar-attestation/Cargo.toml`
- escrow equivalent once imported.

**Retrospective checkpoint**

- If compile fails due to toolchain or Quasar SBF setup, split pure Rust/QuasarSVM tests from SBF builds.
- If vendoring Quasar is too large for this PR, use pinned CI checkout and document the exact commit.

### Phase 2 — Add Quasar program test workflow in non-destructive mode

**BDD scenario**

Given Quasar program sources are in the repo
When a PR touches `experiments/quasar-*`, Quasar config, or demo wiring
Then GitHub Actions runs Quasar program tests independently of Anchor CI.

**Actions**

- Add `.github/workflows/quasar-program-tests.yml`.
- Name required job clearly, e.g. `Quasar Program Tests (QuasarSVM/LiteSVM)`.
- Trigger on PRs touching:
  - `experiments/quasar-*/**`
  - `config/quasar/**`
  - `packages/demo-agents/**`
  - `lib/quasar/**`
- Keep `quasar-readiness-guard.yml` as a separate app/runtime guard.

**Validation target**

- Local equivalent script passes.
- PR check appears and passes at least once.

**Retrospective checkpoint**

- If runtime is too slow, cache cargo and split jobs by program.
- If one program is flaky, keep workflow required but quarantine only the flaky test with a documented issue and deadline.

### Phase 3 — De-scope legacy Anchor CI from final proof

**BDD scenario**

Given Quasar program tests are green in CI
When PR #244 is assessed for final readiness
Then the blocking final-proof checks are Quasar program tests + Quasar readiness guard, not Anchor tests.

**Actions**

- Rename `anchor-test.yml` to clarify historical scope, e.g. `Legacy Anchor Reference Tests`.
- Rename job from `Build & Test (Anchor 1.0.0 / LiteSVM)` to `Legacy Anchor Reference Tests (non-final proof)`.
- Decide whether to remove it from PR triggers or keep it on `workflow_dispatch` / main-only.
- Coordinate branch protection if required checks are pinned by name.

**Validation target**

- PR checks show Quasar checks as the final-proof path.
- No docs/operator surfaces describe Anchor CI as final demo proof.

**Retrospective checkpoint**

- If branch protection requires the old check name, do not rename until Nissan updates required-check settings.
- If legacy Anchor still protects useful regression behavior, keep it but mark non-final in docs and status.

### Phase 4 — Add anti-regression assertions that connect CI to final demo IDs

**BDD scenario**

Given Quasar program tests pass
When demo/runtime config changes
Then CI proves the app still points at the same Quasar program family and cannot silently route back to Anchor.

**Actions**

- Extend readiness scripts to verify Quasar program source/test inventory exists.
- Add a check that `submissionReady=true` requires `quasar-program-tests` evidence in docs/config.
- Keep MagicBlock PER/TEE boundary explicit: either live-validated on Quasar or not a final claim.

**Validation target**

- `npm run check:quasar:submission` fails if Quasar program test evidence is removed.
- `npm run build` remains green.

**Retrospective checkpoint**

- If source/test evidence coupling is too brittle, store a small manifest with program dirs, test commands, and last successful CI run URL.

### Phase 5 — Observe one full PR loop and update final docs

**BDD scenario**

Given Quasar program tests and readiness checks are both green on PR #244
When final docs/judge packet are reviewed
Then the proof chain is Quasar-native end-to-end and legacy Anchor is historical only.

**Actions**

- Wait for all GitHub checks.
- Update judge/operator docs with exact CI names and pass status.
- Update `STATUS.md` and daily memory.

**Retrospective checkpoint**

- Record what failed, what was slow, and whether any check should become required/optional.
- If all green, PR #244 can proceed under normal merge policy.

## Begin-next recommendation

Start Phase 1 next: import the four Quasar program directories into `experiments/`, normalize the `quasar-lang` dependency path, and run one local program test before adding/changing required GitHub workflows.


## Implementation log — 2026-05-06

### Phase 1 retrospective — completed

**What we expected:** importing the four Quasar program directories and normalizing `quasar-lang` paths would be enough to run local compile/tests.

**What happened:** the local source directories were huge only because they contained generated `target/` outputs. After excluding/removing build outputs, the actual source import is small and portable. The four programs now live in repo-local `experiments/quasar-*`, and the required Quasar framework crates are vendored under `third_party/quasar` from `blueshift-gg/quasar@0e7559496b86aebe300254d90baa7210672c1cbf`.

**Refinement:** Phase 2 can proceed immediately with a first-class workflow. We do not need to rename/de-scope Anchor CI yet; that remains Phase 3 after Quasar CI proves green on GitHub.

### Phase 2 retrospective — completed locally, pending GitHub PR run

**What we expected:** add a dedicated Quasar program workflow that compiles SBF and runs QuasarSVM/LiteSVM-style tests for all four programs.

**What happened:** `.github/workflows/quasar-program-tests.yml` and `scripts/run-quasar-program-tests.sh` were added. The local compile/test loop passed for:

- `experiments/quasar-escrow` — 7 tests passed
- `experiments/quasar-registry` — 10 tests passed
- `experiments/quasar-reputation` — 11 tests passed
- `experiments/quasar-attestation` — 13 tests passed

**Validation command:**

```bash
PATH="$HOME/.cargo/bin:$PATH" bash scripts/run-quasar-program-tests.sh
```

**Refinement for Phase 3:** do not remove/rename the legacy Anchor workflow until this new workflow is observed on PR #244. If GitHub branch protection is pinned to `Build & Test (Anchor 1.0.0 / LiteSVM)`, coordinate required-check updates before changing that name.
