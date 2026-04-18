# SECURITY.md

## Reddi Agent Protocol Security Overview (Adevar Labs audit credits submission)

This document summarizes the current threat model and security posture for the Reddi Agent Protocol prior to a full pre-mainnet audit.

## Deployed Program Addresses (Solana devnet)

- Escrow Program: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- Registry Program: `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Reputation Program: `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`
- Attestation Program: `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`

## Threat Model

### 1) Escrow re-entrancy and multi-step release safety

- Solana CPI execution model avoids EVM-style fallback re-entrancy, but escrow logic is still guarded by strict state-machine transitions.
- Release and cancel paths require expected escrow status and signer checks before token movement.
- State is updated atomically within instruction execution, reducing partial-write and re-entry style abuse.

### 2) Replay attack protection (nonce + PDA uniqueness)

- x402 and settlement flows use nonces, and request identity is bound to unique PDA derivations.
- Replayed payloads fail because nonce/PDA combinations are consumed or already initialized.
- Payment verification enforces one-time semantics for challenge-response settlement attempts.

### 3) Double-release prevention

- Escrow accounts have terminal states.
- A successful release marks escrow complete, and subsequent release instructions fail due to state mismatch.
- Idempotency is enforced by account state transition rules, not client trust.

### 4) Unauthorized release prevention (has_one constraints)

- Anchor `has_one` / account relationship constraints tie escrow accounts to expected authority, payer, and recipient.
- Mismatched account graphs or signer substitution attempts fail account validation before business logic executes.

### 5) Cancel-window enforcement

- Cancel actions are bounded by explicit time and state constraints.
- Cancels outside allowed windows fail at program-level checks.
- This blocks griefing where one party attempts late cancellation after service delivery.

## PER (TEE) Privacy Guarantees and L1 Fallback

- Private Ephemeral Rollup (PER) mode executes settlement in a TEE-backed environment to reduce data exposure and metadata leakage.
- If TEE/PER availability degrades, protocol supports L1 fallback so settlement guarantees remain live.
- Security model: confidentiality improves in PER mode; integrity remains anchored by on-chain verification and fallback paths.

## x402 Payment Verification Security

### Trusted path

- Verifier and settlement middleware are controlled by protocol services.
- Nonce issuance, signature checks, and payment proofs are validated before releasing compute access.

### Untrusted path assumptions

- Third-party relays/verifiers are treated as potentially adversarial.
- On-chain escrow constraints remain final source of truth.
- Clients should treat off-chain 402 responses as hints until chain-confirmed.

### Nonce collision handling

- Nonces are expected to be high-entropy and single-use.
- Collision or reuse attempts are rejected by replay guards and PDA uniqueness assumptions.

## Blind Commit-Reveal Rating Security Properties

- Ratings are committed as hash commitments first, then revealed later with salt.
- This mitigates front-running and score-copying during the commit phase.
- Delayed reveal reduces strategic retaliation and vote-manipulation pressure.
- Expiry/penalty paths discourage selective non-reveal behavior.

## Attestation Judge Dispute Resolution Attack Surface

Key risks considered:

- Collusion between specialist and judge to inflate quality scores.
- Spam disputes to force reviewer exhaustion.
- Selective confirmation timing to bias outcomes.

Current mitigations:

- On-chain attestation records and dispute states are auditable.
- Reputation penalties and attestation-accuracy adjustments create economic disincentives for dishonest judging.
- Dispute paths are explicit state transitions, reducing ambiguous off-chain arbitration.

## Known Limitations (Current Phase)

- Devnet-only deployment today.
- Upgrade authority remains held by a development wallet.
- Broader adversarial testing and formal review are still pending.

## Audit Credit Use

Adevar Labs audit credits will be used to fund a pre-mainnet security review covering escrow invariants, replay resistance, access control constraints, attestation/dispute logic, and integration boundaries across x402 and PER paths.

## Responsible Disclosure

If you identify a security issue:

1. Do not publish exploit details publicly before coordinated remediation.
2. Report privately to the maintainers with reproduction steps, scope, and impact.
3. Allow reasonable remediation time before disclosure.

We will acknowledge valid reports, prioritize fixes by severity, and coordinate transparent postmortems once patched.
