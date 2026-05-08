# MagicBlock Commit Semantics Loop — 2026-05-08

Purpose: determine why `commit_agent_vault_per` / MagicBlock `commitAndUndelegatePermission` can return success on TEE while base-layer delegated vault post-state remains zeroed/delegated.

Known evidence:
- PR #273 code-safe raw vault commit CPI merged as `e05fe8a4`.
- Devnet upgrade tx: `5U6xoRkH5xvxVYRKoPgLxLJvgi9MN3vD3KDoj1CkFW6ubi7iSTC1mBW49FSwNLKAyijQgrKCFGvi4RUcsCng9z7J`.
- Smoke artifact: `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T010932Z-vault-commit-b3/summary.json`.
- Result: TEE private vault credit succeeded, raw vault commit CPI succeeded, but base vault/escrow remained owned by Delegation Program with zeroed data; withdrawal skipped.

Claim boundary: no base-layer vault settlement claim until post-state restore + withdrawal evidence pass.

## Loop notes

### Loop 1-2 findings
- SDK exposes Permission Program `createCommitAndUndelegatePermissionInstruction` (8-byte discriminator `[5,0,0,0,0,0,0,0]`) and Magic Program `createCommitInstruction`/`createCommitAndUndelegateInstruction` (4-byte codes 1/2).
- Existing B3 smoke only proves Permission Program commit CPI success; base-layer vault state remained delegated/zeroed, so Permission commit success != base restore proof.
- Direct TEE Magic Program probes on the existing delegated vault: scheduleCommit code=1 rejected as invalid instruction data; scheduleCommitAndUndelegate code=2 readonly rejected as modified read-only account; writable variant earlier rejected invalid instruction data.
- Adjustment: compare against SDK SPL undelegate wrappers and capture a fresh combined artifact before changing program code.

### Loop 3-9 findings
- Implemented an experimental PDA-signed Magic Program `scheduleCommitAndUndelegate` call inside `commit_agent_vault_per` after Permission commit (B3.2) and deployed to devnet tx `677Xx2MLaz1hdFsWPMGaGQuCQ9tJ2xX2SZECQ3FPctECSmxyYBewnkH7CGpqogDF2VFDqBW61NPBTP1rze78AJ6j`.
- Smoke artifact `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T012235Z-vault-commit-b32-magic-schedule/summary.json`: initial post-state still zeroed/delegated; delayed read showed vault data synced (`balance=1000000`, `lifetimeCredited=1000000`) but owner remained Delegation Program `DELeGG...`, so withdrawal still cannot be claimed.
- Implemented a second experimental Magic Program only variant (B3.3), deployed tx `rJ6WEAz7M93JXScqGaWDpjsJhGq7R8XwYupNQUL24y119RD4ireEKz9oeuhq4SnTdJ4rHwLiNxuia2gycGTiNXU`.
- Smoke artifact `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T012747Z-vault-commit-b33-magic-only/summary.json`: delayed read again showed vault data synced but owner remained Delegation Program. The vault permission PDA also remained delegated in the Magic-only route.
- Preserved the experimental code diff at `artifacts/quasar-per-agent-vault-settlement-smoke/experiments/b32-b33-magic-schedule-experiment.patch` and reverted local program source to main/PR #273 shape.
- Restored devnet PER program back to the merged PR #273 shape with deploy tx `2kC1arg3HRbJGtN9JosMrdKoRbUZGda6LgShLgLHbd37kf5bdiuFb2xnwCVQaMVZEvM2tdkmAbPpVCXVcs3EcJzj`.

Historical conclusion (superseded by Loop 20): this evidence only proved delayed delegated-vault state sync/commit, not owner restoration/undelegation back to the Quasar program. The later B4 rent-spending callback + Magic-intent smoke proves the agent-vault route; arbitrary-wallet/private settlement remains unclaimed.

