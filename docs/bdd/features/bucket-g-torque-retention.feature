Feature: Bucket G Torque Retention Layer
  As a product operator
  I want retention and leaderboard telemetry to be reliable and non-breaking
  So that growth loops remain observable without blocking core flows

  Background:
    Given Torque client and route integrations are configured

  @G1.1 @G1.2 @G1.3 @G1.4 @G1.5 @route-unit
  Scenario: Torque client handles enabled, disabled, and failure modes safely
    When Torque client emits events with varied config/network conditions
    Then enabled paths send expected payload contracts
    And missing token paths no-op safely
    And network failures do not break caller flow
    And the behavior is covered by "lib/__tests__/torque-client.test.ts"

  @G1.6 @G1.7 @G1.8 @route-unit
  Scenario: Event route accepts and validates onboarding/planner retention events
    When event payloads are posted to /api/torque/event
    Then accepted event types and shapes return expected responses
    And event pipeline contracts remain stable for onboarding/planner/reputation flows
    And the behavior is covered by "lib/__tests__/torque-event-route.test.ts" and "lib/__tests__/torque-onboarding-event.test.ts"

  @G2.1 @G2.2 @G2.3 @G2.4 @G2.5 @G2.6 @route-unit @e2e-ui
  Scenario: Leaderboard route and UI remain safe under empty and live states
    When leaderboard API and page are exercised
    Then empty/failure states are handled gracefully
    And UI renders table or empty state with attribution
    And sensitive token data is not exposed
    And the behavior is covered by:
      | lib/__tests__/torque-leaderboard-route.test.ts |
      | e2e/leaderboard.spec.ts |
