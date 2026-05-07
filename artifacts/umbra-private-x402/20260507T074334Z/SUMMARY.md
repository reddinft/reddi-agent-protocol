# Umbra Private x402 Evidence

Generated: 2026-05-07T08:03:16.585Z

## Verdict

Reddi Agent Protocol now has an executable Umbra private x402 adapter contract for the hackathon submission. This artifact proves the dependency-injected SDK call path and receipt shape for a receiver-claimable Umbra UTXO lane.

## Flow

- Package surface: reddi-x402
- Rail: private-umbra
- Network target: devnet
- Operation: public-balance-to-receiver-claimable-utxo
- Umbra program: DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ
- Indexer: https://utxo-indexer.api-devnet.umbraprivacy.com
- Relayer: https://relayer.api-devnet.umbraprivacy.com
- Registration signatures: mock-umbra-devnet-register:code-generation-agent
- Create UTXO signatures: mock-umbra-devnet-create-utxo:agentic-workflow-system:code-generation-agent:10000
- Claim signatures: mock-umbra-devnet-claim-encrypted:code-generation-agent

## Selective disclosure

- Reveals: rail, network, mint, amount, recipientProfileId, operation, signatures
- Hides: payerPublicAta, recipientFinalWalletLink, encryptedBalance, utxoSecret

## Claim boundary

Umbra private x402 adapter contract: mocked/local proof only until an approval-gated devnet SDK smoke submits registration, UTXO creation, scan, and claim transactions.

This is not a live Umbra settlement claim. It does not claim devnet transaction submission, live private settlement, or Quasar-native Umbra execution.

## Next gate

approval-gated Umbra devnet SDK smoke: register, create receiver-claimable UTXO, scan, claim via relayer