### Loop 10-15 findings — B4 undelegate callback prototype
- Replaced the no-op exact-discriminator `undelegate_callback` with a narrow Quasar-native owner/data restoration prototype for the agent-vault PDA. Account order follows the MagicBlock callback shape inspected in docs/SDK references: delegated/restored PDA, delegation buffer, initializer/authority, system program. The discriminator remains exactly `[196, 28, 41, 206, 48, 37, 51, 167]`.
- Local SBF gate passed after callback implementation: `cargo fmt --manifest-path experiments/quasar-escrow-per/Cargo.toml`, `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml`, and `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml` passed `38/38`.
- First local callback implementation learned a critical boundary: direct owner mutation through account view assignment is rejected by SVM as `ModifiedProgramId`. The viable SDK-shaped path is System Program CPI, not raw owner mutation.
- First B4 deploy tx: `MNdthW6rVRKTjUZZ4CWSgSh9kvHPAAe8UqnreHPAXFMN18WhPQcbUb9845wtG1Qgq1HjJy6GAfpATyPG8kkbTYy`.
- B4 smoke artifacts:
  - `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T014216Z/summary.json` — base RPC commit path still fails `UnsupportedProgramId` in the Permission Program CPI.
  - `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T014233Z/summary.json` — TEE commit path succeeds for vault+escrow commit transactions, but base vault remains owner `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`, zeroed, and `withdrawAfterSettlement` is skipped. A delayed base read of vault `Dq2syExBmTSBmHcTigrHhx1ycTu3agQKjt6sTWXXr5jZ` still showed Delegation owner and zeroed data.
- SDK source review refined the callback shape: `ephemeral-rollups-sdk::cpi::undelegate_account` recreates the PDA from a System-owned, zero-length account using System `allocate` + `assign`, then copies the Delegation-owned signed buffer bytes. The local prototype was adjusted to match this zero-length restore path and SBF tests still pass `38/38`.
- Deploy blocker: redeploying the corrected zero-length callback build failed because the devnet payer/program authority only had `0.457106 SOL`; `solana program deploy` required about `0.555129 SOL` upfront for buffer spend+fee. Devnet airdrop was rate-limited. No private keys/tokens should be logged or shared; keep auth/token values redacted.

Historical conclusion (superseded by Loop 20): B4 proved a Quasar-native callback-compatible restore routine locally, but live settlement was still unproven because Permission Program `commitAndUndelegatePermission` alone did not invoke the callback/restore path. The later Magic Program `ScheduleIntentBundle` / post-undelegate action route with rent-spending callback proves the agent-vault settlement path.

Next plan adjustment:
1. Historical/superseded: do not claim base-layer agent-vault settlement until callback proof passes.
2. Historical/superseded: fund the devnet authority enough to redeploy corrected callback. Current funding rule: use treasury/devnet treasury wallet first before treating faucet limits as blockers.
3. Completed in Loop 20: source-shaped Magic Program `ScheduleIntentBundle` / post-undelegate action route with rent-spending callback produced the passing agent-vault settlement proof.

### Loop 16 correction — funding was not a blocker
- Nissan corrected the process: devnet SOL shortage/faucet rate limit should not have been treated as a blocker because development wallets can be topped up from existing devnet signer/treasury balances.
- Action: distributed `0.03 SOL` each from five existing devnet specialist signers to the program authority/payer, raising balance to `0.607056 SOL`, then redeployed the corrected zero-length callback build.
- Corrected B4 redeploy tx: `4RTmSR18JUFGtSLci5smY9h4kv8rLh639ZMtQ2kwfcB6RashSN6fUUpNjDyLin6Jgu5HEyjphfsc6EVb3J1nuKZQ`.
- Corrected B4 smoke artifact: `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T015548Z/summary.json`. TEE commit transactions succeeded, but `baseVaultSettled.ok=false`, `withdrawAfterSettlement.ok=false`, and delayed base read of vault `6Qb9GxhKvcqGAWu1LEt63EpG6ki2jkMwq64SS5a23nD` still showed owner `DELeGG...` with zeroed data.
- Conclusion strengthened: even with the SDK-shaped callback deployed, Permission Program `commitAndUndelegatePermission` does not appear to invoke the callback/restore path for this vault route. Next investigation should focus on Magic Program `ScheduleIntentBundle` / post-undelegate action semantics or MagicBlock support/source confirmation.

