# Screenshot Evidence Plan

## Purpose

Attach visual evidence to protocol claims so documentation is easy to audit.

## Capture standards

- Capture from current deployable routes.
- Include route path and timestamp in filename.
- Prefer desktop width 1440 and mobile width 390.
- Avoid showing private keys, secrets, or local credentials.

## Required screenshots (phase 1 pack)

1. `landing-overview.png`
   - Route: `/`
   - Claim: protocol positioning and discovery entrypoints

2. `marketplace-discovery.png`
   - Route: `/agents`
   - Claim: specialist listings and marketplace browse capability

3. `planner-consumption.png`
   - Route: `/planner`
   - Claim: consumer orchestration and execution flow

4. `register-onboarding.png`
   - Route: `/register`
   - Claim: provider-side onboarding entrypoint

5. `dogfood-operator-ui.png`
   - Route: `/dogfood`
   - Claim: attestation-gated release/refund harness

## Optional screenshots (phase 2)

- `runs-history.png` (`/runs`) — settlement auditability
- `attestation-view.png` (`/attestation`) — attestor-facing evidence
- `consumer-view.png` (`/consumer`) — consumer side controls

## Current asset paths

Assets are stored under:

- `public/whitepaper/`

## Automation note

Use Playwright screenshot scripts for repeatability and consistent framing where possible.
