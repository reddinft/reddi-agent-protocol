# MagicBlock Agent Vault Settlement Plan — 2026-05-08

## Thesis

Use protocol-owned **agent vault PDAs** as the payment target instead of arbitrary wallet addresses.

This is the clean MagicBlock-compatible settlement abstraction:

1. Each agent has a Quasar-owned vault PDA controlled by the agent wallet as withdrawal authority.
2. The vault PDA can be permissioned/delegated to MagicBlock PER because it is program-owned state.
3. A TEE release can privately credit the delegated vault rather than trying to mutate a non-delegated wallet account.
4. The agent later signs a normal base-layer withdrawal from the vault to its wallet.

## Self-custody boundary

This is self-custodied if the vault withdrawal authority is the agent wallet/key and no admin/operator can withdraw on the agent's behalf.

Precise claim:

> MagicBlock TEE privately settles to self-custodied Quasar agent vaults; wallet withdrawal is agent-authorized and explicit on base devnet.

Do not claim:

> MagicBlock privately mutates arbitrary wallet lamports.

The private settlement target is the vault. The public wallet balance changes only when the agent withdraws.

## Why vaults solve the current blocker

Current MagicBlock proof already shows:

- Quasar-native permission/delegation succeeds on devnet.
- Patched Quasar PER executes inside MagicBlock TEE.
- Non-delegated wallet payees cannot be writable in the TEE release.

A vault PDA converts the payee from an arbitrary wallet account into a delegated program-owned account that MagicBlock can legally execute against.

## Minimal design

### `AgentVault` PDA

Seeds:

```text
[b"agent_vault", agent_wallet]
```

Fields:

- `authority`: agent wallet allowed to withdraw
- `balance`: withdrawable lamports credited by private/payment flows
- `lifetime_credited`: cumulative credited lamports
- `lifetime_withdrawn`: cumulative withdrawn lamports
- `status`: active/closed marker if needed
- `bump`

### `prepare_agent_vault`

Base-layer setup instruction.

- Creates the vault if missing.
- Sets `authority = agent_wallet`.
- Later PER version creates MagicBlock permission + delegates the vault.

### `take_to_agent_vault_per`

TEE/payment instruction.

- Validates escrow is locked.
- Validates escrow payee equals vault authority.
- Moves the escrowed amount from escrow PDA into the agent vault PDA.
- Marks escrow released.
- Increments vault balance/lifetime credited.

For MagicBlock, both escrow and vault must be delegated writable accounts.

### `withdraw_agent_vault`

Base-layer withdrawal instruction.

- Requires the agent wallet as signer.
- Transfers requested lamports from vault PDA to agent wallet.
- Decrements `balance` and increments `lifetime_withdrawn`.
- Rejects wrong signer, zero amount, insufficient balance, and double-withdraw beyond credited balance.

## Implementation phases

### Phase A — local Quasar vault model

Goal: prove self-custodied vault semantics in local QuasarSVM without MagicBlock CPI expansion.

Files:

- `experiments/quasar-escrow-per/src/state.rs`
- `experiments/quasar-escrow-per/src/events.rs`
- `experiments/quasar-escrow-per/src/lib.rs`
- `experiments/quasar-escrow-per/src/instructions/mod.rs`
- new instruction files:
  - `prepare_agent_vault.rs`
  - `take_to_agent_vault.rs`
  - `withdraw_agent_vault.rs`
- `experiments/quasar-escrow-per/src/tests.rs`

Validation:

- lock → prepare vault → take to vault → withdraw
- wrong vault authority rejected
- wrong withdraw signer rejected
- withdraw before credit rejected
- double-withdraw rejected

Claim after Phase A:

> Quasar-native self-custodied agent vault settlement model implemented and locally tested.

### Phase B — MagicBlock vault delegation wiring

Goal: make the vault a delegated PER account.

Files:

- `src/magicblock/layout.rs`
- `src/magicblock/cpi.rs`
- new/extended instruction:
  - `prepare_agent_vault_per.rs`
  - possibly `commit_undelegate_agent_vault_per.rs`

Validation:

- MagicBlock SDK fixture parity for vault delegation bytes/account roles.
- Devnet create permission + delegate vault smoke.

Claim after Phase B:

> Agent vault can be delegated to MagicBlock PER on devnet.

### Phase C — TEE private vault credit smoke

Goal: run live devnet TEE release where both escrow and vault are delegated writable accounts.

Validation artifact must include:

- base lock tx
- vault prepare/delegate txs
- TEE private credit tx
- commit/undelegate txs
- base readback showing committed vault credit
- optional public withdrawal tx signed by agent wallet

Claim after Phase C:

> MagicBlock TEE privately credited a self-custodied Quasar agent vault; the agent wallet later withdrew via an explicit base-layer transaction.

## Retrospective adjustment

This is stronger and cleaner than direct delegated-wallet settlement. The assign-first wallet delegation probe proved opt-in wallet delegation is possible, but temporarily assigning a user wallet account to the Delegation Program is a heavy UX/security story. Agent vaults preserve wallet authority while giving MagicBlock a program-owned delegated settlement target.