### Loop 17-19 findings — Magic base action restore semantics
- Source inspection of MagicBlock committor and Delegation Program changed the diagnosis. Patched base tx account slot 2 is the validator/initializer, not agent authority; callback must derive authority from committed buffer bytes. That fix reached the callback, but DLP failed with `InvalidValidatorBalanceAfterCPI = 8`.
- Root cause from `/tmp/delegation-program/src/processor/fast/undelegate.rs`: DLP closes the delegated account to the validator, invokes the owner-program callback, then requires `validator_lamports_before_cpi == validator_lamports_after_cpi + rent_minimum(delegated_account.data_len())`. A callback that only `allocate`/`assign`s leaves validator balance unchanged and is rejected even if bytes match.
- Plan adjustment: callback must recreate the zero-lamport PDA by spending exactly the rent-exempt amount from MagicBlock's validator/payer account into the PDA, then allocate/assign and copy buffer bytes. Local targeted tests pass for this shape (`cargo test ... test_magicblock_undelegate_callback -- --nocapture`, 5/5) and `cargo build-sbf` passes.
- Live deploy is currently funding-gated, not conceptually blocked: latest deploy of the rent-spending callback needs more payer SOL than the current `0.60304308 SOL`. I attempted non-destructive funding from existing specialist devnet signers; those are now drained. `devnet-pow` install was attempted as a non-user faucet alternative but failed under current Rust/dependency resolution. An obsolete devnet native-noop program `gLzmiJdygErz3nKJk5X8mx3nphcVeTVTLdKAuacMeGo` controlled by the same authority has `0.13945752 SOL` reclaimable, but closing it is irreversible and requires Nissan approval before using `--bypass-warning`.
- Claim boundary unchanged: no base-layer settlement claim until `baseVaultSettled.ok && withdrawAfterSettlement.ok`.

### Loop 20 result — base-layer agent-vault settlement proven
- Approved reclaim action: closed obsolete devnet native-noop probe `gLzmiJdygErz3nKJk5X8mx3nphcVeTVTLdKAuacMeGo` with `--bypass-warning`, reclaiming `0.13945752 SOL` to payer `3Vmcwra5tfxGwaX3jnpmYybCd7gH4fstJzi1Yci38f94`.
- Deployed rent-spending undelegate callback build: tx `38x26DmcWJgwmmxwr7HkYxz3NKxNBTtJCxo4RSuW1HvLDvECgFDcgHjWbcSz1NRKiSzhi5GUp3uyECH3VwHt542L`; ProgramData length `86864`.
- First smoke artifact `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T031540Z/summary.json` initially failed because the script checked base RPC before the delayed MagicBlock base patch landed. Delayed manual read showed owner/data restored correctly.
- Smoke script patched with `QUASAR_PER_POST_COMMIT_WAIT_MS` so settlement is checked after MagicBlock's delayed base patch.
- Decisive smoke artifact `artifacts/quasar-per-agent-vault-settlement-smoke/20260508T031640Z/summary.json`: `ok=true`, `baseVaultSettled.ok=true`, `withdrawAfterSettlementResult.ok=true`.
  - agent `HtP6RqC4KevH4KMSm6owNqPHWWV2gxRiYR2J3LqJwuQz`
  - vault `GGfwwRivGBrmb8754LsuzmAXqsasHPaS7nBnKjEWuwEb`
  - commitVault tx `2LXKFquyzVf8UVcy8znFG79rWXT7tUSMWAgT6W2wSvWCCsRACDpkW9UseTGYQUL6QfqYKvW9EtKrGmGxKnSNWQ5e`
  - commitEscrow tx `5mowcGYheDNy6Y55CJHrwFQoAsQKnLwnNQAZi6kDWNDowb6ShzrL8dEhZn9r8NTC1p4P85zSRRpwgJzpeVSJwc3A`
  - withdraw tx `43rZJbYkhwJNQnAAW9b4kGdzV2mg8arBfwdoSdib9oVT5N2aooPbkreMSL1DmdEvEMRD6KZevERM4cVZLy2KgiXa`
- Claim boundary update: base-layer agent-vault settlement is now proven for the MagicBlock PER agent-vault route using TEE Magic-intent commit with post-undelegate callback and delayed base confirmation. Arbitrary-wallet/private settlement remains unclaimed unless separately validated.


### Loop 21 review — cleanup/gates after proof
- Cleaned proof branch after live success. The first validation pass exposed only expected older dead-code warnings plus a few B4-local warnings. Fixed B4-local warning sources: `lock.rs`/`private_take_to_agent_vault.rs` instruction arg names, `layout.rs` final offset read, `undelegate_callback.rs` System Program validation, and `magicblock/constants.rs` string constant dead-code allowance.
- Validation gates now pass: `node --check scripts/run-quasar-per-agent-vault-settlement-smoke.mjs`, `npm run check:quasar:per-abi` (14 PER instructions), `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml -- --nocapture` (40/40), `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml`, `npm run check:submission:claim-boundaries`, and `git diff --check`.
- Retrospective adjustment: STATUS/notes now mark older “do not claim base-layer settlement” conclusions as historical/superseded rather than deleting them, preserving audit trail without contradicting the Loop 20 proof.
- Funding rule incorporated: treasury/devnet treasury wallet is the first top-up path for development wallets; irreversible actions still require approval.
