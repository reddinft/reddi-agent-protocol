# Economic Demo Run Report
Generated: 2026-05-07T07:44:52.453Z
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
- local settlement/signature: vGEpBArrz8r9Nrt6yM13s88MrXm7KDVwn8LhF4EX6h8jsj873N9nw6Z9zrELPaT3SWn3JfSMnebUmhH72mSVPKd
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
- claim boundary: Umbra private x402 adapter contract: mocked/local proof only until an approval-gated devnet SDK smoke submits registration, UTXO creation, scan, and claim transactions.
## Payment receipts
- end-user → agentic-workflow-system: 3330000 lamports · vGEpBArrz8r9Nrt6yM13s88MrXm7KDVwn8LhF4EX6h8jsj873N9nw6Z9zrELPaT3SWn3JfSMnebUmhH72mSVPKd · local_surfpool_executed
- agentic-workflow-system → content-creation-agent: 1000000 lamports · 45SR1HNi7G7K6ECWwWyEqiW55Ze7nBr3RWtpEgfwhouzZXAVDTgQrYzVmibyTY8zEzwGEsQJMHkUpomCGmMGjCqN · local_surfpool_executed
- agentic-workflow-system → code-generation-agent: 1000000 lamports · 2j5qvcu7RAUEDfMD8vkYniHgnNrTtpHknFWnXkfUkmn9d66RPwAkiJ1ZZcPqpKym52nXRMRPufCY1UoDTqDPZLLp · local_surfpool_executed
- agentic-workflow-system → verification-validation-agent: 500000 lamports · 2TtEpq8xjQXScjcMaYyYJa63KT9JpudPZKhnpd6ZggPpzXkmoJuf9sHoHCeimyyDEAWVYJ6eerchEsCcSmBCEtsL · local_surfpool_executed
## Attestations
- verification-validation-agent validates content-creation-agent: release_recommended
- verification-validation-agent validates code-generation-agent: release_recommended
## Reputation commit-reveal
- content-creation-agent: 72 → commit 5/5 → 77; commit fixture-local-tx:webpage:reputation:content-creation-agent:commit; reveal fixture-local-tx:webpage:reputation:content-creation-agent:reveal; fixture_commit_reveal_pending_devnet_receipts
- code-generation-agent: 76 → commit 5/5 → 81; commit fixture-local-tx:webpage:reputation:code-generation-agent:commit; reveal fixture-local-tx:webpage:reputation:code-generation-agent:reveal; fixture_commit_reveal_pending_devnet_receipts