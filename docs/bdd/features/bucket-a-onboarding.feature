Feature: Bucket A Specialist Onboarding
  As a non-crypto specialist operator
  I want a guided onboarding flow with safety gates
  So that I can become discoverable and callable without misconfiguration

  Background:
    Given the onboarding wizard and supporting API routes are available

  @A1.1 @A1.2 @A1.3 @A1.7 @A1.step-flow @e2e-ui
  Scenario: Consent and runtime gating enforce safe step progression
    When a specialist progresses through onboarding consent and runtime steps
    Then consent checkboxes gate next-step access
    And runtime readiness gates progression
    And registration preflight UX is exposed before signing
    And the behavior is covered by "e2e/onboarding.spec.ts"

  @A1.4 @A1.5 @A1.6 @route-unit
  Scenario: Wallet and sponsorship paths enforce readiness constraints
    When a specialist uses onboarding wallet and sponsorship actions
    Then existing-wallet and bootstrap-wallet branches are supported
    And backup/passphrase checkpoints are enforced for bootstrap path
    And sponsorship amounts are constrained to onboarding-safe scope
    And the behavior is covered by "app/api/onboarding/wallet/route.ts" and "lib/onboarding/wallet-sponsorship.ts"

  @A1.8 @integration
  Scenario: Registration can complete on-chain in integration environment
    When onboarding Step 5 submits register_agent transaction with a connected wallet
    Then a registration signature and explorer proof are returned
    And integration-lane runtime path provides evidence when infra is available

  @A2.1 @A2.2 @route-unit
  Scenario: Healthcheck gate controls attestation eligibility
    When onboarding healthcheck fails or passes
    Then attestation submission is blocked on failure
    And attestation submission can proceed only after pass state
    And the behavior is covered by "app/api/onboarding/healthcheck/route.ts" and "app/api/onboarding/attestation/route.ts"

  @A2.3 @integration
  Scenario: On-chain attestation submit path executes with configured operator signer
    When attestation is submitted with a configured operator signer
    Then attestation transaction metadata is returned
    And audit record is persisted
    And runtime-backed evidence is integration-lane/environment dependent

  @A2.4 @route-unit
  Scenario: Attestation and onboarding audit data are persisted
    When onboarding records attestation and audit events
    Then audit route surfaces persisted records
    And the behavior is covered by "app/api/onboarding/audit/route.ts"

  @A2.5 @route-unit
  Scenario: Missing or invalid operator signer fails explicitly
    When operator key is missing or malformed
    Then status and attestation helpers return explicit recovery signals
    And the behavior is covered by:
      | lib/__tests__/operator-key-rotation.test.ts |
      | lib/__tests__/onboarding-operator-status-routes.test.ts |

  @A2.6 @route-unit @e2e-ui
  Scenario: Confirm/dispute follow-through remains available after attestation
    When onboarding reaches post-attestation settlement actions
    Then confirm/dispute flow is available and state-consistent
    And behavior is covered by onboarding and planner settlement contracts
