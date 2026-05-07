# MagicBlock delegated vault settlement semantics — Issue #270

_Author: Firefly | Date: 2026-05-08 | Scope: design/spec only_

## Problem statement

PR #269 proves that a Quasar-native PER program can privately credit a delegated `AgentVault` mirror inside MagicBlock TEE with full escrow-to-vault intent binding. It does **not** yet prove base-layer settlement of that vault credit.

The next protocol boundary is therefore: define exactly how a TEE-side delegated vault credit becomes canonical base-layer Quasar state that the agent authority can withdraw from, without double-credit, authority reroute, or claim-boundary overstatement.

## Current evidence and boundary

### Evidence already proven

- PR #269 merged at `7573f091`.
- PER program: `7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb`.
- Live artifact: `artifacts/quasar-per-agent-vault-delegation-smoke/20260507T222515Z-private-credit-bound-intent/summary.json`.
- Successful live steps:
  - create vault-credit intent: `38CwyRcNXnMMGfYyF11KZAtSXnwYRW2pYa2PbE94s5ztzC5mhxA5wt9k5FmMHasrtvC4yoJpKafHTMkRe3hbb92w`
  - lock escrow: `2oG2RGauYg5FMT482FhyEMa9UUi19MwBfVKSGijLQpyUtKPzXy5pPa45iMYjMWezwuuQAJ3CPK6vWgRsU6rGB9gx`
  - prepare vault: `4Y6qjGK2ncaKDgJyAfjwAzi3PreY1JnTCzBe95hdKBdLrkAnzqP6eb1Z4n5EQeBdj26FnwbiQPgdrrNLaJj44mrM`
  - prepare intent: `5vEKhg2wnwh6TrpzPmaJFq2Nk9EVyTNjxGcVmrTG2ZFreUqaX8gXKhKum3ULJwBuarF1Qg352QPZ39PbSdBmVUwe`
  - delegate escrow: `nFT721V1Acp5jTDkFodcbonPnQCBwCBWR2yXtu4ktvu3Ye1jU9UAQiuxkTagW73aFR69dC5oB1Smu2pVZuX65Kv`
  - delegate vault: `2VkmvzvVuZn3Pd67BXbetmysGUxqPhpBwHXvLX2TeiiKMKKxbpW6GaVGLFWkG74wV88ZtF7b3geYgAXfkaSxebfF`
  - TEE private vault credit: `4rMx6SbcuGpNFUAiojcnAy4JzqJUbPRGrXNVTpHeDgvtroSJVvXs9C3wfRcGs7SEb2YodYKArTLk2MwN6FHnMojZ`
  - escrow commit: `2BeEV6StEu9XxHKGuHJxmp85BnCAGLHvnj2fvxkqFEbzwdEgEz69XD1QRYXoYquMN7LcH5NKA6nU2f3eKS6hgiw9`

### Boundary still open

After the smoke:

- `vaultTee` is credited: owner is the Quasar PER program, lamports include the credited amount, and data has the `AgentVault` discriminator/balance bytes.
- `vaultBase` remains delegated/zeroed: owner is MagicBlock Delegation Program, lamports are rent-only, and data prefix is zero.
- The script commits escrow only; it does not commit/undelegate the vault account.

So the safe claim is: **TEE delegated-state private credit is proven. Base-layer vault settlement is not yet proven.**

## Settlement design options

### Option A — Commit/undelegate the delegated vault account directly

Add a vault-specific MagicBlock commit/undelegate path after `private_take_to_agent_vault` succeeds. This mirrors the existing escrow `commit_undelegate_per`, but targets the `AgentVault` permission/delegation set.

**Flow:**

1. `prepare_agent_vault` on base layer.
2. `prepare_vault_credit_intent` binds payer, escrow PDA, escrow id, authority, vault PDA, and amount before delegation zeroes mirrors.
3. `delegate_per` for escrow.
4. `delegate_agent_vault_per` for vault.
5. TEE calls `private_take_to_agent_vault`.
6. TEE/base settlement calls `commit_agent_vault_per` for vault permission.
7. Commit escrow if not already committed, or combine both commits in a wrapper once proven.
8. Base-layer readback asserts vault is Quasar-owned, data is restored, and withdraw works.

**Pros:** closest to MagicBlock semantics; minimal extra protocol abstraction; clean evidence story.

**Cons:** two delegated accounts mean partial-commit risk unless the smoke and program track a settlement state/receipt.

### Option B — Explicit Quasar settlement callback/wrapper

Add `settle_agent_vault_per` as a Quasar instruction that verifies the same intent binding and invokes MagicBlock commit/undelegate for both escrow and vault, then records a settlement receipt.

