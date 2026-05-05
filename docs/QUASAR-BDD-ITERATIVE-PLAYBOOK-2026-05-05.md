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

### Phase 4 — Quasar compatibility audit and builder boundary

**Expectation:** The repo identifies which runtime paths are safe to run against Quasar and which still assume Anchor discriminators/account layouts.

**BDD scenarios:**

- Given the demo target is Quasar, when a transaction builder is selected, then it must either use a verified Quasar-compatible builder or fail with a clear compatibility blocker.
- Given an account decoder reads Quasar-targeted accounts, then it must not apply Anchor account layout unless compatibility is documented.

**Implementation:** `config/quasar/runtime-compatibility.json` plus `npm run check:quasar:runtime-compatibility`.

**Acceptance:**

- Demo-critical transaction/decode paths are listed with compatibility status.
- `submissionReady=true` is impossible while any path is `anchor-layout-only` or `blocked-pending-quasar-port`.
- BDD scenario documents the builder boundary.

**Validation:**

- `npm run check:quasar:runtime-compatibility`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`

### Retrospective — Phase 4

- **Expected:** Identify Anchor-only runtime paths before porting builders.
- **Observed:** Nine demo-critical paths still depend on Anchor-style discriminators, account layouts, or inline Anchor-era transaction construction.
- **Validation:** Runtime compatibility guard passes while clearly reporting blockers.
- **What worked:** Static boundary gives us a safe failing-forward contract without needing signing or live devnet execution.
- **What failed / surprised us:** The demo-agent path is the densest blocker because it builds escrow, reputation, attestation, and PER instructions inline.
- **Safety / approval review:** Static repo audit only; no signing, deployment, wallet/env mutation, paid calls, or live execution.
- **Decision:** continue with builder porting; do not request live validation yet.
- **Plan changes for next phase:** Phase 5 should start with extracting/porting shared Quasar instruction builders before touching the PER-heavy demo-agent flow.

### Phase 5 — Quasar transaction builder port

**Expectation:** Demo-critical transactions have Quasar-compatible instruction data/account metadata or are deliberately disabled with a blocker.

**Implementation:** First slice adds `lib/quasar/instruction-builders.ts` with shared Quasar instruction-data builders for registry, reputation, and attestation. PER remains blocked.

**Acceptance:**

- Builders use one-byte Quasar discriminators, not Anchor 8-byte SHA256 discriminators.
- Builders use fixed-size Quasar argument layouts from parity source/tests.
- Invalid fixed-size inputs fail before transaction construction.
- Runtime compatibility inventory records the new shared builder module as `quasar-compatible` while existing Anchor-layout runtime paths remain blocked.

**Validation:**

- `npx jest --runTestsByPath lib/quasar/__tests__/instruction-builders.test.ts --runInBand`
- `npm run check:quasar:runtime-compatibility`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`

### Retrospective — Phase 5 / Slice 1

- **Expected:** Extract a safe shared Quasar instruction-data boundary before touching live transaction surfaces.
- **Observed:** Registry/reputation/attestation data builders can be ported locally from Quasar parity source/tests without signing or devnet execution.
- **Validation:** Builder tests assert one-byte discriminators, fixed-size layouts, u128 job-id bytes, and invalid input guards.
- **What worked:** Keeping builders in `lib/quasar/*` avoids contaminating existing Anchor builders and makes compatibility explicit.
- **What failed / surprised us:** PER cannot ride this slice; it still needs separate semantic validation because the TEE path is not proven by the QuasarSVM parity tests.
- **Safety / approval review:** Local source/tests only; no signing, deployment, wallet/env mutation, paid calls, or live execution.
- **Decision:** continue with account-meta/transaction wrapper port next.
- **Plan changes for next phase:** Phase 5 Slice 2 should wrap these data builders in transaction-instruction helpers for registry first, then update blocked runtime paths one at a time.

### Phase 5 — Slice 2: Registry transaction-instruction wrappers

**Expectation:** The shared Quasar registry data builders can be wrapped into Solana `TransactionInstruction`s with Quasar account metas/order, without sending or signing.

