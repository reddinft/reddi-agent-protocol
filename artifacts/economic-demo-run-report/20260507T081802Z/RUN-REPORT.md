# Economic Demo Run Report
Generated: 2026-05-07T08:18:02.632Z
Scenario: webpage
## Story
- User starts with SOL when they do not have the required downstream USDC budget.
- A live Jupiter quote proves SOL→USDC route availability for the required downstream USDC budget.
- Surfpool/local or explicitly approved live execution funds the orchestrator upfront before downstream payments are released.
- Orchestrator pays specialist agents from the funded run budget.
- Attestors validate output quality, disclosure-ledger completeness, and payment receipt chain before release.
- Reputation updates are represented as commit-reveal events and are not final unless reveal receipt status is verified.
## Jupiter quote and budget-lane proof
- 0.042 SOL → 3.726188 USDC · route legs 1 · status live_quote_plus_signed_devnet_budget_lane
- local settlement/signature: 4LUki7dLhD4dQDbEV9d7Sq4v4MRbMUemDEbyxmXNUrGRostdsjjNPmiLScRSbZMNvbHudRnge9WkpQ6QDwU3KG7z
- signed devnet budget-lane tx, not Jupiter swap receipt: https://explorer.solana.com/tx/jenTEkjtfJz58v9az2sRVUpKYuNfMwsFtpCnstd7Epi8UomspqtPqQ1QVhANEVT1XBED1NhKsM3HozbHEGmrczh?cluster=devnet
- wallet-backed Jupiter attempt: signed_but_devnet_send_failed; signed=true; signature=none
- wallet-backed devnet rejection: Transaction resulted in an error. invalid transaction: Transaction loads an address table account that doesn't exist. Catch the `SendTransactionError` and call `getLogs()` on it for full details.
- caveat: Signed devnet transaction proves the SOL-funded demo budget lane and downstream payment flow; live Jupiter route quote proves route availability only. Wallet-backed Jupiter transaction was attempted separately and devnet rejected Jupiter mainnet account-table material. Not an executed Jupiter devnet or mainnet swap claim.
## Pay.sh / reddi-x402 compatibility
- package: reddi-x402
- flow: 402 Payment Required → 200 OK · receipt success/solana
- provider spec: config/pay-sh/reddi-x402-economic-demo-provider.yml
- registry metadata: providers/redditech/reddi-agent-protocol/reddi-x402-economic-demo-provider.md
- extension probes: capped_sessions=probe_only:Server returned 402 again after payment; split_payments=probe_only:Server returned 402 again after payment
- claim boundary: Sandbox Pay.sh gateway compatibility evidence only; no mainnet funds, no Umbra private settlement, and no MagicBlock PER settlement claimed.
## Umbra private x402 adapter
- rail: private-umbra · operation public-balance-to-receiver-claimable-utxo · status mocked_adapter_contract
- program: DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ
- evidence: artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.json
- devnet smoke: devnet_encrypted_balance_deposit_confirmed · deposit queue 3DUNUaSjPWC2qdXHX8NTCN5BAnosvcZ5v5vJhUTjbD7YhMUdsPWyKEFBMrLNRc9EZnkstKJudkpXL8dhax2oD7Vt · callback RB1AaW9iXrAfQhMgEaRbrRumEohMd2YGAi2UtgQeZR1q9Pq4Rey1pRC872MMAw9AVxg3t85c8mYjKfob4iNYE3v
- devnet evidence: artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.json
- claim boundary: Umbra private x402 adapter contract: mocked/local proof only until an approval-gated devnet SDK smoke submits registration, UTXO creation, scan, and claim transactions.
## Payment receipts
- end-user → agentic-workflow-system: 3331250 lamports · 4LUki7dLhD4dQDbEV9d7Sq4v4MRbMUemDEbyxmXNUrGRostdsjjNPmiLScRSbZMNvbHudRnge9WkpQ6QDwU3KG7z · local_surfpool_executed
- agentic-workflow-system → content-creation-agent: 1000000 lamports · t6GSNyW3LzuGF6EbRZEBmMzkdKKGG1C1dcyWn1ZTw5xu31XzsARgYWavyU4LAiETejAzURmkeqcuqQ8ZSVe6opL · local_surfpool_executed
- agentic-workflow-system → reddi-protocol-treasury: 500 lamports · 2Vy3ZbgY9f3wt2a4Hbn1t7mha69dyhygqReiDH1EvSJttk8KL7REHvNywq6xDrr2EzbKzRNUcAur5SVqm5RunKdC · local_surfpool_executed
- agentic-workflow-system → code-generation-agent: 1000000 lamports · F1Lty7G7ViyYRsT5hBpTAcBDzeogiHrJL4Sbdpcar6gMqK6z81SSKTDRp6tkchgkP3hDt64E3DEVz3ZcBdC4HAS · local_surfpool_executed
- agentic-workflow-system → reddi-protocol-treasury: 500 lamports · 36jNP9zzFLpYRBorbtzQ53NnsEDDB8nyX4JgVWsWKnvWYNqW4a6qrSgETRM5XRGdfbXDchAvkaf28UDrrmvsWqgj · local_surfpool_executed
- agentic-workflow-system → verification-validation-agent: 500000 lamports · 5A8sBC9H3d6CDsMzgjt7jEKzRg1KZ2iJmHm4unPpeo1R7PHwJR66o9bbNYJ1MgNNVdke3Co7cu8feqh4bZ9x97oR · local_surfpool_executed
- agentic-workflow-system → reddi-protocol-treasury: 250 lamports · 3DxcVNe592KrsPbowdufo1btfjxiwsNjp9iPLxKyt5FQZPUDy7297YM4ahk9ThFskPrNs1AZspbC1Ko2TY7tLx3x · local_surfpool_executed
## Attestations
- verification-validation-agent validates content-creation-agent: release_recommended
- verification-validation-agent validates code-generation-agent: release_recommended
## Reputation commit-reveal
- content-creation-agent: 72 → commit 5/5 → 77; commit fixture-local-tx:webpage:reputation:content-creation-agent:commit; reveal fixture-local-tx:webpage:reputation:content-creation-agent:reveal; fixture_commit_reveal_pending_devnet_receipts
- code-generation-agent: 76 → commit 5/5 → 81; commit fixture-local-tx:webpage:reputation:code-generation-agent:commit; reveal fixture-local-tx:webpage:reputation:code-generation-agent:reveal; fixture_commit_reveal_pending_devnet_receipts