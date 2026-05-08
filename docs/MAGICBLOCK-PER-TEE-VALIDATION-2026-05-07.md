# MagicBlock PER/TEE Validation Lane — 2026-05-07

> **2026-05-08 supersession note:** This page records the earlier validation lane before PR #274. Current MagicBlock claim boundary is stronger and narrower: bounded MagicBlock PER AgentVault settlement is proven for the Quasar-owned agent-vault route; arbitrary-wallet/private payee settlement remains unclaimed. Do not reuse the older broad no-settlement sentence without the AgentVault-route qualifier.

## Verdict

A bounded MagicBlock validation lane was run after explicit approval and then re-run after patching the demo to use MagicBlock's `ConnectionMagicRouter` blockhash path. This historical page captured judge-visible MagicBlock boundary evidence before the later AgentVault settlement proof landed.

What we can honestly claim:

- MagicBlock PER/TEE endpoint was reached live on devnet: `https://devnet-tee.magicblock.app`.
- A signed TEE authorization token was generated via `@magicblock-labs/ephemeral-rollups-sdk`; only redacted metadata was written.
- The demo funded/verified the three devnet agents, found registered Agent B, locked escrow on devnet, recorded PER delegation state in the legacy Anchor escrow path, and attempted PER settlement with L1 fallback disabled.
- Earlier PER submission produced a TEE signature that was **not visible on public devnet RPC**, matching the privacy-boundary expectation for TEE-routed traffic.
- After switching to `ConnectionMagicRouter`, the TEE rejected the release at transaction verification with `InvalidAccountForFee`; this confirms the remaining gap is not just “wrong blockhash”, but a missing docs-conformant MagicBlock permission/delegation lifecycle for our escrow PDA.

## Latest artifacts

Latest re-run after `ConnectionMagicRouter` patch:

- Summary: `artifacts/per-happy/20260507-115318/SUMMARY.md`
- Demo log: `artifacts/per-happy/20260507-115318/03-demo.log`
- Redacted auth metadata: `artifacts/per-happy/20260507-115318/00-tee-auth.json`

Key result:

```text
Result: FAIL
Failure class: per_unavailable_or_rejected
Escrow locked: 26XstBgL1C6gGTRaTcGfGhaWTPwfFp3BfrEEh5BpkhRR
Delegate state recorded: yes
Fallback used: no
TEE rejection: InvalidAccountForFee
```

Prior boundary run with a TEE-submitted signature:

- Summary: `artifacts/per-happy/20260507-115112/SUMMARY.md`
- Demo log: `artifacts/per-happy/20260507-115112/03-demo.log`
- TEE/public status: `artifacts/per-happy/20260507-115112/04-tee-status.json`

```text
PER submitted: yes
PER signature: 61mdQGGo7DHQ8a2kptVBGTDQWTgbXLj3ry2EXg4ppwWTqte9Dj3KB1GVndqkSMTqBb4okjc2UQP5fPnwp2CfWBA8
TEE status: err
TEE error: InvalidAccountForFee
Public RPC visibility: not_visible
Fallback used: no
```

## Patch applied during validation

`packages/demo-agents/src/demo.ts` no longer fetches a plain TEE blockhash for the PER release transaction. It now uses MagicBlock's SDK router:

```ts
const { ConnectionMagicRouter } = require("../../per-client/node_modules/@magicblock-labs/ephemeral-rollups-sdk");
const perConn = new ConnectionMagicRouter(PER_DEVNET_RPC, "confirmed");
return perConn.sendTransaction(perTx, [AGENT_A_KEYPAIR], { skipPreflight: true });
```

This is the correct direction because MagicBlock delegated-account transactions need a blockhash selected by writable account set (`getBlockhashForAccounts`). The remaining rejection after this patch is stronger evidence that the next blocker is lifecycle/account eligibility, not a simple routing bug.

## Diagnosis

The validation exposed a real integration gap rather than a generic endpoint failure:

- The current legacy PER path records `delegate_escrow` state in the Reddi Anchor program and submits `release_escrow_per` to MagicBlock TEE RPC.
- The current path does **not** create a MagicBlock permission account, delegate that permission, delegate the escrow PDA through the owner program with signer seeds, then commit/undelegate.
- MagicBlock's current PER guide requires that full permission/delegation lifecycle, usually implemented inside the program via CPI for PDA-owned state.
- The escrow account is a PDA, so client-only delegation helpers cannot cleanly make the PDA sign the required permission/delegation instructions.
- Therefore the TEE rejection is expected until the escrow program implements docs-conformant MagicBlock CPI hooks or a MagicBlock-native proof program is added.

## Judge-safe framing

Use this wording:

> Historical framing at this point was: “We integrated and live-tested the MagicBlock PER/TEE lane and found the missing permission/delegation lifecycle.” Current framing after PR #274 is: “Bounded MagicBlock PER AgentVault settlement is proven for the Quasar-owned agent-vault route; arbitrary-wallet/private payee settlement remains unclaimed.”

Avoid these claims:

- “PER settlement succeeded.”
- “Final Quasar path executes inside MagicBlock TEE.”
- “MagicBlock privacy is production-ready in this repo.”

## Follow-up required for a stronger MagicBlock prize push

To turn this from boundary proof into successful live proof:

1. Add docs-conformant MagicBlock permission + delegation CPI hooks to a program path.
2. Include the TEE validator pubkey `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` in delegation.
3. Use MagicBlock `ConnectionMagicRouter` / tokenized TEE connection for delegated-account transactions.
4. Commit/undelegate via MagicBlock’s SDK/magic context.
5. Re-run `bash scripts/run-per-happy-smoke.sh` and require TEE status `finalized` with `err: null`.

## Validation commands run

```bash
NETWORK_PROFILE=devnet NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com NEXT_PUBLIC_PER_RPC=https://devnet-tee.magicblock.app npm run test:per:happy
npm --prefix packages/demo-agents exec tsc -- --noEmit
npx tsc -p packages/demo-agents/tsconfig.json --noEmit
```

TypeScript checks are currently blocked by pre-existing workspace config/type issues unrelated to the MagicBlock patch: root test fixture literal typing, path alias resolution, and package `rootDir` crossings into `lib/` and `packages/x402-solana/`.
