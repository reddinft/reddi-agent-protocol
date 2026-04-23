# Devnet Agent Cleanup Runbook (Owner-Signed Deregistration)

## Purpose
Reset demo agent registrations on devnet/local Surfpool so onboarding/register demos start from a clean state.

## On-chain authority model
- Program instruction: `deregister_agent`
- Authorization: owner-only (`has_one = owner` + owner signer)
- Admin force-unregister: **not supported** in current program

## Command
```bash
cd packages/demo-agents
npm run deregister
```

## What it does
- Derives each demo wallet's agent PDA (A/B/C)
- Skips missing PDAs (already deregistered)
- Sends owner-signed `deregister_agent` tx
- Prints tx signatures + explorer URLs

## Follow-up (fresh demo reset)
```bash
npm run fund
npm run register
npm run demo
```

## Notes
- Closing agent PDA returns rent to owner.
- Registration burn fee is not refunded.
- For non-demo wallets, replicate the same owner-signed instruction pattern with wallet-specific keys.
