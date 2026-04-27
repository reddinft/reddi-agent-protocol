Feature: Bucket H Consumer Orchestrator Lifecycle
  As a consumer orchestrator
  I want deterministic specialist resolution, settlement, and signaling
  So that paid calls remain auditable and safe

  Background:
    Given planner tool routes are available

  @H1.1 @H1.2 @H1.3 @route-unit
  Scenario: Register consumer validates wallet and supports idempotent updates
    When a client calls POST /api/planner/tools/register-consumer with wallet metadata
    Then valid payloads are accepted
    And duplicate registration updates the existing profile
    And invalid wallet payloads are rejected
    And the behavior is covered by "lib/__tests__/planner-register-consumer-route.test.ts"

  @H1.4 @route-unit
  Scenario: Manifest exposes consumer orchestration tools
    When a client calls GET /api/planner/tools
    Then consumer-facing orchestration endpoints are present
    And the behavior is covered by "lib/__tests__/planner-tools-manifest-route.test.ts"

  @H2.1 @route-unit
  Scenario: Resolve specialist returns deterministic candidates
    When a client calls POST /api/planner/tools/resolve with task policy
    Then deterministic candidate selection is returned with reasons
    And the behavior is covered by "lib/__tests__/planner-resolve-route.test.ts"

  @H2.2 @H2.3 @route-unit
  Scenario: Resolve attestor supports success and no-candidate paths
    When a client calls POST /api/planner/tools/resolve-attestor
    Then an eligible attestor can be returned
    And no-candidate paths are explicit and actionable
    And the behavior is covered by "lib/__tests__/planner-resolve-attestor-route.test.ts"

  @H3.1 @H3.2 @H3.3 @H3.4 @H3.5 @route-unit
  Scenario: Invoke and settlement lifecycle enforces payment guardrails
    When a client calls invoke then decide_settlement (release or dispute)
    Then paid runs can enter and transition through settlement states
    And unpaid/invalid state transitions are rejected
    And the behavior is covered by:
      | lib/__tests__/planner-invoke-route.test.ts |
      | lib/__tests__/planner-release-route.test.ts |

  @H4.1 @H4.2 @route-unit
  Scenario: Quality signal persistence updates routing and reputation triggers
    When a client submits quality signal for a run
    Then score is persisted and linked to the run
    And reputation commit trigger behavior is enforced
    And the behavior is covered by "lib/__tests__/planner-signal-route.test.ts"

  @H4.3 @route-unit
  Scenario: Settlement and rating remain independently auditable
    When settlement and quality signal are recorded for the same run
    Then both tracks remain independently queryable and consistent
    And the behavior is covered by "lib/__tests__/planner-auditability.test.ts"

  @H5.1 @H5.2 @H5.3 @dogfood @route-unit
  Scenario: Dogfood ping specialist + attestor gate controls escrow release
    Given a test specialist is discoverable for ping/haiku tasks
    And a test attestor is discoverable for pong+haiku verification
    When a consumer executes the dogfood flow with message "ping"
    Then specialist responses that include pong + valid 5/7/5 haiku are accepted
    And specialist responses that fail pong or haiku format are rejected
    And escrow is released only on attestor pass, otherwise refunded/disputed
    And the behavior is covered by:
      | lib/__tests__/dogfood-testing-specialist-route.test.ts |
      | lib/__tests__/dogfood-testing-attestor-route.test.ts |
      | lib/__tests__/dogfood-consumer-run-route.test.ts |

  @H5.4 @dogfood @e2e
  Scenario: Dogfood UI surfaces pass and fail settlement outcomes
    When an operator runs forced pass and forced fail from /dogfood
    Then released and refunded outcomes are both visible in UI output
    And the behavior is covered by "e2e/dogfood.spec.ts"

  @H6.1 @H6.2 @H6.3 @role-attestor @route-unit
  Scenario: Attestor role path exposes verifier readiness and audit proof
    When an attestor opens the attestation dashboard
    Then the role path summarizes profile resolution, work queue, audit proof, and release/refund gate readiness
    And no-candidate, no-activity, and ready states have explicit next actions
    And the behavior is covered by:
      | lib/__tests__/attestor-role-readiness.test.ts |
      | lib/__tests__/planner-resolve-attestor-route.test.ts |
