# Torque Integration — Friction Log

Date: 2026-04-18 (AEST)
Project: Reddi Agent Protocol

## Time to first successful custom event schema

- ~23 minutes from landing on `platform.torque.so` to first successful custom event schema creation.
- Breakdown:
  - 6 min account + token flow
  - 7 min MCP setup + auth checks
  - 10 min schema retries (field typing and project context)

## What was confusing in MCP quickstart

- Quickstart mixes setup patterns (CLI env var vs runtime auth tool) without strongly recommending one default path.
- It is not obvious when auth state is cached vs session-scoped, which made first-run failures look like tool issues.
- "Select active project" is documented, but it is easy to miss before trying create operations.

## What `create_idl` / IDL tracking docs were missing

- Clear warning about IDL `address` mismatch with deployed program address in Quasar workflows.
- A concrete end-to-end example with:
  - parse_idl
  - create_idl with `programAddress` override
  - create instruction tracking
  - generate query using that instruction
- Better guidance on instruction field limits and what happens when account/field names differ from expected conventions.

## Quasar vs Anchor program address mismatch

- Yes, it was a blocker until `programAddress` override was used.
- The local IDL address did not match deployed devnet program address.
- Using `programAddress` override during `create_idl` unblocked tracking immediately.

## Missing incentive query-builder tooling for agent-native protocols

- Missing templates for common agent patterns:
  - paid inference/session completion counts
  - escrow release + dispute-adjusted outcomes
  - commit/reveal reputation events with per-role weighting
- Missing guardrails for wallet-role disambiguation (consumer vs specialist) in generated queries.
- Missing first-class helper for mixed on-chain + custom event funnels (planner invoke -> settlement -> rating).

## What I would change about the platform

1. Add a single "happy path" guided flow in MCP: auth -> select project -> create event -> ingest sample -> verify query-ready.
2. Add explicit diagnostics for common setup failures (inactive project, stale auth token, empty ingestion).
3. Add an IDL upload wizard that detects address mismatch and suggests `programAddress` override.
4. Add prebuilt incentive recipes for Solana agent protocols (leaderboard, rebate, reputation).
5. Add a lightweight "integration health" endpoint/checklist to validate end-to-end readiness before launch.
