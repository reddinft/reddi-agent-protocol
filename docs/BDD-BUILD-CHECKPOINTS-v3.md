# Colosseum Frontier — BDD Buckets, Use Cases, Scenarios, Checkpoints (v3)

_Last updated: 2026-04-18 AEST_

Purpose: keep design and build synchronized across many moving parts by tracking each workstream as BDD buckets -> use cases -> executable scenarios.

---

## Bucket A — Specialist Onboarding (Provider Path)

### Use Case A1: Zero-to-live onboarding for non-crypto user
- Scenario A1.1: Consent denied blocks endpoint exposure + registration
- Scenario A1.2: Runtime bootstrap succeeds (Ollama ready, CORS configured)
- Scenario A1.3: Token-gated proxy + tunnel setup succeeds
- Scenario A1.4: Wallet existing path completes
- Scenario A1.5: Wallet bootstrap path enforces encrypted key + backup checkpoint
- Scenario A1.6: Sponsorship cap enforced (rent + registration only)
- Scenario A1.7: Register agent tx preflight simulation shown before signing
- Scenario A1.8: Register agent tx succeeds on-chain

Checkpoint status:
- A1.1-A1.7: ✅ implemented
- A1.8: ✅ implemented (wallet + devnet path)

### Use Case A2: Health and attestation gates
- Scenario A2.1: Healthcheck fails -> onboarding degraded + blocked attestation
- Scenario A2.2: Healthcheck passes with runtime + x402 public probe
- Scenario A2.3: On-chain `attest_quality` submit succeeds
- Scenario A2.4: Audit trail is persisted
- Scenario A2.5: Missing operator signer env fails explicitly

Checkpoint status:
- A2.1-A2.5: ✅ implemented
- A2.6 follow-through confirm/dispute flow: ✅ implemented (consumer-signing path in onboarding step 7)

---

## Bucket B — Specialist Discovery + Capability Index

### Use Case B1: Register discoverable specialist metadata
- Scenario B1.1: Capability schema validates (task types, input/output modes, pricing, privacy modes)
- Scenario B1.2: Specialist profile linked to on-chain identity
- Scenario B1.3: Invalid schema rejected with actionable errors

### Use Case B2: Marketplace filtering and ranking
- Scenario B2.1: Filter by capability tags
- Scenario B2.2: Filter by attestation + health state
- Scenario B2.3: Sort by fit/reputation/cost/latency

Checkpoint status:
- B1.1-B1.3: 🟡 capability schema + onboarding API/UI capture shipped; specialist identity index baseline linkage + listing endpoint shipped, deeper planner index semantics pending
- B2: ⏳ not built (next major build)

---

## Bucket C — Planner-Native Specialist Consumption (Consumer Path)

### Use Case C1: Planner resolves specialist candidates during task planning
- Scenario C1.1: Planner policy includes budget/min-rep/privacy requirements
- Scenario C1.2: Discovery returns candidate set
- Scenario C1.3: Router selects candidate deterministically with policy reasons

### Use Case C2: Planner executes paid specialist call
- Scenario C2.1: x402 challenge-retry-payment loop succeeds
- Scenario C2.2: Escrow/payment fallback path handles private rail failure safely
- Scenario C2.3: Receipt + trace captured for audit

### Use Case C3: Post-call feedback loop
- Scenario C3.1: Quality feedback captured and linked to call
- Scenario C3.2: Feedback contributes to routing signal/reputation update

### Use Case C4: Reputation event observability
- Scenario C4.1: REPUTATION_EVENT mint log emitted after on-chain commit_rating succeeds
- Scenario C4.2: REPUTATION_EVENT reveal log emitted after reveal_rating succeeds
- Scenario C4.3: Log includes job_id, specialist wallet, score, tx signature

Checkpoint status:
- C1.1-C1.3: 🟡 planner policy + deterministic candidate selection stub shipped (`/api/onboarding/planner`)
- C2: ✅ x402 real settlement path wired (`lib/onboarding/x402-settlement.ts`) — `parseX402Header` + `sendPayment` receipt replay on 402 retry; tx signature + nonce captured in run record
- C3: ✅ On-chain reputation commit wired (`lib/onboarding/reputation-signal.ts`) — `commit_rating` ix submitted to devnet on feedback score ≥3 on completed runs; rating PDA + commit hash stored in feedback record
- C4.1-C4.3: ✅ implemented (`lib/onboarding/reputation-signal.ts`)

---

## Bucket D — x402 + Endpoint Security Compatibility

### Use Case D1: Preserve 402-first payment handshake while hardening endpoint
- Scenario D1.1: x402 public paths (`/v1/*`, `/x402/*`, `/healthz`) bypass token gate
- Scenario D1.2: Non-public/control paths require token
- Scenario D1.3: Misconfigured global token gate is detected by healthcheck probe

Checkpoint status:
- D1.1-D1.3: ✅ implemented

---

## Bucket E — Operational Reliability and Recovery

### Use Case E1: Endpoint lifecycle resilience
- Scenario E1.1: Tunnel/proxy failure marks specialist offline
- Scenario E1.2: Quick-fix commands are surfaced in UI
- Scenario E1.3: Heartbeat restore flips specialist back online

### Use Case E2: Key and operator reliability
- Scenario E2.1: Missing operator env returns clear recovery instructions
- Scenario E2.2: Attestation operator rotation procedure documented/tested

