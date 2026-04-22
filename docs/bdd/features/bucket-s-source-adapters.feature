Feature: Bucket S Source Adapter Onboarding
  As a protocol operator
  I want source ecosystems to onboard through a shared contract and conformance harness
  So that supervisor, attestor, and consumer roles remain settlement-safe and auditable

  Background:
    Given source-adapter manifests are validated before runtime integration

  @S1.1 @source-adapter @registration-safety
  Scenario: Source adapter manifest must validate before probe succeeds
    When a source submits an invalid sourceAdapter manifest
    Then `/api/register/probe` rejects with `invalid_source_adapter`
    And the response includes actionable mismatch reasons

  @S1.2 @source-adapter @registration-safety
  Scenario: Hosted unsafe target protections remain active with source adapters
    When a source probe targets localhost or private-network endpoints
    Then probe is rejected with `invalid_url`

  @S2.1 @supervisor @orchestration
  Scenario: OpenClaw supervisor orchestration resolves then invokes deterministically
    When the supervisor wrapper executes a task
    Then it calls resolve before invoke
    And returns phase metadata for auditability

  @S3.1 @attestor @schema-integrity
  Scenario: OpenClaw attestor manifest includes strict attestation schema
    When an attestor manifest is built from OpenClaw source profile defaults
    Then `attestationSchema` is pinned to `reddi.attestation.v1`
    And schema validation succeeds

  @S4.1 @consumer @settlement-safety
  Scenario: Connector surfaces invoke errors explicitly
    When invoke endpoint returns a non-OK status
    Then the connector throws a deterministic error
    And no implicit success path is returned

  @S5.1 @conformance @cross-source-parity
  Scenario: Source conformance harness emits reusable artifact summaries
    When conformance script runs in smoke mode
    Then summary artifacts are written under `artifacts/source-conformance/...`
    And step pass/fail counts are captured for retrospective updates
