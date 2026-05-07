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

### Retrospective — Phase 1

- **Expected:** A separate `experiments/quasar-escrow-per` crate compiles locally and exposes an 8-byte discriminator map including the MagicBlock undelegate callback.
- **Observed:** New PER crate is scaffolded separately from `experiments/quasar-escrow`, uses a fresh PER-specific program ID placeholder, keeps make/take/refund behavior via 8-byte discriminators, and adds a minimal `undelegate_callback` entrypoint with MagicBlock's exact discriminator.
- **Validation:** `npm run check:quasar:per-abi` passed; `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed; `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed 8/8; `npm run test:bdd:index` passed; full `scripts/run-quasar-program-tests.sh` passed for escrow, escrow-per, registry, reputation, and attestation.
- **What worked:** Quasar accepts 8-byte instruction discriminator arrays cleanly. The PER-specific crate can reuse the tested escrow lifecycle without altering the base escrow ABI.
- **What failed / surprised us:** An empty callback `Accounts` struct did not derive required Quasar traits; the callback needs at least a concrete account context. For Phase 1 we used a minimal unchecked mutable `escrow` account and documented that later phases must validate it as the delegated escrow PDA.
- **Safety / approval review:** Local compile/tests only; no signing, deployment, wallet mutation, or devnet txs in Phase 1.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 2 should not add live network behavior yet. First build deterministic MagicBlock CPI layout fixtures and account-meta tests around the PER crate, then wire CPI calls once byte/account parity is proven.

### Phase 2 — MagicBlock layout fixtures and manual CPI codec

**Expectation:** MagicBlock permission/delegation instruction bytes and account metas are generated from deterministic Quasar-native codecs and match known SDK-derived fixtures.

**Implementation slice:** `magicblock/constants.rs`, `magicblock/layout.rs`, `magicblock/cpi.rs` with tests against `artifacts/magicblock-cpi-layout/latest.json` or a regenerated fixture.

**Validation:** fixture generation, Rust unit tests, no Anchor macro imports.

### Retrospective — Phase 2

- **Expected:** MagicBlock permission/delegation instruction bytes and account metas are generated from deterministic Quasar-native codecs and match known SDK-derived fixtures.
- **Observed:** Added `experiments/quasar-escrow-per/src/magicblock/` with constants, no-heap instruction data layout helpers, and static account-meta plans for createPermission, delegatePermission, delegateEscrow, and commitAndUndelegatePermission. Tests pin the SDK fixture data hex and account signer/writable flags.
- **Validation:** `npm run evidence:magicblock:cpi-layout` regenerated the offline SDK fixture; `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed; `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed 15/15; `npm run check:quasar:per-abi` passed; `git diff --check` passed.
- **What worked:** Separating byte layout and account-meta plans before invoking CPI keeps Phase 2 deterministic and avoids live-network side effects. The existing Anchor-side fixture was useful as a byte/account reference without becoming final runtime code.
- **What failed / surprised us:** The new MagicBlock modules generate dead-code warnings until Phase 3/4 starts using them from CPI builders. This is acceptable for now; don't hide the warnings until the code is either used or intentionally library-exported.
- **Safety / approval review:** Offline fixture generation + local compile/tests only; no signing, deployment, wallet mutation, or devnet txs in Phase 2.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 3 should convert the static plans into concrete local-only validation/builder tests first. If direct `DynCpiCall` integration proves awkward, use a small intermediate builder that produces account/data descriptors before invoking.

### Phase 3 — Local PER lifecycle tests

**Expectation:** Local QuasarSVM/LiteSVM tests can execute the PER program's escrow lifecycle and verify PDA signer/account validation boundaries without live MagicBlock network dependency.

**Implementation slice:** Add local tests for lock/delegate-intent/release/commit/undelegate callback paths using mock or fixture program IDs where direct MagicBlock programs are unavailable locally.

**Validation:** local cargo tests and program test script.

### Retrospective — Phase 3

- **Expected:** Local QuasarSVM tests can execute the PER program's escrow lifecycle and verify the MagicBlock callback dispatch boundary before any live network dependency.
- **Observed:** Existing PER lifecycle tests still pass, and two callback tests now prove the exact MagicBlock undelegate callback discriminator dispatches locally while a mutated discriminator is rejected. This validates the PER ABI boundary without invoking MagicBlock programs yet.
- **Validation:** `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed; `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed 17/17; `npm run check:quasar:per-abi` passed; `npm run test:bdd:index` passed; `git diff --check` passed.
- **What worked:** The callback test is a cheap guard for the highest-risk compatibility detail: MagicBlock's exact 8-byte callback discriminator.
- **What failed / surprised us:** A first negative test assumed omitting the account payload would fail, but QuasarSVM did not fail that way for this minimal unchecked-account callback. The better local guard is discriminator rejection; account/PDA validation must be added when the callback mutates real escrow state.
- **Safety / approval review:** Local compile/tests only; no signing, deployment, wallet mutation, or devnet txs in Phase 3.
- **Decision:** adjust and continue.
- **Plan changes for next phase:** Insert a CPI builder integration phase before devnet deployment. Phase 4 should turn static MagicBlock layouts/account-meta plans into concrete Quasar-native CPI builders or descriptor builders, with tests for PDA signer seed propagation. Deployment moves to Phase 5.

### Phase 4 — Quasar-native CPI builder integration

