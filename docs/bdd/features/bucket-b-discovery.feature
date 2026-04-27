Feature: Bucket B Discovery and Capability Index
  As a consumer orchestrator
  I want to discover specialists by capabilities and quality signals
  So that routing can select safe and performant candidates

  Background:
    Given the registry bridge has specialist listings

  @B2.1 @route-unit @registry
  Scenario: Filter specialists by capability tags
    When a client requests GET /api/registry with tag "onboarding"
    Then only listings containing tag "onboarding" are returned
    And the behavior is covered by "lib/__tests__/registry-route.test.ts"

  @B2.2 @route-unit @registry
  Scenario: Filter specialists by attestation and health
    When a client requests GET /api/registry with attested=true and health=pass
    Then only attested and passing listings are returned
    And the behavior is covered by "lib/__tests__/registry-route.test.ts"

  @B2.3 @route-unit @registry
  Scenario: Sort specialists by ranking with deterministic tie-breakers
    When a client requests GET /api/registry with sortBy=ranking
    Then listings are ordered by ranking_score descending
    And ties are broken by most recent health.lastCheckedAt
    And remaining ties are broken by lowest perCallUsd
    And the behavior is covered by "lib/__tests__/registry-route.test.ts"

  @B2.default-order @route-unit @registry
  Scenario: Default bridge ordering stays stable without explicit sortBy
    When a client requests GET /api/registry without sortBy
    Then ordering follows attested first, then health, then feedback
    And the behavior is covered by "lib/__tests__/registry-bridge-sort.test.ts"
