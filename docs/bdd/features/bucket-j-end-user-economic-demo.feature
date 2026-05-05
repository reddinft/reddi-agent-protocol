Feature: End-user economic workflow demo

  Background:
    Given the Reddi Agent Protocol marketplace is running on Solana devnet
    And live downstream specialist calls are disabled unless explicit spend gates are enabled
    And demo artifacts must not expose private keys, signer material, provider API keys, or payment secrets
    And autonomous specialists and attestors may act as consumer agents only when their manifest discloses downstream marketplace delegation

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

  Scenario: Picture workflow dry-run produces a storyboard without hidden image spend
    Given picture workflow planning is in storyboard dry-run mode
    And ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION is not true
    When the picture storyboard graph is proposed
    Then it includes visual brief, blocked image adapter, storyboard validation, and release attestation edges
    And the blocked image adapter edge has downstream-disclosure ledger expectation reddi.downstream-disclosure-ledger.v1
    And the storyboard frames include positive prompts, negative prompts, and evidence caveats
    And imageGenerationExecuted is 0
    And no OpenAI request, Fal.ai request, paid provider request, signing operation, wallet mutation, or devnet transfer occurs

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

  Scenario: Public marketplace pages show agent manifest tools, skills, and dependencies
    Given a marketplace specialist or attestor may call other agents or external MCP services while fulfilling its role
    When a user opens /agents or /agents/:wallet
    Then the public marketplace shows manifest tools and skills for the agent
    And the detail page lists marketplace agents it may call
    And the detail page lists external MCP servers it may use
    And the detail page lists non-marketplace agents or services it may leverage
    And the disclosure is visible before the user invokes the agent

  Scenario: Agent manifests disclose downstream marketplace delegation
    Given a marketplace specialist or attestor may call other agents while fulfilling its role
    When a consumer agent reads /.well-known/reddi-agent.json
    Then the manifest declares that downstream marketplace calls may occur
    And it lists expected downstream capability categories, tools, skills, external MCP servers, non-marketplace agent calls, budget policy, attestor expectations, and payload-disclosure policy
    And the consumer agent can reject the agent before purchase if the disclosure is unacceptable

  Scenario: Downstream calls return transparent disclosure without exposing proprietary value-add
    Given an autonomous specialist calls another marketplace agent during execution
    When it returns its result to the consumer agent
    Then the response includes a downstream-disclosure ledger
    And the ledger identifies each called agent, endpoint or wallet, payload summary or hash, x402 amount and receipt or challenge state, and attestor links
    And any obfuscated returned details include an explicit moat_protection reason
    And called-agent identity, payload class, payment evidence, and attestation chain are not hidden

  Scenario: Multi-edge demo returns output, disclosure ledger, and economic impact
    Given multi-edge demo mode is explicitly approved
    When the webpage or research article workflow completes
    Then the final output is shown to the user
    And attestor guidance is shown
    And each downstream call has a reddi.downstream-disclosure-ledger.v1 entry
    And each participating wallet has a start balance, end balance, and delta
    And a bounded evidence artifact is produced

  Scenario: Research workflow dry-run declares evidence and disclosure before live calls
    Given research workflow planning is in dry-run mode
    And public hosted specialist manifests expose dependency disclosure parity
    When the research article workflow graph is proposed
    Then it lists retrieval, research synthesis, content drafting, explainability, and verification edges
    And each planned edge declares payload class, citation or evidence caveats, attestor criteria, and refund or dispute behavior
    And each planned edge has a downstream-disclosure ledger expectation with x402 state planned
    And downstreamCallsExecuted is 0
    And no paid provider request, signing operation, wallet mutation, or devnet transfer occurs

  Scenario: Submission readiness follows retrospective-driven BDD loops
    Given the economic demo is being prepared for judge or submission review
    And live research, paid image generation, signing, wallet mutation, devnet transfer, and Coolify mutation are not approved
    When the submission readiness plan advances a phase
    Then the phase declares BDD expectation, scope, acceptance criteria, validation, evidence artifact, and retrospective prompt
    And the retrospective must record what worked, what failed or surprised us, safety and spend review, judge clarity, and plan adjustment
    And the next phase cannot expand scope until the retrospective updates the plan
    And local ignored evidence paths may be referenced but raw private artifact contents are not published

  Scenario: Submission prep artifact index is locally checkable without live calls
    Given a local economic demo submission prep pack exists under artifacts/economic-demo-submission-prep/latest
    When the submission prep checker validates the pack
    Then it confirms the demo entrypoint, green evidence chain, local evidence paths, recording outline, and hard no-go list are present
    And every referenced local evidence artifact path exists
    And no hosted specialist call, provider request, signing operation, wallet mutation, devnet transfer, or Coolify mutation occurs

  Scenario: Operator checklist gives a public-safe recording path
    Given the economic demo operator checklist is committed
    When Nissan prepares to record or submit the economic demo
    Then the checklist names the demo route, local prep checker, five-beat narration, public PR or CI proof chain, and hard not-claimed section
    And it distinguishes controlled demo evidence, local Surfpool proof, storyboard-only image planning, and approval-gated future work
    And it references local ignored evidence paths only as operator pointers rather than publishing raw artifact contents
    And following the checklist does not call hosted specialists, request providers, sign, mutate wallets, transfer devnet funds, or mutate Coolify configuration
