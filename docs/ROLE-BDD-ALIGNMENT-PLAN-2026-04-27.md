# Reddi Agent Protocol — Role/Bucket BDD Alignment Plan

_Last updated: 2026-04-27 AEST_

## Purpose

Align the product around four first-class roles and turn the current infrastructure into a small, repeatable BDD build loop:

1. **Specialist** — paid agent/API provider.
2. **Attestor** — quality/verifier role that validates work and enables release/refund/reputation.
3. **Consumer** — buyer/orchestrator that discovers, pays, invokes, and rates specialists.
4. **Agent Manager** — human operator/admin who enables each role to register, configure, verify, recover, and use the system safely.

This plan uses the existing BDD gap-closure loop: review gaps -> implement one slice -> verify explicitly -> update docs/status/memory -> commit one scoped iteration.

## Current infrastructure inventory

### Existing buckets and strongest ownership

| Bucket | Current name | Primary role | Current state |
|---|---|---|---|
| A | Specialist Onboarding | Specialist + Agent Manager | Strongest end-to-end coverage: wizard, runtime, endpoint, wallet, healthcheck, attestation, preflight, registration. |
| B | Discovery + Capability Index | Specialist + Consumer + Agent Manager | Registry/filter/ranking exists; needs role-based UX clarity and manager-facing moderation/readiness views. |
| C | Planner-Native Specialist Consumption | Consumer | Resolve/invoke/payment/feedback path exists; needs clearer consumer journey and fail-closed unpaid-completion story as product UX. |
| D | x402 + Endpoint Security | Specialist + Agent Manager | Strong technical coverage; should be surfaced as a role-visible compliance gate. |
| E | Operational Reliability | Agent Manager + Specialist | Health/recovery/RPC/operator checks exist; should become explicit manager console workflows. |
| F | Cross-Token Settlement | Consumer + Specialist | Jupiter/Solana settlement rails exist; should be described as consumer payment flexibility, not a separate user role. |
| G | Torque Retention | Marketplace/Agent Manager | Retention/leaderboard telemetry exists; keep as supporting growth/analytics layer. |
| H | Consumer Orchestrator Lifecycle | Consumer + Attestor | Good API/lifecycle coverage; dogfood proves specialist+attestor gated release/refund. |

### Existing product surfaces

- Specialist: `/onboarding`, `/register`, `/specialist`, `/setup`, `/dashboard`.
- Attestor: `/attestation`, attestation submit/reveal/audit APIs, dogfood testing attestor.
- Consumer: `/consumer`, `/planner`, `/dogfood`, planner tools routes.
- Agent Manager: currently implicit across onboarding/setup/dashboard/admin-ish diagnostics. Needs explicit role treatment.

## Product role model

### 1. Specialist

**Job-to-be-done:** “I want to expose my agent/API as a paid, discoverable, x402-protected service without leaking prompts or serving unpaid completions.”

Specialist owns:

- Runtime readiness.
- Endpoint exposure.
- x402 protection.
- Wallet/payee setup.
- Capabilities/pricing/privacy claims.
- Registration.
- Health and earnings/reputation monitoring.

### 2. Attestor

**Job-to-be-done:** “I want to verify whether a specialist completed the task correctly, publish/verifiably record quality evidence, and trigger release/refund/reputation outcomes.”

Attestor owns:

- Attestor registration/profile.
- Accepted verification tasks.
- Test/checkpoint definitions.
- Attestation submission.
- Reveal/quality event audit.
- Dispute/refund evidence.

### 3. Consumer

**Job-to-be-done:** “I want to find a suitable specialist, pay safely on Solana, receive an answer, and have quality/reputation/escrow protections if the answer fails.”

Consumer owns:

- Consumer registration/profile.
- Search/resolve policy.
- Payment/signing budget.
- Invocation and x402 retry.
- Settlement decision or attestor-gated settlement.
- Feedback/reputation signal.
- Receipt/audit history.

### 4. Agent Manager Human

**Job-to-be-done:** “I want to operate the marketplace safely: help roles register, verify endpoints and wallets, recover broken infrastructure, and keep the Solana marketplace trustworthy.”

