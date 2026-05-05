# Quasar Hackathon Cutover — BDD Iterative Playbook

_Date:_ 2026-05-05 AEST
_Issue:_ #236
_Goal:_ All hackathon submission demos use Quasar-deployed Solana programs.
_Method:_ Small BDD loops with a retrospective after every phase, then plan refinement before the next phase starts.

## North star

The hackathon demo must not silently rely on the legacy Anchor deployment. Every demo, judge packet, operator checklist, and readiness script must be able to answer:

1. Which Quasar program ID is used?
2. What proof says it is deployed and relevant?
3. What fails if the demo falls back to Anchor?
4. Which gaps are still approval-gated or unverified?

## Non-negotiable guardrails

No phase may perform these without explicit Nissan approval:

- signing operations,
- wallet mutation,
- devnet transfer,
- program deployment/redeployment,
- Coolify/Vercel/environment mutation,
- paid provider calls,
- live provider/specialist execution.

If a phase discovers one of these is required, stop that phase at a blocker and write the retrospective.

## Loop template for every phase

Each phase must be done as a separate, reviewable loop:

1. **Expectation** — write the BDD expectation before implementation.
2. **Scenario(s)** — add or update Gherkin/Bucket scenario where appropriate.
3. **Implementation slice** — smallest code/docs change that tests the expectation.
4. **Validation** — run the smallest meaningful gates for that slice.
5. **Retrospective** — write what worked, what failed/surprised us, blockers, and plan tweaks.
6. **Plan refinement** — update this playbook and `STATUS.md` before moving to the next phase.
7. **PR + merge discipline** — keep each loop PR scoped; merge only after checks are green or a blocker is explicitly documented.

## Retrospective format

Append this block under the relevant phase before proceeding:

```md
### Retrospective — Phase N

- **Expected:**
- **Observed:**
- **Validation:**
- **What worked:**
- **What failed / surprised us:**
- **Safety / approval review:**
- **Decision:** continue / adjust / block
- **Plan changes for next phase:**
```

## Current completed loops

### Phase 0 — Decision lock

**Expectation:** The repo records that Quasar-deployed Solana programs are the hackathon demo target.

**Delivered:** PR #237 added the cutover plan and BDD scenario.

**Validation:**

- `npm run test:bdd:index`
- `git diff --check`
- GitHub checks on PR #237

### Retrospective — Phase 0

- **Expected:** Replace the old “Anchor now, Quasar later” posture with a Quasar hackathon target.
- **Observed:** The old docs were clear but outdated; the decision needed explicit reversal so future loops would not drift back to Anchor proof.
- **Validation:** BDD index and PR checks passed.
- **What worked:** Decision was captured early before more runtime work happened.
- **What failed / surprised us:** The stale `feature/wire-quasar-programs` branch was unsafe to revive wholesale.
- **Safety / approval review:** Docs/BDD only; no signing, deployment, wallet/env mutation, or paid calls.
- **Decision:** continue.
- **Plan changes for next phase:** Inventory Quasar deployment evidence before wiring runtime.

### Phase 1 — Deployment inventory

**Expectation:** One canonical repo-local inventory records Quasar deployment metadata and separates it from legacy Anchor references.

**Delivered:** PR #237 added:

- `config/quasar/deployments.json`
- `npm run check:quasar:deployments`
- candidate devnet Quasar program `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`

**Validation:**

- `npm run check:quasar:deployments`
- read-only `solana account ... --url https://api.devnet.solana.com` confirmed executable account
- GitHub checks on PR #237

### Retrospective — Phase 1

- **Expected:** Find or create a safe local source of truth for Quasar program IDs.
- **Observed:** Candidate Quasar ID exists and is executable, but deployment existence alone is not demo readiness.
- **Validation:** Inventory check passed; read-only RPC check showed executable=true.
- **What worked:** Captured legacy Anchor ID separately as reference only.
- **What failed / surprised us:** Evidence did not yet prove instruction/layout compatibility or PER parity.
- **Safety / approval review:** Read-only RPC only; no signing/deployment/wallet mutation.
- **Decision:** continue with `submissionReady=false`.
- **Plan changes for next phase:** Add readiness guard that makes known gaps explicit.