**Flow:** same as Option A, but the public/operator surface uses one settlement instruction that owns ordering, idempotency, and evidence emission.

**Pros:** best protocol API; easiest to make idempotent; gives tests one semantic settlement boundary.

**Cons:** more code than direct vault commit; still depends on MagicBlock commit behavior for the delegated vault.

### Option C — Staged base-layer reconciliation proof

Keep the TEE private credit as authorization evidence, then run a separate base-layer reconciliation instruction that credits a non-delegated vault from an on-chain proof/receipt.

**Pros:** avoids relying on delegated vault commit mechanics if MagicBlock has account-state limitations.

**Cons:** weaker privacy/settlement story; more custom proof surface; greater replay/double-credit risk unless receipt mechanics are carefully designed.

## Recommended path

Proceed with **Option B, implemented in two slices with Option A as the first proving step**.

1. First add and prove `commit_agent_vault_per`, a vault-specific commit/undelegate CPI using the MagicBlock Permission Program for the vault permission PDA.
2. Then wrap escrow+vault settlement in `settle_agent_vault_per`, which records an idempotent settlement receipt and becomes the public protocol semantic.

This gives the team the shortest path to live evidence while avoiding a brittle final API. The final claim should only unlock when post-state confirms the base-layer vault, not merely when tx signatures succeed.

### Loki review adjustment — receipt/write-location constraint

Do **not** make the first settlement design depend on writing a non-delegated receipt from inside MagicBlock TEE. Prior MagicBlock probes rejected writable non-delegated accounts, and PR #269's safe pattern is to prepare any state that must be trusted during TEE execution before delegation.

Therefore B3 should use this ordering:

1. Prove raw vault `commitAndUndelegatePermission` first, with no new receipt writes.
2. Verify base-layer vault post-state directly after commit.
3. Only then introduce a receipt/status PDA, either:
   - prepared before delegation if TEE/private execution must mutate it, or
   - written on base layer after both escrow and vault post-states are verified.

This keeps the next implementation from repeating the earlier “non-delegated writable account inside TEE” trap.

## Proposed canonical semantics

A payment is **PER vault settled** only when all of the following are true on base-layer devnet/mainnet state:

1. The escrow PDA is bound to `(payer, escrow_id, payee/authority, amount)` and is no longer spendable as locked escrow.
2. The agent vault PDA is owned by the Quasar PER program, not MagicBlock Delegation Program.
3. The agent vault account data has:
   - discriminator `11`,
   - `authority == intended payee/agent`,
   - `balance >= prior_base_balance + amount`,
   - `lifetime_credited >= prior_base_lifetime_credited + amount`,
   - `status == Active`.
4. The vault lamports increase by the credited amount, net of rent invariants.
5. A settlement receipt or equivalent state proves the `(payer, escrow, escrow_id, authority, vault, amount, intent)` tuple was consumed once.
6. `withdraw_agent_vault(authority, amount)` succeeds only after base-layer settlement and fails for wrong authority or overdraw.

A TEE tx alone is **private authorization/credit evidence**, not settlement.

## Threat model

| Threat | Required defence |
|---|---|
| Payer/escrow reroute after MagicBlock zeroes delegated mirrors | Preserve `VaultCreditIntent` and validate payer, escrow PDA, escrow id, authority, vault PDA, and amount before credit and settlement. |
| Reuse same-amount intent for another escrow | Intent must bind escrow address + escrow id + payer + vault + authority + amount. Already covered in PR #269; preserve through settlement. |
| Wrong authority or wrong vault credited | Vault PDA must derive from `[b"agent_vault", authority]`; settlement must reject mismatched authority/vault. |
| Double-credit by rerunning TEE instruction or settlement | Add `SettlementReceipt` / consumed flag, or mutate intent status from `Prepared` to `Credited`/`Settled`; fail on replay. |
| Double-withdraw after settlement | Preserve current `balance` decrement and checked lamport subtraction in `withdraw_agent_vault`; add post-settlement regression. |
| Partial commit: escrow committed but vault not committed | Treat as `SettlementPendingVaultCommit`; smoke must flag non-settled. Recovery instruction may retry vault commit using same intent/receipt. No settlement claim until vault post-state passes. |
| Partial commit: vault committed but escrow not committed | Treat as `SettlementPendingEscrowCommit`; escrow cannot be re-released; retry escrow commit or mark dispute/recovery. Receipt must prevent second vault credit. |
| Unpinned MagicBlock or owner program accounts | Preserve PR #267 checks: pinned Permission Program, Delegation Program, owner program, and TEE validator before PDA signing/assignment. |
| Arbitrary-wallet private settlement overclaim | Keep payee wallet mutation out of scope; only vault PDA settlement may be claimed. |

