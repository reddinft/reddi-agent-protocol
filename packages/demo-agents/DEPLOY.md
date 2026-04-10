# Devnet Deployment Guide

## Status

The program was deployed to devnet during Phase 6, but the original `.so` was built with a
placeholder `declare_id!` value. The devnet airdrop was rate-limited before the corrected
binary could be uploaded.

**Current deployed address:** `77rkRQxe4GRzHU56H6JuWPFe27g4NoRBz4GGftuUZXmX` ← needs redeployment

## One-time setup (Nissan runs this once with funded wallet)

```bash
# 1. Fund the upgrade authority wallet (blitz-dev needs ~3 SOL)
solana airdrop 2 d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR --url devnet
solana airdrop 2 d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR --url devnet

# 2. Sync program ID from keypair and rebuild
~/.avm/bin/anchor keys sync
~/.avm/bin/anchor build

# 3. Deploy (the keypair at target/deploy/escrow-keypair.json determines the address)
~/.avm/bin/anchor deploy --provider.cluster devnet

# 4. Update ESCROW_PROGRAM_ID in packages/demo-agents/src/config.ts with new address

# 5. Fund agent wallets
solana airdrop 1 AjAPTMjZbsJbeXmdBGzMADWkFixRvVw3mKt8sp99mVCe --url devnet  # Agent A
solana airdrop 1 78DhERomBE36WYyd5YcKKDvNpptD5WhEfUmar3LqPeVj --url devnet  # Agent B
solana airdrop 1 7XW2SbWWp2R38WFRrhZJDS9A991kTSjcoYNSK2nX3zoq --url devnet  # Agent C

# 6. Register agents
cd packages/demo-agents && npm run register

# 7. Run the demo
npm run demo
```

## Agent wallets (pre-generated, each funded with 0.025 SOL from blitz-dev)

| Role | Pubkey |
|---|---|
| Agent A (Orchestrator) | `AjAPTMjZbsJbeXmdBGzMADWkFixRvVw3mKt8sp99mVCe` |
| Agent B (Specialist/Primary) | `78DhERomBE36WYyd5YcKKDvNpptD5WhEfUmar3LqPeVj` |
| Agent C (Judge/Attestation) | `7XW2SbWWp2R38WFRrhZJDS9A991kTSjcoYNSK2nX3zoq` |

Private keys in `.env.devnet` (gitignored — back this up separately).

## Timing

Demo targets < 10s end-to-end for Steps 1–7 (excluding async PER confirmation).
Devnet latency (~400–600ms per confirmation) is the bottleneck, not instruction encoding.