**Expectation:** The PER crate can build concrete MagicBlock CPI descriptors/calls from Quasar-native data without Anchor macros, including PDA signer seed intent.

**Implementation slice:** Convert static account-meta plans into callable builder helpers (or descriptor builders if direct `DynCpiCall` requires live `AccountView`s), then test data bytes, account role order/flags, program IDs, and signer-seed metadata.

**Validation:** local Rust tests, SBF build, PER ABI guard.

### Retrospective — Phase 4

- **Expected:** The PER crate can build concrete MagicBlock CPI descriptors/calls from Quasar-native data without Anchor macros, including PDA signer seed intent.
- **Observed:** Added const `CpiDescriptor` builders for createPermission, delegatePermission, delegateEscrow, and commitAndUndelegatePermission. Each descriptor carries the target MagicBlock program role, exact account specs, exact instruction data, and the account role requiring PDA signer seeds. This is the safe intermediate layer before mapping roles to live `AccountView`s and invoking `DynCpiCall`.
- **Validation:** `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed; `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed 18/18; `npm run check:quasar:per-abi` passed; `git diff --check` passed after trimming a trailing blank line.
- **What worked:** Descriptor builders preserve no-std/const determinism and make signer-seed expectations explicit without needing live MagicBlock accounts or CPI side effects.
- **What failed / surprised us:** Direct `DynCpiCall` construction requires concrete `AccountView`s from the instruction context, so doing that generically before wiring a PER instruction would be artificial. Descriptor-first is the cleaner Quasar-native seam.
- **Safety / approval review:** Local compile/tests only; no signing, deployment, wallet mutation, or devnet txs in Phase 4.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 5 can now prepare deployment, but before sending txs confirm the devnet deploy key/program ID inventory and capture artifact paths. If deploy tooling exposes a program-ID mismatch with the placeholder, update the plan/status before deployment.

### Phase 5 — Devnet deployment prep and bounded deploy

**Expectation:** The PER-specific Quasar program deploys to devnet under a new program ID, recorded separately from the reusable Quasar escrow ID.

**Implementation slice:** build-sbf/deploy script or operator checklist, deployment inventory entry, evidence artifact directory.

**Validation:** read-only executable account check after devnet deploy; tx/deploy signature captured. Devnet approval is already granted for this workstream.

### Retrospective — Phase 5

- **Expected:** The PER-specific Quasar program deploys to devnet under a new program ID, recorded separately from the reusable Quasar escrow ID.
- **Observed:** Generated a fresh PER program keypair and updated the PER crate `declare_id!` to `7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb`. Local SBF build and tests passed with the generated ID. Initial devnet deployment was blocked by payer balance (`0.01630384 SOL` vs `0.18901272 SOL + fee` required) and faucet rate limits. Nissan reminded us the devnet treasury exists; confirmed treasury `d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR` held `4.747355812 SOL`, transferred `0.25 SOL` to the configured payer `3Vmcwra5tfxGwaX3jnpmYybCd7gH4fstJzi1Yci38f94`, and deployed successfully.
- **Validation:** `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed; `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed 18/18; deploy tx `3qYh7Efdhufy6FLVsqwtWgDz57eHpiXwZBE7RVXxgPa6A36PVn1whRRgjH6tmuX6ebREurdc5k7L8CjwdQHWnzBn`; `solana program show 7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb --url devnet` shows owner `BPFLoaderUpgradeab1e11111111111111111111111`, ProgramData `DhLwhhwWqpGvof1t1Z67BWWasFzSBbaoiSHU4YZJKhCS`, authority `3Vmcwra5tfxGwaX3jnpmYybCd7gH4fstJzi1Yci38f94`, slot `460635750`, data length `26984`, balance `0.18901272 SOL`. Evidence captured under `artifacts/quasar-escrow-per-devnet/20260507-140241/`.
- **What worked:** Deployment path is now proven and funded through the intended devnet treasury; the PER program ID is executable on devnet and separate from the reusable Quasar escrow ID.
- **What failed / surprised us:** I initially forgot to draw down from the configured devnet treasury and tried the public faucet; that wasted time and hit rate limits. Also, Solana deploy failure logs can emit a transient buffer recovery phrase, so raw deploy logs must be redacted before sharing or committing.
- **Safety / approval review:** Devnet transfer/deploy were within Nissan's approval. No mainnet, paid provider, or external environment mutation. Treasury drawdown was `0.25 SOL` devnet only.
- **Decision:** continue.
- **Plan changes for next phase:** Phase 6 can start against deployed PER program `7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb`. Keep using treasury `d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR` for bounded devnet top-ups instead of faucet.

### Phase 6 — Devnet MagicBlock Permission/PER transaction loop

**Expectation:** Devnet txs create permission/delegation state for the PER escrow PDA using Quasar-native CPI and route through the MagicBlock PER/TEE boundary.

**Implementation slice:** bounded smoke script that locks tiny SOL, creates permission/delegation, routes private release/commit/undelegate attempts, and captures all signatures/errors.

**Validation:** evidence pack with tx signatures, RPC readbacks, MagicBlock PER router/TEE request evidence, and explicit success/failure boundary.

### Phase 7 — Final evidence + demo integration guard

**Expectation:** Judge/operator evidence can honestly claim Quasar-native MagicBlock PER only if Phase 6 proves settlement; otherwise it clearly presents the remaining boundary without overstating.

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