### Phase 2 — Demo readiness guard

**Expectation:** The repo fails safely if someone tries to treat Anchor-era judge packet evidence as final Quasar hackathon proof.

**Delivered:** PR #238 added:

- `npm run check:quasar:demo-readiness`
- Quasar notes in judge packet/operator checklist
- explicit blocker handling while `submissionReady=false`

**Validation:**

- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`
- GitHub checks on PR #238

### Retrospective — Phase 2

- **Expected:** Prevent accidental use of Anchor-era packet as final Quasar proof.
- **Observed:** Guard works and surfaces known gaps while still passing as an honest readiness check.
- **Validation:** Local gates and PR checks passed.
- **What worked:** The check prints `BLOCKED` plus known gaps instead of silently pretending ready.
- **What failed / surprised us:** The current public packet needed stronger language to avoid being reused incorrectly.
- **Safety / approval review:** Docs/script only; no external mutation.
- **Decision:** continue.
- **Plan changes for next phase:** Wire explicit runtime target selection but label layout compatibility as unverified.

### Phase 3 — Explicit runtime target selection

**Expectation:** Demo/runtime config can intentionally select the Quasar devnet program without relying on unsafe override behavior.

**Delivered:** PR #239 added:

- `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar`
- `HACKATHON_DEMO_TARGET=quasar`
- `DEMO_PROGRAM_TARGET=quasar`
- runtime exports: `PROGRAM_TARGET`, `PROGRAM_FRAMEWORK`, `PROGRAM_COMPATIBILITY`, `PROGRAM_SUBMISSION_READY`, `PROGRAM_KNOWN_GAPS`
- tests proving Quasar selection is explicit and legacy Anchor remains default otherwise

**Validation:**

- `npx jest --runTestsByPath lib/__tests__/quasar-demo-program-config.test.ts lib/__tests__/program-network-alignment.test.ts lib/__tests__/program-rpc-config.test.ts --runInBand`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`
- GitHub checks on PR #239

### Retrospective — Phase 3

- **Expected:** Runtime can point to Quasar only when the demo target is explicit.
- **Observed:** Config now resolves `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW` in explicit Quasar/devnet mode and exposes `quasar-layout-unverified`.
- **Validation:** Local Jest target tests passed; PR checks passed.
- **What worked:** We avoided unsafe `NEXT_PUBLIC_ESCROW_PROGRAM_ID` overrides as the primary cutover path.
- **What failed / surprised us:** Package-level demo-agent `tsc` has a pre-existing rootDir/import issue from `packages/x402-solana/src` imports outside `packages/demo-agents/src`.
- **Safety / approval review:** Runtime/config/tests only; no signing/deployment/wallet/env mutation.
- **Decision:** continue, but do not claim Quasar transaction compatibility yet.
- **Plan changes for next phase:** Verify Quasar instruction builders/account layouts and isolate incompatible Anchor assumptions.

## Upcoming phased plan

This is the staged plan from the current PR onward. Each phase remains a separate BDD loop unless the slice is explicitly marked as a sub-slice inside the same PR. After every phase/slice, append the retrospective block above, then refine the next phase before implementation continues.

### Phase 4 — Quasar compatibility audit and builder boundary ✅ complete

**Expectation:** The repo identifies which runtime paths are safe to run against Quasar and which still assume Anchor discriminators/account layouts.

**Delivered:** `config/quasar/runtime-compatibility.json` plus `npm run check:quasar:runtime-compatibility`.

**Current result:** Guard audits 14 demo-critical paths and blocks submission readiness while Quasar-incompatible paths remain.

**Retrospective status:** Written above.

