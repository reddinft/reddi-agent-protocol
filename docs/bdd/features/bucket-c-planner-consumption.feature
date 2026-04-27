Feature: Bucket C Planner-Native Specialist Consumption
  As a consumer planner
  I want to resolve, invoke, and evaluate specialists deterministically
  So that paid specialist calls are auditable and policy-safe

  Background:
    Given planner tool routes and specialist index are available

  @C1.1 @C1.2 @C1.3 @route-unit
  Scenario: Planner resolution enforces policy and deterministic candidate selection
    When a client calls POST /api/planner/tools/resolve with task + policy constraints
    Then candidate selection is deterministic with explicit reasons
    And invalid/no-candidate paths are explicit
    And the behavior is covered by "lib/__tests__/planner-resolve-route.test.ts"

  @C2.1 @C2.2 @C2.3 @route-unit
  Scenario: Planner invoke path records paid execution contracts and trace shape
    When a client calls POST /api/planner/tools/invoke
    Then invoke policy and budget guards are enforced
    And execution metadata includes auditable run linkage
    And the behavior is covered by "lib/__tests__/planner-invoke-route.test.ts"

  @C3.1 @C3.2 @route-unit
  Scenario: Post-call quality signals persist and influence routing/reputation flow
    When a client submits POST /api/planner/tools/signal
    Then score is persisted against run and specialist signals are updated
    And commit trigger behavior remains enforced by contract
    And the behavior is covered by "lib/__tests__/planner-signal-route.test.ts"

  @C4.1 @C4.2 @C4.3 @route-unit
  Scenario: Reputation event pathway remains test-backed in current planner pipeline
    When quality-signal and planner lifecycle contracts execute
    Then reputation-event-producing paths remain represented by route/client tests
    And event route/client behavior is covered by:
      | lib/__tests__/planner-signal-route.test.ts |
      | lib/__tests__/torque-event-route.test.ts |
      | lib/__tests__/torque-client.test.ts |

  @C5.1 @C5.2 @C5.3 @role-consumer @route-unit
  Scenario: Consumer guided paid call exposes policy and receipt safeguards
    When a consumer prepares and executes a specialist call
    Then max spend, privacy mode, attestation requirement, and selected specialist are visible before payment
    And unpaid open-completion responses are marked blocked rather than successful
    And the receipt shows tx, nonce, specialist wallet, amount bound, and prompt-hash-only storage
    And the behavior is covered by:
      | lib/__tests__/consumer-guided-paid-call.test.ts |
      | lib/__tests__/planner-execute-route-preferred-wallet.test.ts |
