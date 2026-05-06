# Colosseum Final Quasar Proof Map — 2026-05-06

## Status

Final-demo target: **Quasar-compiled Solana programs** for all demo-critical on-chain paths. PR #244 is merged to main as `bbfa0a92`, so the Quasar shared-builder/runtime path is now the mainline baseline.

Legacy Anchor artifacts and devnet registrations may remain as historical/reference evidence only. They are not the active hackathon proof path.

## Proof map for judges

| Surface | Final framing | Evidence | Boundary |
| --- | --- | --- | --- |
| Quasar programs | Live devnet multi-program deployment powers registry, escrow, reputation, and attestation | Escrow `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`; Registry `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`; Reputation `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`; Attestation `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex` | Not mainnet-ready; audit architectural blockers remain open |
| Surfpool | Local Quasar confidence gate before devnet | `npm run test:surfpool:quasar-critical` PASS after catching/fixing client commitment hash mismatch | Local validator proof, not production network proof |
| Devnet A→B→C | Live Quasar demo path proves agent-to-agent payment + reputation + attestation | `DEMO_PROGRAM_TARGET=quasar HACKATHON_DEMO_TARGET=quasar DEMO_SETTLEMENT_MODE=public npm run demo --prefix packages/demo-agents` PASS in 6516ms | Public Quasar escrow settlement; MagicBlock PER/TEE not claimed |
| x402 | Agent payment boundary/protocol story | `/economic-demo` and x402/OpenRouter evidence show 402 challenge, controlled receipts, disclosure ledger expectations, and payment-gated agent calls | Controlled/demo receipts unless live verifier is explicitly enabled |
| OpenRouter / 30 specialists | Marketplace of specialist agents for human-triggered workflows | `/economic-demo` uses deployed 30-agent profile metadata and specific use-case triggers | No hidden downstream paid calls on page load |
| Jupiter | Cross-token settlement/boundary lane | Jupiter quote + wallet-specific transaction + devnet signature attempt are evidenced; research note `docs/JUPITER-DEVNET-SWAP-RESEARCH-2026-05-07.md` shows public Jupiter APIs route against mainnet liquidity/account material | Do not claim successful Jupiter devnet execution. Options: honest signed-but-devnet-rejected boundary, local/Surfpool simulation, or explicit approved tiny mainnet-beta swap |
| MagicBlock | Ecosystem product boundary | Demo explicitly fail-closes/not-claims PER/TEE for final Quasar path unless separately validated | No PER/TEE claim in final Quasar demo today |
| Web app | Human-triggered demo surface | `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar npm run build` PASS; `/economic-demo` separates Quasar proof from supporting economic evidence | Inspect before recording for visual Anchor ambiguity |

## Latest devnet evidence

- Reputation upgrade tx: `24bf49dnB9YCiqS6uT21jnQHRy9RveTquffBSNjhUpeHPE663kf7PEMCMch5k4ZR9sADxYUWvVijufEN993PVzqg`
- Escrow lock tx: `22XLto6VVbfYGZfRPvR65KNVEyztw4HAm1c7gPbWNXWpcNbqBdtNHFpAEeGL4L8T6UodT2fxan4yxYdPNb8hDzhx`
- Settlement tx: `4bhPXA3SCDM1CQKBHMVxKFiGtfcmqnNEnTFDpEW2i85DWiE9dFr3co7h5EUL2ysqMs3ctcFmHfu8fpjefzpzz1JJ`
- Rating PDA: `cwBzEz3p26mKU7FGWQWDkkmKY8j8NG4iPgruSkVJqKz`
- Attestation PDA: `G2hmyNWC3N8zdqKRNgzgr7z6sN8wxJtc9YjpYmoWgzT1`

## Recording script spine

1. Open with Quasar target: show the four Quasar program IDs.
2. Show Surfpool local gate: localnet caught a real bug before devnet, then passed.
3. Trigger the frontend economic/demo flow by human action; narrate that it uses 30 specialist profiles and x402-style payment boundaries.
4. Show devnet terminal proof: Quasar A→B→C completes with escrow, settlement, reputation, and attestation.
5. Show ecosystem map: x402/OpenRouter/Jupiter/Surfpool/MagicBlock boundaries. For Jupiter, say: “we can build and sign a Jupiter-routed transaction, but public Jupiter devnet execution is not supported; successful live Jupiter requires mainnet approval.”
6. Close honestly: final demo is Quasar-native devnet proof; not mainnet-ready; MagicBlock PER/TEE and successful live Jupiter swap are not claimed unless separately run.

## Required pre-recording gates

```bash
npm run test:surfpool:quasar-critical
npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/check-devnet-agent-pdas.ts
DEMO_PROGRAM_TARGET=quasar HACKATHON_DEMO_TARGET=quasar DEMO_SETTLEMENT_MODE=public npm run demo --prefix packages/demo-agents
npm run check:quasar:submission
NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar npm run build
```

## Loop 1 retrospective — after PR #244 merge

- What changed: PR #244 is now merged, so Quasar shared instruction builders and final-demo fail-closed boundaries are on main.
- What we learned: Jupiter devnet is not a viable success path through public Jupiter APIs; the evidence points to mainnet-routed transactions, missing devnet program/account graph, and no network selector.
- Plan adjustment: stop spending time trying to force a Jupiter devnet success. Preserve the honest boundary proof and choose either local/Surfpool simulation or explicit tiny mainnet-beta execution if a successful swap visual is absolutely required.
- Action taken: updated the `/economic-demo` Jupiter card/run timeline so it cannot be misread as a successful devnet Jupiter swap claim. Validation: targeted ESLint, BDD index, and `npm run build` pass.
- Next loop: observe post-merge CI to completion, then decide whether a separate local/Surfpool simulation lane is worth adding for a successful no-real-funds swap visual.