### Phase 5 — Quasar transaction builder port 🟡 active in PR #244

**Expectation:** Demo-critical transactions have Quasar-compatible instruction data/account metadata or are deliberately disabled with a blocker.

**Delivered in slices so far:**

1. Shared instruction-data builders for registry, reputation, and attestation.
2. Registry + attestation `TransactionInstruction` wrappers.
3. `/register` target-aware Quasar construction.
4. Demo-agent registration target-aware Quasar construction.
5. Onboarding `attest_quality` target-aware Quasar construction.

**Current result:** Runtime blockers reduced from 9 to 6. Remaining blockers are:

- `lib/program.ts` — shared builders/decoders still document Anchor account assumptions.
- `app/onboarding/page.tsx` — confirm/dispute transaction paths still use shared Anchor builders.
- `lib/onboarding/reputation-signal.ts` — commit/reveal reputation builders remain Anchor-layout-only.
- `lib/registry/bridge.ts` — registry read/decode path filters Anchor account discriminators.
- `lib/useOnchainAgents.ts` — client agent fetch/decode path filters Anchor account discriminators.
- `packages/demo-agents/src/demo.ts` — escrow/reputation/attestation/PER flow still has inline Anchor-era construction and PER uncertainty.

**Validation for current PR:**

- `npm run build`
- targeted Quasar/register/onboarding/demo-agent Jest suites
- `npm run check:quasar:runtime-compatibility`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`
- GitHub checks on PR #244 — green as of this checkpoint

**Retrospective status:** Slice retrospectives are written above through Phase 6 Slice 1. After PR #244 merge, add one merge retrospective recording check status, blocker count, and whether the plan should prioritize read/decode paths or reputation builders.

### Phase 6 — Quasar demo honesty surfaces

**Expectation:** Operator-facing demo surfaces show Quasar target, deployment status, submission readiness, and known gaps before anyone records or triggers a wallet path.

#### Slice 6.1 — Register page honesty ✅ active in PR #244

**Delivered:** `/register` shows Quasar target, compatibility, submission readiness, and known gaps.

**Retrospective status:** Written above.

#### Slice 6.2 — Economic demo status card ✅ implemented in PR #244

**BDD expectation:** `/economic-demo` must distinguish economic workflow evidence from Quasar on-chain proof.

**Implementation:** `/economic-demo` now renders a Solana program target card using centralized program/readiness metadata. It names the active program ID, target/framework, compatibility status, submission readiness, known Quasar proof gaps, and hard no-live-action boundary.

**Acceptance:**

- The page names the active program ID.
- The page says `submissionReady=blocked` while Quasar blockers remain.
- The page explicitly says controlled x402/OpenRouter evidence, Surfpool local rehearsal evidence, and storyboard dry-runs are not automatically final Quasar submission proof.
- No hosted call, signing, wallet mutation, devnet transfer, env mutation, or paid call is introduced.

**Validation:**

- `npm run build`
- `npm run check:quasar:runtime-compatibility`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`

### Retrospective — Phase 6 / Slice 2

- **Expected:** Economic demo should stop being ambiguous about what is economic workflow evidence versus Quasar on-chain proof.
- **Observed:** A visible status card can reuse existing centralized metadata; no new API or live call was needed.
- **Validation:** Build/readiness/BDD/diff gates are the required proof for this slice.
- **What worked:** The existing program metadata made this a UI honesty slice instead of a new state-management surface.
- **What failed / surprised us:** The page is a client component and already imports program metadata elsewhere in the app, so we kept the implementation simple rather than introducing a server API.
- **Safety / approval review:** UI/build only; no signing, send, deployment, wallet/env mutation, paid calls, or live execution.
- **Decision:** continue.
- **Plan changes for next phase:** Move from honesty surfaces back to blocker reduction. Phase 7 should start with read/decode compatibility because judge screenshots depend on not accidentally showing Anchor-filtered account data in Quasar mode.

