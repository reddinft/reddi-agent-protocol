# MagicBlock TEE / Quasar Program Execution Repro — 2026-05-07

## Summary

Quasar-native MagicBlock delegation succeeds live on devnet. This repro is now **superseded** by PR #260: the access violation was traced to Quasar generated entrypoint ABI mismatch, and patched Quasar PER now executes inside MagicBlock TEE for private authorization/commit evidence. Settlement is still **not** claimed for non-delegated payee lamport mutation.

## Program IDs

- Quasar PER program: `7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb`
- Reusable base Quasar escrow program: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- MagicBlock Permission Program: `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`
- MagicBlock Delegation Program: `DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh`
- MagicBlock TEE RPC: `https://devnet-tee.magicblock.app`

## Proven live delegation

The Quasar PER `delegate_per` instruction performs three explicit Quasar-native CPIs:

1. Permission Program `createPermission`
2. Permission Program `delegatePermission`
3. Delegation Program `delegate` for the escrow PDA

Representative successful live delegate tx:

- `3XAZiUS3ZEeysrrctV7TvmrYdeYDqTgmY2qWULKNRAPr41wTQj6Zsn81hVXdgwCz3xZJ7G3JCTaGuCkv2rgVJcj9`

Post-delegation account readbacks show escrow + permission PDAs owned by `DELeGGv...`.

## TEE execution failure

After delegation succeeds, `commit_undelegate_per` on TEE fails before program logic:

```text
Program 7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb invoke [1]
Program 7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb consumed 1 of 1400000 compute units
Program 7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb failed: Access violation in unknown section at address 0xfffffffffffffff8 of size 8
```

A minimal Quasar PER callback simulation shows the same split:

- public devnet: enters program and succeeds
- MagicBlock TEE: historical failure superseded by PR #260 standard-entrypoint fix

The reusable base Quasar escrow program shows the same pattern:

- public devnet: enters program and returns `NotEnoughAccountKeys`
- MagicBlock TEE: historical failure superseded by PR #260 standard-entrypoint fix

## Toolchain probes

- Default current SBF build executes on public devnet but not TEE.
- `cargo build-sbf --arch v1` redeploy tx `5R9kqL17C42xDBzmaSUUPxUSHyKdf19T5y94L4egRSMtBCCqw6MMXxH4w2M5gCRR3pjCocESkdLnwD1Y38c5Y6Gu` did not fix TEE execution.
- Solana 2.1.21 / platform-tools v1.43 build probe could not compile current Quasar dependencies because Cargo 1.79 cannot parse edition-2024 metadata in `wincode-derive 0.4.4`.
- A tiny non-Quasar native no-op probe deployed at `gLzmiJdygErz3nKJk5X8mx3nphcVeTVTLdKAuacMeGo` (`34yUAes...`) but direct TEE simulation failed earlier at MagicBlock clone time with `InvalidAccountData`, so it is not comparable without implementing a full native delegation-control path.

## Evidence artifacts

- `artifacts/quasar-per-magicblock-cpi-smoke/20260507-145115-phase6c-borsh-seeds/`
- `artifacts/quasar-per-magicblock-cpi-smoke/20260507-145422-phase6c-tee-auth-commit/`
- `artifacts/quasar-per-magicblock-cpi-smoke/phase6d-toolchain-probe-v1/`
- `artifacts/quasar-per-magicblock-cpi-smoke/phase6d-native-noop/`

Deploy logs containing transient Solana buffer recovery phrases were redacted locally.

## Current claim boundary

Safe to claim:

- Quasar-native MagicBlock CPI wiring exists.
- Live devnet MagicBlock permission/delegation succeeds for a Quasar escrow PDA.
- The TEE settlement path has a precise, reproducible execution blocker.

Do **not** claim:

- successful MagicBlock PER settlement
- successful `commit_undelegate_per`
- production-ready Quasar-on-MagicBlock TEE runtime compatibility
