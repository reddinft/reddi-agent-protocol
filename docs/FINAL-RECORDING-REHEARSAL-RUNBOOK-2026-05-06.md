# Final Recording Rehearsal Runbook — 2026-05-06

## Goal

Record the Colosseum Frontier submission with Quasar-compiled Solana programs as the active on-chain proof path and bounty/product evidence clearly framed.

## Non-negotiables

- Active demo target: Quasar, not legacy Anchor.
- Show four Quasar devnet program IDs:
  - Escrow `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
  - Registry `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
  - Reputation `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`
  - Attestation `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`
- Do not claim mainnet-ready; architectural audit blockers remain.
- Do not claim MagicBlock PER/TEE live proof unless separately validated.
- Do not claim successful public Jupiter devnet execution. Current safe Jupiter framing is: local Surfpool/mock-Jupiter invoke success plus public Jupiter quote/build/sign boundary. A real successful Jupiter swap requires separately approved mainnet-beta execution.
- Legacy Anchor registrations/artifacts are reference-only.

## Recording environment

```bash
export NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar
export HACKATHON_DEMO_TARGET=quasar
export DEMO_PROGRAM_TARGET=quasar
export DEMO_SETTLEMENT_MODE=public
```

## Pre-recording gates

Fast gates:

```bash
npm run check:quasar:submission
npm run test:bdd:index
NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar npm run build
```

Network proof gates:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/check-devnet-agent-pdas.ts
DEMO_PROGRAM_TARGET=quasar HACKATHON_DEMO_TARGET=quasar DEMO_SETTLEMENT_MODE=public npm run demo --prefix packages/demo-agents
```

Heavy/local validator gate, rerun if code changed since last Surfpool pass:

```bash
npm run test:surfpool:quasar-critical
```

## Recording sequence

1. Open `/economic-demo` with `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar`.
2. Show the Solana program target card: “Quasar hackathon target active”.
3. Show the four Quasar program IDs and `submission readiness: ready`.
4. Trigger the human-action economic demo panels:
   - dry-run workflow plan
   - balance snapshot
   - Surfpool rehearsal plan/evidence
   - x402 readiness / disclosure evidence
   - 30-agent OpenRouter metadata/use-case triggers
5. Switch to terminal proof and run/show the Quasar A→B→C devnet demo output.
6. Highlight latest proof map: `docs/COLOSSEUM-FINAL-QUASAR-PROOF-MAP-2026-05-06.md`.
7. Close with honest boundaries:
   - Quasar-native devnet proof is live.
   - Surfpool localnet confidence passed.
   - x402/OpenRouter/Jupiter evidence is visible with exact boundaries.
   - Jupiter: Surfpool/mock-Jupiter is the successful no-real-funds visual; public Jupiter devnet is quote/build/sign boundary only.
   - MagicBlock PER/TEE and successful live Jupiter swap are not final claims unless separately run with explicit approval.
   - Not mainnet-ready until architectural audit blockers are resolved and re-reviewed.

## Latest green evidence

- PR #244 merged to main as `bbfa0a92`; post-merge main Quasar Program Tests run `25447650320` passed.
- PR #246 merged to main as `6f0b33c4`: `/economic-demo` UI labels the signed devnet budget-lane tx as **not** a Jupiter swap receipt.
- PR #247 merged to main as `a51fab80`: generated run report now uses `Jupiter quote and budget-lane proof` / `live_quote_plus_signed_devnet_budget_lane`, not executed devnet swap language.
- Devnet Reputation upgrade tx: `24bf49dnB9YCiqS6uT21jnQHRy9RveTquffBSNjhUpeHPE663kf7PEMCMch5k4ZR9sADxYUWvVijufEN993PVzqg`.
- Latest full devnet Quasar A→B→C PASS in 6516ms:
  - Escrow lock tx `22XLto6VVbfYGZfRPvR65KNVEyztw4HAm1c7gPbWNXWpcNbqBdtNHFpAEeGL4L8T6UodT2fxan4yxYdPNb8hDzhx`
  - Settlement tx `4bhPXA3SCDM1CQKBHMVxKFiGtfcmqnNEnTFDpEW2i85DWiE9dFr3co7h5EUL2ysqMs3ctcFmHfu8fpjefzpzz1JJ`
  - Rating PDA `cwBzEz3p26mKU7FGWQWDkkmKY8j8NG4iPgruSkVJqKz`
  - Attestation PDA `G2hmyNWC3N8zdqKRNgzgr7z6sN8wxJtc9YjpYmoWgzT1`