### Phase 7 — Read/decode Quasar compatibility ✅ implemented in PR #244

**Expectation:** Marketplace and app read paths either decode Quasar accounts correctly or fail closed with explicit status.

**BDD scenarios:**

- Given the demo target is Quasar, when registry data is read for marketplace or `/agents`, then the path must not use Anchor account discriminator filtering unless marked legacy-only.
- Given Quasar account layout is not fully verified, when a reader would produce a misleading agent list, then it must surface a blocker instead of silently showing Anchor data.

**Implementation:**

1. Inspected Quasar attestation parity source for final AgentAccount layout: one-byte account discriminator `20`, 153-byte account data, fixed `model: [u8;64]`, and `attestation_accuracy` after bump.
2. Added target-aware account discriminator/data-size constants and `decodeQuasarAgentAccount` / `decodeActiveAgentAccount` in `lib/program.ts`.
3. Ported `lib/registry/bridge.ts` and `lib/useOnchainAgents.ts` to use active target filters and active decoder instead of Anchor-only memcmp/data-size/decode.
4. Added fixture tests for Quasar AgentAccount decoding and active Quasar mode.
5. Updated runtime compatibility inventory: read/decode blockers reduced from 6 to 4.

**Acceptance:**

- Read/decode blockers are reduced from 6 to 4.
- Quasar decoder has fixture tests covering discriminator, data size, fixed model layout, invalid discriminator, and invalid model length.
- Anchor decode remains available through legacy target mode.

**Validation:**

- `npx jest --runTestsByPath lib/__tests__/quasar-agent-account-decoder.test.ts --runInBand`
- `npm run check:quasar:runtime-compatibility`
- Full build/readiness/BDD gates before push.

### Retrospective — Phase 7

- **Expected:** Read/decode paths should stop filtering Quasar accounts with Anchor account discriminators and Anchor data sizes.
- **Observed:** The Quasar parity source gave exact offsets, letting us implement a deterministic decoder without live RPC or signing.
- **Validation:** Focused decoder tests passed; runtime compatibility now reports 4 blockers instead of 6.
- **What worked:** Reusing one active decoder/filter boundary fixed both server bridge and client hook without duplicating layout logic.
- **What failed / surprised us:** Quasar comments in test source used “disc=1” wording while the account macro uses discriminator 20; offset math and account macro confirm the actual account discriminator is byte 20.
- **Safety / approval review:** Local source/tests only; no signing, send, deployment, wallet/env mutation, paid calls, or live execution.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 8 should port reputation commit/reveal and remaining onboarding transaction paths; read/decode is now good enough for screenshots only if transaction readiness remains honestly marked blocked.

### Phase 8 — Reputation and onboarding remaining transaction paths

**Expectation:** Reputation commit/reveal and onboarding confirmation/dispute paths are Quasar-compatible or explicitly blocked.

**Implementation plan:**

1. Add Quasar reputation `TransactionInstruction` wrappers for commit/reveal/expire using parity layouts.
2. Route `lib/onboarding/reputation-signal.ts` through target-aware helpers.
3. Inspect `app/onboarding/page.tsx` for remaining Anchor-only confirm/dispute builders and route/disable them by target.
4. Update runtime compatibility and BDD scenario text.

**Acceptance:**

- Reputation signal path no longer uses Anchor 8-byte discriminators in Quasar mode.
- Onboarding UI does not expose unsupported Quasar wallet actions as ready.
- Remaining blockers are limited to escrow/PER/demo-agent full-flow if those are not yet ported.

**Validation candidates:** targeted reputation/onboarding Jest, build, runtime/readiness guards, BDD index, `git diff --check`.

**Retrospective requirement:** Decide whether to tackle escrow/PER or pivot to judge packet with scoped claims.

### Phase 9 — Demo-agent full flow and PER decision gate

**Expectation:** The submission demo has an honest Quasar-compatible path for the flows it shows, and PER is either proven under Quasar or explicitly scoped as fallback/future work.

