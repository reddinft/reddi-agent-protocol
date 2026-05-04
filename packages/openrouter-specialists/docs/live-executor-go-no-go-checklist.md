# OpenRouter Specialists Live Executor Go/No-Go Checklist

**Status:** Draft gate for Iteration 6 Loop 8
**Scope:** Preconditions for the first real downstream live executor implementation and smoke.
**Current implementation state:** no-op/fail-closed only. Real downstream execution remains blocked by `501 live_delegation_not_implemented` until a separate explicitly approved implementation PR lands.

## Non-negotiable boundary

This checklist is documentation only. It does **not** approve or implement real downstream execution.

Before any real downstream x402/OpenRouter/devnet executor code is written or run, all of the following must be true:

1. Nissan explicitly approves the live executor implementation loop.
2. The implementation is isolated behind the existing gates:
   - `ENABLE_AGENT_TO_AGENT_CALLS=true`
   - `ENABLE_LIVE_DELEGATION_EXECUTOR=true`
   - valid `budgetPolicy`
   - successful budget preflight
3. Oli reviews the implementation PR before merge.
4. First smoke is private and capped to exactly one downstream devnet/demo execution attempt.
5. Public tester access waits until the private smoke passes and a tester packet is published.

## Current proven guardrails

As of PR #172 / commit `53292c0a`, the repo proves:

- default live executor gate is disabled;
- enabled no-op smoke is local/mock only;
- valid enabled no-op path returns `501 live_delegation_not_implemented`;
- executor evidence remains `not_executed`;
- `downstreamCallsExecuted` remains `0`;
- budget-denied branches create no intent/audit/executor evidence;
- smoke artifact is public-data-only: `packages/openrouter-specialists/artifacts/live-noop-executor-smoke.json`.

## Go/no-go checklist for implementation PR

### Funding and spend caps

- [ ] Devnet-only funding source identified.
- [ ] Maximum downstream call count for first smoke is `1`.
- [ ] Maximum lamports for first smoke is explicitly configured and visible in test/report output.
- [ ] Budget denial paths remain covered by tests.
- [ ] Over-budget request cannot reach the executor.
- [ ] Remaining session/agent budget is included in evidence.

### Signer custody

- [ ] No private key is committed, logged, included in artifacts, or sent to external services.
- [ ] Signer source is documented and local/secret-managed only.
- [ ] Missing signer configuration fails closed before network calls.
- [ ] Signer public key / wallet address only is included in public artifacts.
- [ ] Oli verifies no secret material appears in diff or generated reports.

### Downstream endpoint allowlist

- [ ] First smoke targets only an explicitly allowlisted first-five specialist endpoint.
- [ ] Allowlist is static/configured; no arbitrary URL from request metadata can be called.
- [ ] Endpoint profile id, wallet, capabilities, and expected price are resolved from registry/manifest data, not user-provided free text.
- [ ] Endpoint mismatch fails closed before payment/signing.

### Receipt and replay safety

- [ ] Downstream x402 challenge is parsed and validated before any payment attempt.
- [ ] Receipt/challenge nonce is recorded in local evidence.
- [ ] Replay store rejects duplicate demo/devnet receipt nonces.
- [ ] Failed receipt verification returns structured failure evidence.
- [ ] No receipt contains private key or signer material.

### Attestor and result review

- [ ] Required attestor remains `verification-validation-agent` for the first smoke.
- [ ] First smoke records whether attestation was skipped, pending, or completed.
- [ ] Public tester packet explains that attestation/release semantics are experimental until explicitly marked ready.

### Telemetry and audit evidence

- [ ] Intent plan remains deterministic and includes `intentId`.
- [ ] Audit envelope remains deterministic and hashed.
- [ ] Executor evidence records exactly one attempted downstream call, or zero on failure before call.
- [ ] Evidence includes pass/fail status, status codes, and bounded public receipt metadata.
- [ ] Evidence excludes prompts containing private data.
- [ ] Evidence excludes API keys, private keys, raw secrets, and full payment payloads if sensitive.

### Rollback

- [ ] Turning off `ENABLE_LIVE_DELEGATION_EXECUTOR` returns system to no-op/disabled behavior.
- [ ] Turning off `ENABLE_AGENT_TO_AGENT_CALLS` returns `403 live_delegation_disabled`.
- [ ] Smoke script exits non-zero on any guardrail breach.
- [ ] Coolify/env rollback steps are documented before public tester access.

## First private devnet smoke pass/fail criteria

The first private smoke passes only if all of these are true:

- [ ] Request is devnet/demo only.
- [ ] Request uses a known first-five consumer profile.
- [ ] Request uses a known first-five downstream specialist profile.
- [ ] Budget preflight allows exactly one downstream call.
- [ ] No over-budget request reaches the executor.
- [ ] Exactly one downstream execution attempt is made.
- [ ] `downstreamCallsExecuted` is `1` only if the downstream call is actually attempted.
- [ ] Success evidence contains bounded public receipt/challenge metadata.
- [ ] Failure evidence is structured and does not leak secrets.
- [ ] Duplicate/replayed receipt path fails closed.
- [ ] Post-smoke package tests still pass.
- [ ] Oli reviews the smoke artifact before public tester access.

The first private smoke fails if any of these happen:

- [ ] Any mainnet endpoint/network is used.
- [ ] Any non-allowlisted endpoint is called.
- [ ] Any private key, API key, or secret appears in logs/artifacts.
- [ ] More than one downstream call is attempted.
- [ ] Over-budget input invokes the executor.
- [ ] `downstreamCallsExecuted` is inconsistent with actual attempt count.
- [ ] Receipt/challenge validation is skipped or ambiguous.
- [ ] Rollback env gates do not restore disabled/no-op behavior.

## External tester readiness checklist

Public/third-party testers can be invited only after:

- [ ] Private devnet smoke passes.
- [ ] Smoke artifact is committed or published with secrets redacted.
- [ ] Tester packet includes endpoint URL(s), expected request shape, devnet-only warning, max spend/call limits, and expected success/failure responses.
- [ ] Tester packet includes known error codes:
  - `402 payment_required`
  - `403 live_delegation_disabled`
  - `403 request_budget_exceeded`
  - `501 live_delegation_not_implemented` until real executor ships
- [ ] Tester packet explains funding requirements and faucet/devnet setup if needed.
- [ ] Public endpoints are rate-limited or manually monitored.
- [ ] Rollback switch is documented and tested.
- [ ] Nissan approves inviting external testers.

## Estimated timeline after this checklist merges

Assuming no dependency or hosted-env surprises:

- **Loop 9 implementation PR for minimal real executor:** ~45–90 minutes.
- **Oli review + CI + merge:** ~30–60 minutes.
- **First private devnet smoke:** ~15–30 minutes.
- **Tester packet + public instructions:** ~30–60 minutes.

So the earliest realistic private devnet confirmation is about **1–2 hours after explicit approval for Loop 9**, and broader external tester readiness is about **2–4 hours** after that approval.

## Do not proceed without separate approval

A real executor implementation is a new high-risk step because it can introduce network calls, signing, and spend. This checklist must be merged first, then Nissan must explicitly approve the next implementation loop before code does any real downstream x402/OpenRouter/devnet execution.