Agent Manager owns:

- Role selection and setup progress.
- Network/profile/RPC/program configuration.
- Endpoint policy checks.
- Operator key readiness/rotation.
- Health monitoring and remediation.
- Marketplace compliance review.
- Demo/readiness evidence generation.

This is the missing product role. It should not be hidden inside Specialist onboarding; it is the human operational layer that makes all three agent roles usable.

## Proposed bucket model v4

Keep existing A-H buckets for continuity, but add explicit role tags and introduce **Bucket I — Agent Manager Operations**.

| Bucket | Name | Role alignment | Product question |
|---|---|---|---|
| A | Specialist Onboarding | Specialist, Agent Manager | Can a specialist become safely live? |
| B | Marketplace Discovery + Capability Index | Specialist, Consumer, Agent Manager | Can the marketplace represent and find the right agent? |
| C | Consumer Planner + Paid Specialist Call | Consumer | Can a consumer pay and invoke a specialist safely? |
| D | x402 Endpoint Security + Privacy Rails | Specialist, Consumer, Agent Manager | Can we prove no unpaid/open completion path exists? |
| E | Reliability + Recovery | Specialist, Agent Manager | Can broken endpoints/keys/RPCs be diagnosed and repaired? |
| F | Solana Settlement + Token Flexibility | Consumer, Specialist | Can Solana payment/escrow/swap paths settle correctly? |
| G | Retention + Reputation Events | All roles, Agent Manager | Can usage/reputation events be tracked without leaking secrets? |
| H | Consumer-Orchestrator + Attestor Lifecycle | Consumer, Attestor | Can consumer work be released/refunded based on attestation? |
| I | Agent Manager Operations | Agent Manager | Can a human operate, verify, and support the marketplace end-to-end? |

## Role -> bucket -> use case matrix

### Specialist coverage

| Use case | Bucket(s) | Current evidence | Next alignment work |
|---|---|---|---|
| S1. Register as a paid specialist | A, B | Onboarding/register/capabilities routes, registry tests | Convert into a role-specific Specialist happy path feature slice. |
| S2. Protect completion endpoint with x402 | D | register probe, healthcheck, endpoint proxy, strict fail-closed tests | Make x402 compliance status prominent in Specialist dashboard. |
| S3. Declare capabilities/pricing/privacy | B | capability route + registry | Add role copy: what claims mean, what marketplace verifies. |
| S4. Receive paid call and produce answer | C, F, H | planner invoke/x402 settlement/dogfood | Add specialist-side receipt/earnings/audit panel. |
| S5. Monitor health/reputation/earnings | E, G | `/specialist`, registry signals, Torque events | Tighten dashboard into “Am I live? Can consumers pay me?” checklist. |

### Attestor coverage

| Use case | Bucket(s) | Current evidence | Next alignment work |
|---|---|---|---|
| T1. Register/identify as attestor | B, H, I | resolve-attestor route, attestation dashboard | Add explicit attestor onboarding/profile path. |
| T2. Define/advertise verification capability | B, H | dogfood attestor fixture, disclosure checkpoints | Add attestor capability schema + marketplace card. |
| T3. Verify specialist output | H | dogfood ping+haiku attestor route/tests | Generalize from dogfood to reusable attestation scenario model. |
| T4. Submit attest/reveal/quality proof | A, H, G | attestation API, reveal route, reputation events | Make attestor work queue + audit proof visible. |
| T5. Gate release/refund/reputation | H, F | dogfood release/refund tests | Add “attestor pass releases escrow, fail refunds/disputes” product UX. |

### Consumer coverage

| Use case | Bucket(s) | Current evidence | Next alignment work |
|---|---|---|---|
| Cn1. Register consumer profile | H | register-consumer route/tests, `/consumer` | Surface profile creation in consumer UI instead of API-only. |
| Cn2. Search/resolve specialist | B, C, H | registry/resolve tests | Role-based marketplace search flow with policy reasons. |
| Cn3. Pay via x402/Solana | C, F | planner invoke, x402 settlement, Jupiter lane | Make receipt/signature and max-spend policy obvious in UI. |
| Cn4. Run attestor-gated task | H | dogfood flow + UI | Promote dogfood into canonical consumer demo flow. |
| Cn5. Submit feedback/reputation | C, G, H | signal/reputation tests | Add consumer-facing feedback completion and audit history. |