**Implementation plan:**

1. Decompose `packages/demo-agents/src/demo.ts` into target-aware instruction helpers.
2. Port non-PER escrow/reputation/attestation construction where parity evidence exists.
3. Investigate PER parity report and current MagicBlock/TEE dependency assumptions.
4. Choose one of:
   - Quasar PER-compatible proof path,
   - non-PER Quasar demo path plus explicit PER limitation,
   - approval-gated live/local validation request if local evidence is insufficient.

**Acceptance:**

- Demo script does not silently run Anchor constructions when target is Quasar.
- PER claims in demo/judge packet match evidence.
- Any required signing/deployment/devnet/live action is stopped behind explicit Nissan approval.

**Validation candidates:** targeted demo-agent tests, package build/test, readiness guards, BDD index, optional approved Surfpool/local-only smoke if needed.

**Retrospective requirement:** Decide final proof boundary: Quasar full-flow proof, Quasar scoped proof, or blocked pending approval.

### Phase 10 — CI cutover from Anchor proof to Quasar proof

**Expectation:** CI and PR checks no longer present legacy Anchor as final hackathon proof, while preserving Anchor as reference if still useful.

**Implementation plan:**

- Rename legacy Anchor workflow/check wording to `Legacy Anchor Reference` or equivalent.
- Add Quasar readiness check to CI.
- Add QuasarSVM/build checks only if they run without unsafe external mutation.
- Ensure source-conformance and BDD gates still pass.

**Acceptance:**

- CI status names make the proof boundary obvious to judges/reviewers.
- Quasar readiness check runs in PRs and fails/blocks honestly when readiness is false.
- Anchor proof cannot be mistaken for Quasar proof.

**Validation candidates:** workflow syntax validation, PR checks, readiness scripts, BDD index.

**Retrospective requirement:** Decide whether Anchor CI remains required as reference or is removed from the hackathon proof chain.

### Phase 11 — Judge packet and submission refresh

**Expectation:** Public submission materials describe the Quasar-deployed demo path and do not lean on stale Anchor-era evidence.

**Implementation plan:**

- Refresh judge packet, operator checklist, form copy, and recording script.
- Include Quasar program ID, deployment evidence, compatibility status, known gaps, and approval-gated boundaries.
- Include current PR/CI proof chain.
- Keep unproven PER/privacy/live-settlement claims out of final copy.

**Acceptance:**

- A reviewer can see what is proven, what is local/simulated, and what is not claimed.
- The packet names the correct Quasar program target.
- All local ignored artifacts are referenced only as operator pointers, not published raw.

**Validation candidates:** `check:quasar:demo-readiness`, docs grep for Anchor-as-final-proof language, build/BDD, PR checks.

**Retrospective requirement:** Decide if `submissionReady` can become true or remains blocked.

### Phase 12 — Approval-gated final validation, only if needed

**Expectation:** If local/code/CI proof is insufficient, request exactly the missing approval and perform only the approved action.

**Possible approvals:**

- devnet signing,
- wallet funding/transfer,
- program deployment/redeployment,
- environment/Coolify/Vercel mutation,
- live hosted demo run,
- paid provider/specialist execution.

**Acceptance:**

- Approval request names scope, max calls/transactions, spend cap, rollback, and artifact output.
- Runbook performs no extra live actions beyond the approval scope.
- Public-safe evidence is captured and secret-scanned.

**Validation candidates:** approved runbook, captured evidence artifact, secret scan, readiness guards.

**Retrospective requirement:** Decide final submission readiness and final form/demo-video steps.

## Active next step

1. Merge or update **PR #244** with this refined staged plan.
2. After PR #244 is merged, begin **Phase 6 Slice 2: Economic demo Quasar status card**.
3. If Nissan prioritizes blocker reduction over UI clarity, skip Slice 6.2 and start **Phase 7: Read/decode Quasar compatibility** instead; record that decision in the retrospective before coding.