## Test plan

### Local/QuasarSVM tests

Add tests before live devnet smoke:

1. `settle_agent_vault_per_commits_base_vault_state`
   - Given a delegated/credited vault mirror fixture,
   - When vault settlement runs,
   - Then base vault owner/data/balance become withdrawable Quasar state.
   - Prefer exact balance/lifetime-credit deltas over `>=` assertions wherever the pre-state is deterministic.
2. `settlement_preserves_full_intent_binding`
   - Reject wrong payer, escrow PDA, escrow id, authority, vault, or amount.
3. `settlement_rejects_replay_or_double_credit`
   - Running settlement twice cannot increase vault balance twice.
4. `withdraw_after_settlement_only`
   - Withdraw fails before base settlement and succeeds after base settlement for the correct authority.
5. `wrong_authority_vault_escrow_rejected`
   - Includes the current PR #269 wrong-vault and same-amount-wrong-escrow cases at settlement time.
6. `partial_commit_boundaries_are_explicit`
   - Escrow commit success + vault commit failure produces pending/not-settled state.
   - Vault commit success + escrow commit failure produces pending/not-settled state and cannot double-credit.

### Smoke/evidence requirements

A passing smoke must assert post-state, not just tx success:

- capture pre-state for escrow base, vault base, escrow TEE, vault TEE, intent/receipt;
- run lock → prepare vault → prepare intent → delegate escrow → delegate vault → TEE private credit → vault commit → escrow commit/settle;
- read base-layer vault after settlement;
- fail closed unless base-layer vault owner is Quasar PER program and data/balance/lifetime fields include the credited amount;
- execute a tiny `withdraw_agent_vault` after settlement and prove authority wallet receives funds;
- attempt or simulate wrong-authority/overdraw replay if cheap;
- write artifact fields:
  - `privateCreditEvidence.ok`,
  - `vaultCommit.ok`,
  - `escrowCommit.ok`,
  - `baseVaultSettled.ok`,
  - `withdrawAfterSettlement.ok`,
  - `claimBoundary`.

Suggested script evolution:

- Keep `scripts/run-quasar-per-agent-vault-delegation-smoke.mjs` for B2 private-credit evidence.
- Add `scripts/run-quasar-per-agent-vault-settlement-smoke.mjs` for Issue #270.
- The new smoke should set `summary.ok = true` only when `baseVaultSettled.ok && withdrawAfterSettlement.ok`.

## Implementation slices

1. **B3.1 — Vault commit descriptor/instruction**
   - Add `commit_agent_vault_per` using the vault permission PDA and vault PDA signer seeds.
   - Tests pin account order and wrong-program rejection.

2. **B3.2 — Settlement receipt/idempotency**
   - Add a small `VaultSettlementReceipt` PDA or intent status byte.
   - Bind payer, escrow, escrow id, authority, vault, amount, private-credit tx/evidence hash if available.
   - Reject replay before any lamport/data mutation.

3. **B3.3 — `settle_agent_vault_per` wrapper**
   - Orchestrate vault commit + escrow commit ordering only after raw vault commit is proven.
   - Emit settlement event with explicit status.
   - Represent partial commit as pending/retryable, not settled.
   - If receipt/status is written during TEE execution, its account must be delegated/prepared first; otherwise write it only from a base-layer verifier instruction after post-state checks.

4. **B3.4 — Local regression pack**
   - Add all tests listed above.
   - Run: `cargo test --manifest-path experiments/quasar-escrow-per/Cargo.toml`, `cargo build-sbf --manifest-path experiments/quasar-escrow-per/Cargo.toml`, `npm run check:quasar:per-abi`, `git diff --check`.

5. **B3.5 — Devnet settlement smoke**
   - Upgrade PER program only after local gates pass.
   - Run bounded devnet/MagicBlock smoke.
   - Capture artifact and update claim-boundary docs only if base-layer post-state passes.

6. **B3.6 — Claim-boundary/docs update**
   - If evidence passes, update final proof map from “private delegated-state credit only” to “base-layer agent-vault settlement proven” with artifact path.
   - Continue to say arbitrary-wallet private settlement is unclaimed.

## Non-goals

- No arbitrary-wallet private settlement claim.
- No Anchor final demo path.
- No mainnet spend or production deployment.
- No mutation of reusable base Quasar escrow ABI.
- No claim of MagicBlock PER settlement from tx success alone.
- No Jupiter/Umbra/Pay.sh scope creep in this lane.

## Decision summary

Use MagicBlock commit/undelegate for the delegated vault account, then expose it through a Quasar `settle_agent_vault_per` semantic with idempotent receipt tracking. Settlement is only claimed after base-layer vault post-state and withdrawal are proven.