### Agent Manager coverage

| Use case | Bucket(s) | Current evidence | Next alignment work |
|---|---|---|---|
| M1. Choose/manage role setup | I, A, H | onboarding/setup/dashboard fragments | New role hub: Specialist / Attestor / Consumer / Manager. |
| M2. Verify endpoint compliance | I, D, E | probe/healthcheck/preflight tests | Manager console with x402 pass/fail, insecure-open detection, remediation. |
| M3. Verify Solana/network readiness | I, E, F | network profiles, preflight, readiness scripts | Manager readiness panel: RPC, program id, wallet balances, operator key. |
| M4. Recover broken role | I, E | operator status/recovery, endpoint reliability | Per-role recovery runbooks surfaced in UI. |
| M5. Produce evidence pack | I, all | BDD sweep/status/artifacts | One-click “generate judge evidence” summary from latest artifacts. |

## BDD scenarios to cover next

### Bucket A — Specialist

- **A3.1 Specialist role hub starts onboarding:** Given a human chooses Specialist, when they open setup, then the system shows the exact steps to become callable: runtime -> endpoint -> x402 -> wallet -> capabilities -> register -> health.
- **A3.2 Specialist dashboard shows callable readiness:** Given a registered specialist, when dashboard loads, then it shows live endpoint, x402 compliance, attestation, registry listing, and latest paid-call evidence.
- **A3.3 Specialist blocks unsafe open endpoint:** Given an endpoint serves completion without x402, when probe runs, then onboarding and registration are blocked with remediation.

### Bucket B — Discovery

- **B3.1 Marketplace shows role-labelled listings:** Specialist and attestor listings must disclose role, capability, health, attestation, price, privacy mode, and verification status.
- **B3.2 Consumer filters by role and capability:** Consumer can filter specialists and attestors separately and see why candidates are eligible/rejected.
- **B3.3 Agent Manager sees compliance flags:** Manager can view insecure/offline/unattested entries and the required recovery action.

### Bucket C — Consumer paid call

- **C5.1 Consumer creates policy before invoke:** max price, privacy mode, attestation requirement, and network are visible before payment.
- **C5.2 Consumer x402 call refuses unpaid completion:** if specialist returns 200 without x402 first, consumer flow fails closed and no success event is emitted.
- **C5.3 Consumer receives receipt:** after successful paid retry, UI shows tx/nonce/specialist wallet/amount without storing raw prompt by default.

### Bucket D — x402/privacy rails

- **D2.1 Protected completion path must challenge first:** `/v1/chat/completions` returns 402 + `x402-request` before payment.
- **D2.2 Two concurrent calls are incognito:** each request has unique nonce/request ID and no Ollama context reuse.
- **D2.3 Logs are prompt-safe by default:** run records keep hashes/previews only and redact raw prompt unless explicitly enabled.

### Bucket E — Reliability

- **E4.1 Manager detects tunnel outage:** offline endpoint flips dashboard status and shows commands to recover.
- **E4.2 Manager detects operator key issue:** stale/missing/invalid operator key blocks attestation with exact fix.
- **E4.3 Manager checks network readiness:** local-surfpool/devnet/mainnet profile consistency is visible before live demo.

### Bucket F — Settlement

- **F2.1 Consumer pays in alternate token:** auto-swap path records swap metadata and settled receipt.
- **F2.2 Settlement failure refunds/disputes safely:** failed attestation or invalid output does not release escrow.
- **F2.3 Mainnet readiness blocks absent program:** mainnet readiness gate fails explicitly until program executable exists.

### Bucket G — Reputation/retention

- **G3.1 Role events are emitted with no secrets:** onboarding, paid call, attestation, release/refund, rating events contain IDs/amounts but no raw prompts/API keys.
- **G3.2 Reputation updates are role-specific:** specialist quality, attestor reliability, consumer feedback history are separated.

### Bucket H — Consumer + attestor lifecycle

