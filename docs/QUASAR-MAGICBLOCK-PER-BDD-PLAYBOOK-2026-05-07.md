# Quasar-native MagicBlock PER — BDD iterative build playbook

_Date:_ 2026-05-07 AEST  
_Issue:_ #253  
_Goal:_ Build a MagicBlock PER-specific Quasar escrow path without mutating the existing reusable Quasar escrow ABI.

## North star

The final MagicBlock proof path must be Quasar-native and must not depend on Anchor-compiled Solana programs. Existing `experiments/quasar-escrow` remains the reusable base escrow rail for future privacy integrations. MagicBlock PER gets its own purpose-built Quasar program/ABI so it can use MagicBlock's exact 8-byte undelegate callback discriminator.

## Explicit decisions

1. **Keep current Quasar escrow stable.** Do not convert `experiments/quasar-escrow` from single-byte discriminators.
2. **Create a PER-specific Quasar escrow program.** New source should live separately, initially under `experiments/quasar-escrow-per/` unless implementation retros reveal a better path.
3. **Use 8-byte discriminators in the PER program.** This accommodates MagicBlock's required callback discriminator `[196, 28, 41, 206, 48, 37, 51, 167]` without a raw-dispatch shim.
4. **Manual MagicBlock CPI only.** Use Quasar explicit CPI, PDA signing, unchecked/remaining accounts, and manual instruction layouts. No Anchor macros or Anchor-compiled final program path.
5. **Devnet tx approval is granted for this workstream.** Devnet signing/txs are allowed when needed to reach the goal, bounded to minimal lamports/test state and captured in artifacts. Mainnet and paid provider actions still require separate approval.
6. **Every phase ends with retrospective + plan refinement.** No silent leapfrogging.

## Phase loop contract

Each phase follows this loop:

1. **Expectation:** record what should become true.
2. **BDD scenario:** add or update a Gherkin scenario or executable guard.
3. **Implementation slice:** smallest meaningful change.
4. **Validation:** run the smallest relevant local checks; devnet txs only when the phase calls for them.
5. **Retrospective:** write expected vs observed, surprises, blocker, safety review, decision.
6. **Plan refinement:** update this file and `STATUS.md` before continuing.
7. **Update:** concise group update after each phase loop.

Retrospective template:

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

## Staged plan

### Phase 0 — Decision lock + BDD harness

**Expectation:** The repo records the PER-specific strategy and has an indexed BDD scenario preventing future drift back to mutating the reusable Quasar escrow ABI.

**BDD scenarios:**

- Existing reusable Quasar escrow remains single-byte/reference-compatible.
- PER escrow is a separate Quasar-native program with 8-byte discriminator policy.
- MagicBlock PER final path forbids Anchor macros/Anchor-compiled Solana program fallback.

**Implementation slice:** This playbook + BDD feature/index update + STATUS update.

**Validation:** `npm run test:bdd:index`, `git diff --check`.

### Phase 1 — PER program scaffold and ABI guard

**Expectation:** A separate `experiments/quasar-escrow-per` crate compiles locally and exposes an 8-byte discriminator map including the MagicBlock undelegate callback.

**Implementation slice:** Copy the minimal escrow state/instructions into a new PER crate, adapt discriminators to 8 bytes, keep existing escrow untouched, and add a script/test that fails if PER discriminator lengths drift.

**Validation:** cargo test/check for new PER crate, full Quasar program test script if cheap enough, discriminator guard.

### Phase 2 — MagicBlock layout fixtures and manual CPI codec

**Expectation:** MagicBlock permission/delegation instruction bytes and account metas are generated from deterministic Quasar-native codecs and match known SDK-derived fixtures.

**Implementation slice:** `magicblock/constants.rs`, `magicblock/layout.rs`, `magicblock/cpi.rs` with tests against `artifacts/magicblock-cpi-layout/latest.json` or a regenerated fixture.

**Validation:** fixture generation, Rust unit tests, no Anchor macro imports.

### Phase 3 — Local PER lifecycle tests

**Expectation:** Local QuasarSVM/LiteSVM tests can execute the PER program's escrow lifecycle and verify PDA signer/account validation boundaries without live MagicBlock network dependency.

**Implementation slice:** Add local tests for lock/delegate-intent/release/commit/undelegate callback paths using mock or fixture program IDs where direct MagicBlock programs are unavailable locally.

**Validation:** local cargo tests and program test script.

### Phase 4 — Devnet deployment prep and bounded deploy

**Expectation:** The PER-specific Quasar program deploys to devnet under a new program ID, recorded separately from the reusable Quasar escrow ID.

**Implementation slice:** build-sbf/deploy script or operator checklist, deployment inventory entry, evidence artifact directory.

**Validation:** read-only executable account check after devnet deploy; tx/deploy signature captured. Devnet approval is already granted for this workstream.

### Phase 5 — Devnet MagicBlock Permission/PER transaction loop

**Expectation:** Devnet txs create permission/delegation state for the PER escrow PDA using Quasar-native CPI and route through the MagicBlock PER/TEE boundary.

**Implementation slice:** bounded smoke script that locks tiny SOL, creates permission/delegation, routes private release/commit/undelegate attempts, and captures all signatures/errors.

**Validation:** evidence pack with tx signatures, RPC readbacks, MagicBlock PER router/TEE request evidence, and explicit success/failure boundary.

### Phase 6 — Final evidence + demo integration guard

**Expectation:** Judge/operator evidence can honestly claim Quasar-native MagicBlock PER only if Phase 5 proves settlement; otherwise it clearly presents the remaining boundary without overstating.

**Implementation slice:** update judge packet, operator checklist, demo evidence generator, and readiness guard.

**Validation:** `npm run check:quasar:submission`, relevant MagicBlock smoke, BDD index, build/lint if UI touched.

## Phase retrospectives

### Retrospective — Phase 0

- **Expected:** The repository should capture Nissan's explicit direction: preserve existing Quasar escrow, build PER separately, use BDD loops, and allow bounded devnet txs.
- **Observed:** The direction is now captured in this playbook, `STATUS.md`, GitHub issue #253, and indexed Bucket M BDD scenarios.
- **Validation:** `npm run test:bdd:index` passed; `git diff --check` passed.
- **What worked:** The BDD feature turns the architectural decision into a drift guard: reusable escrow must stay separate, PER must use 8-byte discriminators, and Anchor fallback is disallowed for final runtime proof.
- **What failed / surprised us:** Creating the GitHub issue initially exposed a shell quoting footgun with Markdown backticks; issue body was repaired using `--body-file` and the learning was logged in `.learnings/2026-05-07-gh-issue-body-backticks.md`.
- **Safety / approval review:** Docs/BDD/GitHub issue only; no signing/deployment/wallet mutation in Phase 0. Devnet tx approval is recorded for later phases only.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 1 should start with a minimal separate crate scaffold and discriminator guard before adding MagicBlock CPI complexity. Keep the old escrow source as a reference, not an edited base.
