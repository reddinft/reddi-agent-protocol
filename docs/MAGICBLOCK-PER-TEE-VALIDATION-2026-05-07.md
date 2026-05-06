# MagicBlock PER/TEE Validation Lane — 2026-05-07

## Verdict

A bounded MagicBlock validation lane was run after explicit approval. The project now has stronger, judge-visible MagicBlock evidence than the earlier boundary-only posture, but **successful live PER settlement is not claimed**.

What we can honestly claim:

- MagicBlock PER/TEE endpoint was reached live on devnet: `https://devnet-tee.magicblock.app`.
- The endpoint reports `magicblock-core: 0.9.0`, `solana-core: 3.1.12`.
- A signed TEE authorization token was generated via `@magicblock-labs/ephemeral-rollups-sdk` and stored only as redacted metadata.
- The demo locked escrow on devnet, recorded PER delegation state, submitted a PER-routed settlement transaction to the TEE RPC, and disabled L1 fallback.
- The submitted signature was **not visible on public devnet RPC**, matching the privacy-boundary expectation for TEE-routed traffic.
- The TEE finalized the submitted signature with `InvalidAccountForFee`, so this is not a successful PER settlement.

## Latest artifact

- Summary: `artifacts/per-happy/20260507-090621/SUMMARY.md`
- Demo log: `artifacts/per-happy/20260507-090621/03-demo.log`
- TEE/public status: `artifacts/per-happy/20260507-090621/04-tee-status.json`
- Redacted auth metadata: `artifacts/per-happy/20260507-090621/00-tee-auth.json`

Key result:

```text
PER submitted: yes
PER signature: RFtSdU4bm5pFiDW69dxG7e241S845ABaBe5HHLNQHbkQQNnY4GQztJveVvXsqPkrZAuq6iSX2szZbQupk1ge1jH
TEE status: err
TEE error: InvalidAccountForFee
Public RPC visibility: not_visible
Fallback used: no
```

## Diagnosis

The validation exposed a real integration gap rather than a generic endpoint failure:

- The current legacy PER path records `delegate_escrow` state in the Reddi Anchor program and submits `release_escrow_per` to MagicBlock TEE RPC.
- MagicBlock’s current PER guide requires full permission/delegation hooks: create permission account, delegate permission, delegate the account to the specific TEE validator, then commit/undelegate on the way back.
- Our final Quasar path intentionally does not claim this yet, and the legacy path is not a docs-conformant full PER lifecycle.

## Judge-safe framing

Use this wording:

> “We integrated and live-tested the MagicBlock PER/TEE lane. The proof shows authenticated access to the TEE endpoint, a PER-routed settlement submission with fallback disabled, and no public devnet visibility for the submitted signature. The TEE rejected the settlement because our current program path still needs MagicBlock’s full permission/delegation hooks, so we do not claim successful live PER settlement. The final demo remains Quasar-native, with MagicBlock shown as a validated integration boundary and next-step privacy rail.”

Avoid these claims:

- “PER settlement succeeded.”
- “Final Quasar path executes inside MagicBlock TEE.”
- “MagicBlock privacy is production-ready in this repo.”

## Follow-up required for a stronger MagicBlock prize push

To turn this from boundary proof into successful live proof:

1. Add docs-conformant MagicBlock permission + delegation hooks to a program path.
2. Include the TEE validator pubkey `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` in delegation.
3. Commit/undelegate via MagicBlock’s SDK/magic context.
4. Re-run `bash scripts/run-per-happy-smoke.sh` and require TEE status `finalized` with `err: null`.

## Validation commands run

```bash
npm test --prefix packages/per-client
PATH="$HOME/.cargo/bin:$PATH" cargo test -p escrow --test per
NETWORK_PROFILE=devnet DEMO_SETTLEMENT_MODE=magicblock_per DEMO_ALLOW_FALLBACK=false bash scripts/run-per-happy-smoke.sh
PATH="$HOME/.cargo/bin:$PATH" cargo test -p escrow --test per test_tee_private_settlement_devnet -- --ignored --nocapture
```

The ignored Rust live test currently fails immediately with `not implemented: devnet TEE test not yet wired — see Phase 5 README`; the executable live proof is therefore the JS smoke lane above, not the Rust ignored stub.
