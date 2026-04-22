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

  @S3.2 @attestor @schema-integrity @hermes
  Scenario: Hermes attestor formatter enforces rubric shape and score bounds
    When a Hermes attestor payload contains drifted rubric values
    Then formatter rejects deterministically with mismatch error
    And no implicit attestation payload is returned

  @S5.2 @conformance @cross-source-parity @hermes
  Scenario: Hermes source profile resolves from registry
    When source profile lookup is called for `hermes`
    Then profile metadata is returned with supported roles and runtimes

  @S3.3 @extension-bundle @pi @schema-integrity
  Scenario: pi source extension bundle must include canonical required extensions
    When a pi extension bundle omits a required extension
    Then compatibility validation fails with deterministic missing-extension output

  @S5.3 @conformance @cross-source-parity @pi
  Scenario: Cross-source conformance matrix emits openclaw/hermes/pi smoke status in one report
    When the matrix runner executes source conformance for all supported sources
    Then matrix summary includes rows for openclaw hermes and pi
    And each row contains pass fail and artifact summary path fields