### Use Case E3: Configurable RPC endpoint
- Scenario E3.1: NEXT_PUBLIC_RPC_ENDPOINT env var overrides default devnet RPC
- Scenario E3.2: Falls back to https://api.devnet.solana.com when env var not set
- Scenario E3.3: RPC endpoint used consistently across program.ts and demo agents

Checkpoint status:
- E1.1-E1.3: ✅ implemented baseline
- E2.1: ✅ implemented
- E2.2: 🔜 pending runbook hardening
- E3.1-E3.3: ✅ implemented (`lib/program.ts` uses `NEXT_PUBLIC_RPC_ENDPOINT ?? default`)

---

## Bucket F — Cross-Token Settlement (Jupiter Swap V2)

### Use Case F1: Auto-swap on token mismatch
- Scenario F1.1: needsAutoSwap returns true when payerCurrency ≠ currency and autoSwap=true
- Scenario F1.2: sendPayment executes Jupiter swap when swapClient provided + mismatch detected
- Scenario F1.3: sendPayment fails fast with token_mismatch_requires_swap_client when no client
- Scenario F1.4: Swap receipt is included in PaymentReceipt (orderId, executeId, performed=true)
- Scenario F1.5: getJupiterClient() returns null when JUPITER_API_KEY is not set
- Scenario F1.6: getJupiterClient() returns singleton when JUPITER_API_KEY is set
- Scenario F1.7: Planner invoke route passes swapClient to executePlannerSpecialistCall

Checkpoint status:
- F1.1-F1.4: ✅ implemented (payment.test.ts)
- F1.5-F1.6: ✅ implemented (jupiter-client.test.ts — see Part 2)
- F1.7: ✅ implemented (app/api/planner/tools/invoke/route.ts)

---

## Build Order (Checkpointed)

1. ✅ Phase A slice 1: registration preflight simulation + signing summary
2. ✅ Phase A slice 2: on-chain attestation submission path
3. ✅ Phase A slice 3: scoped token-gated endpoint hardening preserving x402
4. 🟡 Phase A slice 4: confirm/dispute attestation follow-through shipped; operator key provisioning UX still pending
5. 🔜 Phase B: capability schema + index + marketplace ranking filters
6. 🔜 Phase C: planner-native specialist composition pipeline

---

## Immediate Next 3 Execution Tasks

1. Harden operator key provisioning/recovery UX for onboarding attestor.
2. Harden specialist identity index semantics for planner use (ranking signals + freshness policy).
3. ✅ C4: `reveal_rating` fully wired (`lib/onboarding/reputation-signal.ts`) — commit hash/salt persisted in `data/onboarding/rating-commits.json`; `POST /api/onboarding/planner/reveal` triggers reveal with correct Rust layout.
4. ✅ C5: Consumer planner UI added as onboarding Step 8 — prompt entry, specialist call execution with x402 tx display, 1-10 feedback + on-chain reputation commit result shown inline.
5. ✅ E2E: 18 Playwright tests covering all 8 onboarding steps (UI gates, nav, step 8 planner idle/disabled/enabled/feedback), all planner API routes (execute, feedback, reveal, capabilities), and correct error shapes.

## Bucket G — Torque Protocol Retention Layer

### Use Case G1: Event emission
- Scenario G1.1: isTorqueEnabled returns true when TORQUE_API_TOKEN is set
- Scenario G1.2: isTorqueEnabled returns false when token not set
- Scenario G1.3: emitTorqueEvent sends correctly-shaped POST with Authorization header
- Scenario G1.4: emitTorqueEvent is a no-op (no throw) when token missing
- Scenario G1.5: emitTorqueEvent fails silently when API unreachable
- Scenario G1.6: SPECIALIST_JOB_COMPLETED emitted after release_escrow confirms
- Scenario G1.7: CONSUMER_QUERY_RUN emitted after planner invoke
- Scenario G1.8: RATING_SUBMITTED emitted after commit_rating succeeds

### Use Case G2: Leaderboard UI
- Scenario G2.1: getLeaderboard returns empty array when no token/campaign configured
- Scenario G2.2: getLeaderboard returns empty array on fetch failure
- Scenario G2.3: /leaderboard renders without server error
- Scenario G2.4: /leaderboard shows table or empty state
- Scenario G2.5: /leaderboard contains Torque attribution
- Scenario G2.6: /leaderboard does not expose raw API tokens

Checkpoint status:
- G1.1-G1.5: ✅ implemented (`lib/__tests__/torque-client.test.ts`)
- G1.6: ✅ implemented (wired in `lib/onboarding/x402-settlement.ts`)
- G1.7: ✅ implemented (wizard completion action emits `ONBOARDING_COMPLETED` via `lib/onboarding/torque-onboarding.ts`; payload/route covered by `lib/__tests__/torque-onboarding-event.test.ts` + `lib/__tests__/torque-event-route.test.ts`)
- G1.8: ✅ implemented (wired in `lib/onboarding/reputation-signal.ts`)
- G2.1-G2.2: ✅ implemented (`lib/__tests__/torque-client.test.ts`, `lib/__tests__/torque-leaderboard-route.test.ts`)
- G2.3-G2.6: ✅ implemented (`e2e/leaderboard.spec.ts`)
- API route validation: ✅ implemented (`lib/__tests__/torque-event-route.test.ts`)
