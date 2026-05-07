# MagicBlock Payee Delegation Design — 2026-05-08

## Purpose

Close the next MagicBlock evidence gap without overclaiming: determine whether Quasar-native MagicBlock PER can move from **TEE private authorization** to a credible **private payee settlement** design.

Current proven boundary remains unchanged:

- Proven: Quasar-native MagicBlock permission/delegation succeeds live on devnet.
- Proven: patched Quasar PER executes inside MagicBlock TEE for private authorization and commit evidence.
- Not proven/claimed: private payee lamport settlement.

## Constraint found

MagicBlock PER rejects writable accounts that are not themselves delegated to the Ephemeral Rollup / TEE validator. The previous working smoke therefore made `payee` readonly and treated the TEE instruction as private authorization evidence only.

That is not just a smoke-script detail. It shapes the settlement design:

> A MagicBlock-private settlement path cannot mutate an arbitrary non-delegated wallet payee. The recipient side needs a delegated payment account, or the TEE instruction must only record private authorization and finalize value movement later on base devnet.

## Devnet probes

### Probe A — direct system payee delegation fails

Local artifact: `artifacts/magicblock-payee-delegation-probe/20260507T163238Z/summary.json`

Flow:

1. Generate fresh payee keypair.
2. Fund payee with 0.001 devnet SOL.
3. Create MagicBlock permission for the payee account.
4. Attempt to delegate the system-owned payee account directly.

Result: failed at delegation with `InvalidAccountOwner`.

Observed log excerpt:

```text
Program log: Invalid account owner for delegated account:
Program log: <payee>
Program log: 11111111111111111111111111111111
Program log: DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh
```

Interpretation: MagicBlock delegation expects the delegated account to be owned by the Delegation Program at the delegation step, matching the workaround already required for the Quasar escrow PDA.

### Probe B — assign-first system payee delegation succeeds

Local artifact: `artifacts/magicblock-payee-delegation-probe/20260507T163254Z-assign-first/summary.json`

Flow:

1. Generate fresh payee keypair.
2. Fund payee with 0.001 devnet SOL.
3. Create MagicBlock permission for the payee account.
4. `SystemProgram.assign(payee, DELeGGv...)` signed by payee.
5. Delegate the payee account with owner program `SystemProgram` and TEE validator `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`.

Result: succeeded.

Transactions:

- fund payee: `3vfm4q5ASgLDvMPWEU3f3JRzLSbZDxbcdCPvkUGuW5QH2cdHXAK4XSeRitXB3JJLtHVxSDe3CEo3TSxStZt1jmXU`
- create payee permission: `5pZ5ykGPPvWjM2WVRCEqKoKBCycFz6qyp7oqYPHHwn1HZPKaW1udNVgyeF84ZTChUUJQAocEsmzQ5sPv4HHAQn19`
- assign payee to Delegation Program: `5pd23AzAesFbs6riBx84F1iwrvuoMcFEKXb4m8MokC9YKLk4M7qNRQQcjESqEdAycTcgyVkPX2wKCLfMJ6DDqJEr`
- delegate payee account: `5RNjRGW4sq9ZpdwCADh2MrJ686KhdCckbywLizzHy22LEJUnt6Vmia83aPdGEVWo83wWD5MXqBkEiYwwzTFbxGsR`

Post-delegation payee account:

```json
{
  "owner": "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh",
  "lamports": 995000,
  "dataLength": 0,
  "executable": false
}
```

Interpretation: direct wallet-lamport settlement is possible only if the payee opts into delegation first. This is materially different from paying an arbitrary wallet address.

## Design options

### Option 1 — Opt-in delegated wallet payee

The recipient signs an opt-in transaction that creates permission and assigns/delegates their system account to MagicBlock. The TEE release then includes both escrow and payee as delegated writable accounts.

Pros:

- Closest to actual wallet lamport settlement.
- Probe B shows the prerequisite delegation path can work on devnet.

Cons:

- The recipient wallet is temporarily owned by the Delegation Program.
- UX/security story is heavy for a hackathon demo.
- Need a clean undelegate/finalization path before claiming funds are safely returned to normal wallet control.

### Option 2 — Quasar-owned delegated payee vault PDA

Create a recipient-specific Quasar PDA vault, delegate that vault, and have TEE mutate escrow + vault. Later, the recipient withdraws from the vault on base devnet after commit/undelegate.

Pros:

- Cleaner protocol model than assigning a user wallet to the Delegation Program.
- Quasar can validate PDA seeds and recipient ownership.
- Avoids asking arbitrary wallet accounts to change owner.

Cons:

- The final wallet lamport movement is a second-step withdrawal, not pure TEE-to-wallet transfer.
- More code than the current smoke; needs new state/instructions/tests.

### Option 3 — Keep private authorization, settle on base layer

TEE records private authorization/release intent in delegated escrow state; after commit/undelegate, a base-layer finalize instruction moves lamports publicly to the payee.

Pros:

- Safest and simplest next implementation.
- Preserves private authorization while avoiding delegated wallet complexity.

Cons:

- Not private payee lamport settlement.
- Should be described as private authorization + public finalization, not private settlement.

## Recommendation

For a robust submission path, use **Option 3** if time is tight and **Option 2** if we want a stronger protocol story.

Do **not** claim arbitrary wallet private settlement. The strongest honest phrasing after these probes is:

> MagicBlock TEE private authorization is proven; payee settlement requires recipient-side delegation or a Quasar-owned payee vault. A devnet probe proved opt-in system payee delegation is possible after assign-first, but full private settlement has not yet been implemented.

## Next implementation slice

If continuing the MagicBlock line, build a minimal Quasar-owned delegated payee vault:

1. Add `PayeeVault` PDA state keyed by `(payee, escrow_id)` or `(payer, payee, escrow_id)`.
2. Add `prepare_payee_vault_per` to create permission and delegate the vault.
3. Change TEE release to write delegated escrow + delegated vault, not arbitrary wallet payee.
4. Add commit/undelegate evidence for both accounts.
5. Add base devnet `withdraw_payee_vault` as the explicit public finalization step.

Claim boundary after that slice should be:

- Proven: private authorization and private vault credit on MagicBlock TEE.
- Proven if implemented: public withdrawal from committed vault.
- Still not claimed: direct private mutation of arbitrary wallet lamports.
