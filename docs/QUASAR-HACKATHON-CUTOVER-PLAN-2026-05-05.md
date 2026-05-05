# Quasar Hackathon Cutover Plan

_Date:_ 2026-05-05 AEST
_Issue:_ #236
_Status:_ Phase 0 plan/spec. No signing, deployment, wallet mutation, env mutation, or live paid/provider calls performed.

## Decision reversal

Prior Quasar docs treated Quasar as fork-isolated/post-hackathon optimisation. Nissan has now changed the product goal:

> Hackathon submission and all demos must use Quasar-deployed Solana programs.

This document supersedes the older "Anchor now, Quasar later" submission posture for demo/submission readiness. Anchor may remain as a legacy/reference implementation until parity is complete, but it must not be presented as the hackathon demo proof after cutover.

## Current state audit

- Canonical CI is still Anchor-named and Anchor-executing: `.github/workflows/anchor-test.yml` installs Anchor CLI 1.0.0 and runs `anchor build --ignore-keys`.
- Canonical on-chain program code is still Anchor-based: `programs/escrow/Cargo.toml` depends on `anchor-lang = 1.0.0`.
- Frontend program config still assumes Anchor instruction/account discriminators and layouts in `lib/program.ts`.
- Quasar parity reports exist for escrow, registry, reputation, and attestation; PER parity is partial/conditional.
- A stale `feature/wire-quasar-programs` branch exists, but it is not directly mergeable because it diverges heavily, deletes many current files, and includes vendored `node_modules`. Use it only as a research artifact.

## Cutover principle

All hackathon demo surfaces must answer three questions clearly:

1. **Which Quasar program ID is this using?**
2. **Which deployment/evidence artifact proves that program is deployed and demo-relevant?**
3. **Which demo routes/scripts/readiness checks would fail if the app silently fell back to Anchor?**

If any answer is missing, that phase is not submission-ready.

## Guardrails

Allowed without further approval:

- Local docs/spec/BDD changes.
- Local static/source checks.
- Local config scaffolding that does not mutate secrets or deployment environments.
- Reading public GitHub/docs and existing repo artifacts.

Requires explicit approval before action:

- Any signing operation.
- Any wallet mutation.
- Any devnet deployment or transfer.
- Any Coolify/Vercel/env/secret mutation.
- Any paid provider call.
- Any live specialist/research execution beyond current approved local-only checks.

## BDD iterative phases

### Phase 0 — Decision lock and migration plan

**Expectation:** The repo records Quasar-deployed programs as the hackathon demo target and stops treating Anchor CI as sufficient submission proof.

**Implementation:** This plan, BDD scenario, STATUS update, and Issue #236.

**Acceptance:**

- Plan states the new Quasar target and supersedes prior Anchor-first submission posture.
- BDD scenario requires Quasar-deployed program alignment for hackathon demos.
- STATUS points future work at Quasar cutover.

**Validation:**

- `npm run test:bdd:index`
- `git diff --check`

**Retrospective:** Required before Phase 1.

### Phase 1 — Quasar deployment inventory and config contract

**Expectation:** The repo has one canonical place for Quasar deployment metadata.

**Implementation:** `config/quasar/deployments.json` plus `npm run check:quasar:deployments`.

**Acceptance:**

- A local check can load the inventory and verify required fields exist.
- Missing Quasar program IDs fails locally.
- Anchor program IDs are allowed only under explicit `legacyAnchorReference`, not as demo target IDs.

**Validation:**

- `npm run check:quasar:deployments`
- `npm run test:bdd:index`
- `git diff --check`

**Retrospective:** Complete locally. Known Quasar candidate ID exists and is executable on devnet by read-only RPC check, but this is not enough for submission readiness because runtime wiring and PER/judge-packet proof chain are still incomplete. No deployment/signing approval has been used.

### Phase 2 — Demo/readiness guardrail

**Expectation:** Demo submission checks fail if hackathon demo surfaces target Anchor-only evidence.

**Implementation:** `npm run check:quasar:demo-readiness` plus Quasar cutover notes in the judge packet and operator checklist.

**Acceptance:**

- `npm run check:quasar:demo-readiness` fails without Quasar metadata.
- Judge packet/readiness docs reference Quasar deployment evidence, not Anchor-only CI.
- `submissionReady=false` is allowed only when known gaps and approval-gated blockers are explicit.

**Validation:**

- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`

**Retrospective:** Complete locally. The guard now prevents us from accidentally treating the Anchor-era judge packet as final Quasar proof. UI/runtime copy needs Phase 3 wiring next because `lib/program.ts` still assumes Anchor-compatible instruction/account layouts.

### Phase 3 — Runtime/demo wiring

**Expectation:** Demo code resolves Quasar program IDs from the new config when in hackathon/demo mode.

**Implementation target:** Update `lib/program.ts`, network profiles, demo routes/scripts, and visible UI copy to use Quasar deployment metadata for hackathon demos while leaving Anchor as a clearly-labelled legacy/reference path if still needed.

**Acceptance:**

- Local tests prove Quasar IDs are used in hackathon/demo mode.
- Tests prove legacy Anchor IDs are not silently used.
- UI surfaces state Quasar deployment status honestly.

**Retrospective:** Decide whether Anchor CI should be removed, renamed, or kept as legacy reference.

### Phase 4 — CI cutover

**Expectation:** PR/main checks reflect the Quasar submission path.

**Implementation target:** Add QuasarSVM/build/readiness CI or rename legacy Anchor CI so it cannot be mistaken for final submission proof.

**Acceptance:**

- Quasar checks run in CI or a documented blocker explains why local-only Quasar checks are temporarily required.
- Anchor check, if retained, is named legacy/reference.
- Judge packet proof chain cites Quasar checks/evidence.

**Retrospective:** Decide whether submission is ready or deployment/signing approval is required.

### Phase 5 — Final Quasar judge packet and rehearsal

**Expectation:** The final submission packet and operator rehearsal use Quasar-deployed programs.

**Implementation target:** Refresh judge packet, operator checklist, local rehearsal, and STATUS around Quasar proof.

**Acceptance:**

- Final packet answers the three cutover questions.
- Rehearsal demonstrates demo flow against Quasar-targeted metadata/evidence.
- Approval-gated items remain explicit.

## Phase 0 retrospective

_Status:_ Complete locally; ready for PR.

- **What worked:** The audit found a clear mismatch: our latest submission-readiness loop was rigorous, but it validated the current Anchor-based repo state rather than the newly stated Quasar demo goal.
- **What failed or surprised us:** A stale `feature/wire-quasar-programs` branch exists, but it is too divergent and polluted to merge directly. We need a clean forward-port, not a branch resurrection.
- **Safety review:** Phase 0 was docs/issue/source inspection only. No signing, deployment, wallet mutation, env mutation, paid calls, or live specialist execution.
- **Plan adjustment:** Phase 1 must inventory actual Quasar deployment IDs/evidence before runtime wiring. If no valid deployed Quasar IDs exist, the next honest blocker is explicit approval to deploy/sign.