**Implementation:** `lib/quasar/instructions.ts` adds registry helpers for register/update/deregister plus PDA derivation.

**Validation:**

- `npx jest --runTestsByPath lib/quasar/__tests__/instructions.test.ts lib/quasar/__tests__/instruction-builders.test.ts --runInBand`
- `npm run check:quasar:runtime-compatibility`
- `npm run check:quasar:deployments`
- `npm run check:quasar:demo-readiness`
- `npm run test:bdd:index`
- `git diff --check`

### Retrospective — Phase 5 / Slice 2

- **Expected:** Registry helpers can be made Quasar-compatible without touching live app flows.
- **Observed:** Register/update/deregister wrappers now produce Quasar program IDs, PDA derivation, account metas, and one-byte discriminator data locally.
- **Validation:** Jest verified account order/signers/writability/data for registry wrappers.
- **What worked:** Registry was the right first wrapper because Quasar parity source has simple account metas and no PER dependency.
- **What failed / surprised us:** This does not reduce the 9 existing blocked runtime paths yet because app/demo surfaces still import Anchor-era builders; the next loop must swap one runtime surface deliberately.
- **Safety / approval review:** Local construction tests only; no signing, send, deployment, wallet/env mutation, paid calls, or live execution.
- **Decision:** continue.
- **Plan changes for next phase:** Port one low-risk runtime surface to use registry wrappers under explicit Quasar mode, or keep it disabled with a visible blocker if transaction sending would be required.

### Phase 6 — Quasar demo UI honesty

**Expectation:** `/economic-demo` visibly shows Quasar program target, deployment status, submission readiness, and known gaps.

**Implementation plan:**

- Add visible Quasar status card to `/economic-demo`.
- Separate controlled x402/local evidence from Quasar on-chain proof.
- Update payment readiness API/types if useful.

**Validation candidates:**

- targeted UI/Jest tests,
- `npm run build`,
- readiness scripts.

**Retrospective requirement:** Decide whether judge packet can be refreshed or if more proof is needed.

### Phase 7 — CI cutover from Anchor proof to Quasar proof

**Expectation:** CI no longer presents Anchor as final hackathon proof.

**Implementation plan:**

- Rename legacy Anchor workflow/check to `Legacy Anchor Reference` or equivalent.
- Add Quasar readiness check workflow.
- Add QuasarSVM/build checks if available without unsafe external mutation.

**Validation candidates:**

- GitHub Actions checks,
- source-conformance and BDD gates.

**Retrospective requirement:** Decide whether Anchor CI remains as reference or is removed from required checks.

### Phase 8 — Judge packet refresh

**Expectation:** Public packet describes the Quasar-deployed demo path and no longer leans on Anchor-era evidence.

**Implementation plan:**

- Refresh judge packet, operator checklist, and submission wording.
- Include Quasar program ID, evidence, compatibility status, known gaps, and approval-gated boundaries.
- Keep any unproven PER/privacy claims out of final copy.

**Validation candidates:**

- `check:quasar:demo-readiness`,
- docs grep/guard for Anchor-as-final-proof language,
- PR checks.

**Retrospective requirement:** Decide if `submissionReady` can become true or remains blocked.

### Phase 9 — Approval-gated live validation, only if needed

**Expectation:** If the previous phases show local proof is insufficient, request exactly the missing approval.

**Possible approvals:**

- devnet signing,
- wallet funding/transfer,
- program deployment/redeployment,
- environment mutation,
- live hosted demo run.

**Validation candidates:**

- explicit approved runbook,
- captured public-safe evidence,
- no extra live actions beyond approval scope.

**Retrospective requirement:** Decide final submission readiness.

## Active next step

Start **Phase 4: Quasar compatibility audit and builder boundary**.

First implementation slice:

1. Add BDD scenario for Quasar builder compatibility boundary.
2. Add local guard/test that blocks known Anchor-only transaction builders in Quasar mode unless they declare compatibility status.
3. Run targeted tests.
4. Write Phase 4 retrospective and refine Phase 5 based on findings.
