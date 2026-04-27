Feature: Bucket D and E Security + Reliability
  As a protocol operator
  I want endpoint/payment compatibility and operational guardrails
  So that runtime safety and recoverability remain predictable

  Background:
    Given specialist endpoints and orchestration routes are configured

  @D1.1 @D1.2 @D1.3 @route-unit
  Scenario: x402 public paths bypass token gate while control paths stay protected
    When endpoint security compatibility checks execute
    Then `/v1/*`, `/x402/*`, and `/healthz` remain publicly reachable for payment handshake
    And non-public/control routes still require token-gated access
    And misconfiguration is detectable in healthcheck behavior
    And the behavior is covered by "lib/__tests__/endpoint-security-compat.test.ts"

  @E2.1 @E2.2 @route-unit
  Scenario: Operator key status and rotation safeguards are explicit
    When operator key status and rotation validations run
    Then missing/invalid operator key states are surfaced with recovery guidance
    And valid key states expose readiness metadata
    And the behavior is covered by:
      | lib/__tests__/operator-key-rotation.test.ts |
      | lib/__tests__/onboarding-operator-status-routes.test.ts |

  @E3.1 @E3.2 @E3.3 @route-unit
  Scenario: RPC endpoint configuration obeys override and fallback contracts
    When program RPC configuration is evaluated
    Then explicit env override wins
    And devnet fallback is used when override is absent
    And usage consistency is enforced by tests
    And the behavior is covered by "lib/__tests__/program-rpc-config.test.ts"

  @E.integration @integration
  Scenario: Runtime-backed integration lane publishes evidence artifacts
    When integration lane executes in a ready environment
    Then runtime-backed test artifacts are generated under `artifacts/integration-lane/`
    And CI/nightly workflow uploads artifacts for retention
    And environment readiness telemetry is included in summary output
