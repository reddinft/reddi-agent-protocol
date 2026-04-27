# Consumer Orchestrator Plumbing Plan (v1)

_Last updated: 2026-04-19 AEST_

## Goal
Enable external planner agents (consumer side) to onboard quickly and reliably into Reddi Agent Protocol specialist marketplace with a clear, testable lifecycle:

1. Register consumer identity
2. Select integration mode (MCP, Tools, Skills)
3. Resolve specialist + optional attestor
4. Invoke specialist with x402 flow
5. Evaluate output
6. Decide settlement (release/dispute)
7. Submit quality signal
8. Recalculate consumer reputation (baseline 3/5, rolling average as signals arrive)

## Low-Level Plumbing First (now)

### API tools
- `POST /api/planner/tools/register-consumer`
- `POST /api/planner/tools/resolve`
- `POST /api/planner/tools/resolve-attestor`
- `POST /api/planner/tools/invoke`
- `POST /api/planner/tools/release` (decision: release/dispute)
- `POST /api/planner/tools/signal`
- `GET /api/planner/tools` manifest for MCP/tool ingestion

### Data stores
- `data/onboarding/consumer-index.json` (consumer registry + consumer reputation profile)
- `data/onboarding/planner-runs.json` (run receipts + settlement state)
- `data/onboarding/planner-feedback.json` (quality signal history)

### Settlement state model
- `pending_evaluation`
- `released`
- `disputed`
- `not_required`

## BDD Layer (after plumbing)

### Bucket H — Consumer Orchestrator Lifecycle

Baseline reputation rule (decision lock): every newly registered consumer starts at **3.0 / 5.0**. Each submitted quality signal updates that consumer's rolling reputation average over time.

#### Use Case H1: Consumer registration + integration readiness
- H1.1 register-consumer accepts valid wallet + metadata
- H1.2 duplicate registration is idempotent update
- H1.3 invalid wallet is rejected
- H1.4 manifest endpoint includes all consumer-facing tools

#### Use Case H2: Planner resolution path
- H2.1 resolve_specialist returns deterministic top candidate under policy
- H2.2 resolve_attestor returns attested candidate under accuracy/cost constraints
- H2.3 no-candidate path returns actionable error

#### Use Case H3: Invoke + settle loop
- H3.1 invoke_specialist on 402 path records payment receipt and run trace
- H3.2 successful paid run enters `pending_evaluation`
- H3.3 decide_settlement(release) updates run to `released`
- H3.4 decide_settlement(dispute) updates run to `disputed`
- H3.5 settlement decision rejected for unpaid runs

#### Use Case H4: Quality signal + routing feedback
- H4.1 quality score persists against runId
- H4.2 score ≥3 triggers reputation commit
- H4.3 rating and settlement states are independently auditable

## Integration Modes

### MCP mode
Use `GET /api/planner/tools` and register MCP tools directly with orchestrator runtime.

### Tools mode
Use OpenAI function schema payload from `MCP_TOOL_SCHEMAS` in `lib/mcp/tools.ts`.

### Skills mode
Provide prompt templates that enforce call sequence:
`register_consumer -> resolve_specialist -> resolve_attestor(optional) -> invoke_specialist -> release -> submit_quality_signal`.

## Solana/x402 guardrails
- Blockhash + `lastValidBlockHeight` based confirmation handling
- Retry-until-expiry pattern; re-sign after blockhash expiry
- Compute budget instructions (`SetComputeUnitLimit`, `SetComputeUnitPrice`) from simulation + margin
- Consumer wallet signs payment; no server custody of user key material
- Keep receipt nonce/idempotency surfaced in planner run logs

## Immediate next implementation slice
1. ✅ Add route-level Jest tests for new consumer tools.
2. ✅ Add e2e planner path for release/dispute UX (contract-level surface checks).
3. ✅ Wire planner UI to full consumer lifecycle toolchain (`register-consumer -> resolve -> invoke -> release -> signal`).
4. ✅ Add explicit `targetWallet` pin-through in invoke path (`invoke -> planner-execution preferredWallet`) for resolver-first deterministic routing.
5. 🔜 Wire free on-chain consumer registration transaction helper in UI.
6. 🔜 Add attestor role semantics (`attestor=true`) in capability profile for stronger filtering.

## Current execution micro-plan (2026-04-19)
- Phase U1: ✅ migrate `/planner` off legacy onboarding endpoints to `/api/planner/tools/*`.
- Phase U2: ✅ add explicit settlement decision controls (`release`/`dispute`) prior to rating submission.
- Phase U3: ✅ surface attestor resolution result in execution panel for transparency.
- Phase U4: ✅ expand Playwright BDD checks to cover planner UX contract assumptions.
- Phase U5: ✅ honor `targetWallet` in planner invoke execution path while enforcing policy eligibility.