- **H6.1 Consumer selects attestor-gated execution:** consumer chooses “require attestor” before invoke.
- **H6.2 Attestor validates output and gates settlement:** pass releases; fail refunds/disputes.
- **H6.3 Audit trail links consumer run, specialist output hash, attestor decision, and settlement tx.**

### Bucket I — Agent Manager Operations

- **I1.1 Role launchpad routes humans correctly:** Manager can start Specialist, Attestor, or Consumer setup from one page.
- **I1.2 Manager readiness board summarizes all roles:** counts live specialists, available attestors, registered consumers, insecure endpoints, pending attestations, and failed healthchecks.
- **I1.3 Manager can run BDD confidence sweep/status:** UI or documented command surfaces latest `test:bdd:status` and artifact path.
- **I1.4 Manager can generate evidence pack:** latest role-critical artifacts are summarized for judging/demo.
- **I1.5 Manager sees next blocking action:** if any role is not usable, the board shows the next concrete fix.

## Proposed first iterative build cycle

### Iteration 0 — Lock the map

**Goal:** commit this role/bucket model as the new product alignment artifact.

- Add/update BDD scenario map with Bucket I and role tags.
- Add a role traceability matrix.
- Verify docs/index consistency.

**Gate:** `npm run test:bdd:index`.

### Iteration 1 — Agent Manager launchpad + readiness board

**Goal:** make the missing human operator role visible.

- Add `/manager` or expand `/dashboard` into a role launchpad.
- Cards: Specialist, Attestor, Consumer, System Readiness.
- Show counts/flags from existing APIs: registry, consumers, audit, planner runs, health/preflight.
- No new protocol logic yet; UI aggregation only.

**BDD:** I1.1, I1.2, I1.5.

**Gate:** route/unit tests for aggregation + Playwright smoke for launchpad.

### Iteration 2 — Specialist callable-readiness dashboard

**Goal:** answer “Can consumers pay and call me right now?”

- Add x402 compliance state to Specialist dashboard.
- Show endpoint health, attestation, capability listing, latest paid call receipt.
- Block/instruct when open completion detected.

**BDD:** A3.2, A3.3, D2.1.

**Gate:** specialist dashboard tests + existing register/healthcheck x402 tests.

### Iteration 3 — Consumer guided paid call

**Goal:** make consumer journey clear and safe.

- Consumer profile creation from UI.
- Resolve policy panel before invoke.
- Paid call receipt panel after x402 retry.
- Fail-closed unpaid-completion UX.

**BDD:** C5.1, C5.2, C5.3, Cn1.

**Gate:** planner route tests + Playwright `/consumer` or `/planner` smoke.

### Iteration 4 — Attestor role path

**Goal:** promote attestor from hidden route/fixture to first-class role.

- Attestor setup/profile/capability card.
- Attestor work/audit queue.
- Generalize dogfood verifier copy into role narrative.

**BDD:** T1-T5, H6.1-H6.3.

**Gate:** resolve-attestor + dogfood tests + attestation UI smoke.

### Iteration 5 — Judge evidence pack

**Goal:** let Agent Manager produce proof of the whole marketplace.

- Latest BDD sweep status.
- Links to Surfpool/Jupiter/onboarding artifacts.
- Role-critical status summary.
- No secrets/raw prompts.

**BDD:** I1.3, I1.4, G3.1.

**Gate:** `npm run test:bdd:sweep` + evidence page smoke.

## Immediate next action recommendation

Start with **Iteration 0 + Iteration 1**.

Why: the infrastructure mostly exists, but the product story is scattered by implementation surface. A Manager launchpad will make the three agent roles legible, expose current readiness gaps, and give every later slice a home.

## Acceptance bar for this product alignment phase

The product is aligned when a judge/user can answer these four questions from the UI and docs:

1. **Specialist:** “How do I become callable and prove I am x402-protected?”
2. **Attestor:** “How do I verify work and influence release/refund/reputation?”
3. **Consumer:** “How do I safely find, pay, invoke, and rate an agent?”
4. **Agent Manager:** “How do I operate and prove the marketplace is healthy?”
