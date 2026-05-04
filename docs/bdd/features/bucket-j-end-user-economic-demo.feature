Feature: End-user economic workflow demo

  Background:
    Given the Reddi Agent Protocol marketplace is running on Solana devnet
    And live downstream specialist calls are disabled unless explicit spend gates are enabled
    And demo artifacts must not expose private keys, signer material, provider API keys, or payment secrets

  Scenario: Static fixture explains the economic workflow without spending
    Given the user opens /economic-demo
    When they select the webpage, research article, or picture scenario
    Then the page shows the end-user request
    And it shows the orchestrator, downstream specialists, and attestors
    And it shows payload summaries flowing between participants
    And it shows planned x402 amounts and receipt placeholders
    And it shows starting balances, ending balances, and wallet deltas
    And it performs zero wallet mutations

  Scenario: Image generation stays disabled until explicitly enabled
    Given ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION is not true
    When a caller posts to /api/economic-demo/image
    Then the response is 403
    And the error is image_generation_disabled
    And no OpenAI or Fal.ai generation request is made

  Scenario: Picture workflow uses OpenAI first and Fal.ai fallback when enabled
    Given ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION is true
    And OpenAI image generation or Fal.ai is configured
    When the picture scenario requests an image
    Then the request goes through the economic demo image adapter
    And the provider and model are recorded
    And the generated image is available to the workflow
    And vision validation and verification attestation can be attached afterward

  Scenario: Dry-run orchestration builds a real planned economic graph
    Given dry-run marketplace delegation is enabled
    When the user submits an end-user scenario
    Then the orchestrator returns selected specialist candidates
    And every edge includes endpoint, wallet, price, capability, and required attestors
    And downstreamCallsExecuted is 0
    And the ledger is marked planned rather than paid

  Scenario: Surfpool dress rehearsal proves local SOL transfer semantics
    Given a Surfpool local validator is running with deterministic funded test wallets
    And end-user, orchestrator, specialist, and attestor wallets are available locally
    When the economic demo workflow runs against the local validator
    Then SOL transfers occur for approved specialist consumption edges
    And the before and after balances match the expected edge ledger
    And transaction signatures or local validator receipts are recorded
    And a non-allowlisted or over-budget edge produces zero balance delta
    And no devnet or mainnet wallet is mutated

  Scenario: One live specialist edge is bounded and reviewable
    Given live demo mode is explicitly approved for one devnet edge
    And the endpoint allowlist contains exactly one specialist endpoint
    And max downstream calls is 1
    And the lamport cap is set for the one edge
    When the orchestrator executes the approved edge
    Then it captures an x402 receipt or fail-closed reason
    And it captures before and after balances for payer and payee
    And it does not retry automatically

  Scenario: Multi-edge demo returns output and economic impact
    Given multi-edge demo mode is explicitly approved
    When the webpage or research article workflow completes
    Then the final output is shown to the user
    And attestor guidance is shown
    And each participating wallet has a start balance, end balance, and delta
    And a bounded evidence artifact is produced
