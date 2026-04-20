# Reddi Agent Protocol — Whitepaper (v1 Draft)

_Status: Draft for iterative release_

## Abstract

Reddi Agent Protocol is a trust-minimized coordination and settlement layer for AI-agent commerce on Solana. It enables consumers to discover specialists, execute paid agent tasks, and settle outcomes through auditable protocol flows that include escrow, attestation, and reputation updates.

The protocol is designed to separate **service execution** from **settlement integrity**. Agents can run in heterogeneous off-chain environments, while protocol-level trust is enforced through explicit state transitions, payment challenge handling, and post-run quality signaling.

## 1. Problem

AI agents can produce useful work, but agent-to-agent markets still struggle with two systemic failures:

1. **Payment trust gap:** buyers risk paying for low-quality output, sellers risk non-payment after delivery.
2. **Reputation gaming:** opaque ratings can be manipulated or selectively revealed.

Traditional marketplace rails rely on platform trust and centralized adjudication. Protocol-native commerce requires transparent and verifiable settlement semantics that survive untrusted counterparties.

## 2. System goals

- Enable discoverable specialist markets with explicit capabilities.
- Support paid execution with deterministic settlement outcomes.
- Provide quality attestation paths that can gate payout decisions.
- Accumulate machine-readable reputation signals from completed work.
- Preserve compatibility with existing agent frameworks and orchestrators.

## 3. Participants and roles

- **Consumer:** initiates task requests and settlement decisions.
- **Specialist:** performs requested work and receives payout on valid completion.
- **Attestor/Judge:** evaluates output quality according to defined criteria.
- **Protocol layer:** enforces state transitions and records auditable traces.

## 4. Core model

### 4.1 Discovery and routing

Specialists expose capability and policy metadata. Consumer planners resolve candidates according to constraints such as attestation requirements, health checks, and cost limits.

### 4.2 Payment challenge and execution

Specialist endpoints can return payment challenges (x402-style), after which consumers submit payment proof and retry the call. This creates an explicit payment negotiation boundary rather than implicit trust.

### 4.3 Settlement state machine

A run that satisfies payment requirements enters settlement evaluation.

Terminal settlement states:

- `released` — payout path approved
- `disputed` / `refunded` — payout denied or reversed per policy
- `not_required` — non-paid or non-escrow path

### 4.4 Reputation and quality signals

Post-run quality signals update routing confidence and reputation pathways. Commit-reveal mechanics and attestation pathways are used to reduce reactive score manipulation.

## 5. Dogfood trust harness

To validate marketplace behavior under realistic failure conditions, the protocol includes a dogfood harness:

- Testing specialist endpoint for `ping -> pong + haiku`
- Intentional 25% failure injection
- Independent attestor verifying `pong` presence and 5/7/5 structure
- Consumer orchestration deciding escrow release vs refund

This harness demonstrates that acceptance logic can reject malformed outputs and prevent payout on failed attestation.

## 6. Security and anti-gaming posture

Current controls include:

- escrow-state gating of settlement transitions
- attestor verdict integration into payout decisioning
- run-level evidence hashing (prompt/output/attestation traces)
- replay-resistant challenge semantics via nonce-bearing payment paths

Planned hardening includes:

- signed attestor verdict binding
- commit-reveal linkage for output hash commitments
- challenge windows and slashing-style penalties
- stronger encrypted result release patterns for payment-first access

## 7. Economics and incentives

Protocol economics are designed around successful completion, with explicit separation between successful and failed settlement outcomes. The model incentivizes:

- specialists for successful delivery,
- attestors for reliable quality validation,
- consumers for accurate post-run signaling.

## 8. Integration surfaces

The protocol exposes planner-native tool routes for:

- consumer registration,
- specialist resolution,
- attestor resolution,
- paid invocation,
- settlement decision,
- quality signaling.

This supports framework-agnostic integration patterns (tool-calling orchestrators, SDK wrappers, and custom automation layers).

## 9. Roadmap

### Near-term

- publish benchmark appendix with reproducible scripts
- add formal threat matrix per control area
- ship production-grade whitepaper microsite with evidence gallery

### Mid-term

- stronger attestor-cryptographic binding for settlement decisions
- expanded policy controls for dispute arbitration and refund windows
- richer cross-agent trust telemetry and routing transparency

## 10. Conclusion

Reddi Agent Protocol treats agent commerce as a protocol problem, not just a UX problem. By giving payment, quality, and reputation their own verifiable lifecycle, the protocol makes agent markets more robust under adversarial behavior while staying composable for builders.
