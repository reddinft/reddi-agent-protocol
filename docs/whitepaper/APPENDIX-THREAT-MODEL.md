# Appendix A — Threat Model and Controls

_Status: Phase 5 hardening draft_

## Scope

This appendix maps practical threats in agent commerce to protocol controls and known residual risks.

## System boundary

- Off-chain agent execution endpoints
- Planner orchestration routes
- Settlement decision paths
- Reputation and attestation signals
- On-chain state transitions and escrow lifecycle

## Threat matrix

| Threat | Attack pattern | Primary controls | Residual risk |
|---|---|---|---|
| Non-payment after delivery | Consumer receives output and withholds payout | Escrow/settlement state machine, explicit release/dispute path | Collusion or dishonest dispute signaling still requires arbitration policy evolution |
| Payment without valid output | Specialist returns malformed/low-quality response after payment | Attestation gate, quality signaling, refund/dispute path | Attestor quality variance can cause false positives/negatives |
| Replay of payment proof | Reuse of old payment header/receipt | Nonce-bound challenge/receipt semantics, challenge parsing checks | Misconfigured endpoint nonce persistence could weaken replay defense |
| Attestation gaming | Friendly attestor passes bad output | Attestor selection scoring, agreement/disagreement telemetry, dispute path | Stronger cryptographic attestor signatures are still roadmap |
| Reputation manipulation | Strategic rating behavior or retaliatory scoring | Commit-reveal pattern, rolling score model, multiple feedback signals | Sparse sample sizes early in lifecycle remain noisy |
| Endpoint impersonation | Fake specialist endpoint presented in discovery | Registry + profile linkage + health check status | Off-chain DNS/TLS trust still external to protocol |
| DoS on specialist endpoint | Flood requests to degrade service | Health checks + routing fallback to alternatives | No built-in rate-limiting standard enforced protocol-wide yet |
| Config drift / broken route links | UI exposes paths not deployed on main | BDD route coverage + PR discipline + hotfix workflow | Human process error remains possible without automated deploy guards |

## Existing controls in code/docs

- Planner execution and settlement guards: `lib/onboarding/planner-execution.ts`, `lib/onboarding/planner-settlement.ts`
- Attestor selection/routing: `lib/onboarding/attestor-resolver.ts`
- Dogfood failure harness and attestor gate: `app/api/dogfood/*`, `lib/dogfood/*`
- BDD behavior coverage map: `docs/bdd/FEATURE-INDEX.md`

## Prioritized hardening roadmap

1. **Attestor signed verdict binding**
   - Sign `(runId, outputHash, verdict)` and verify before settlement finalization.
2. **Output commit-reveal for specialists**
   - Pre-commit output hash before reveal and attestation.
3. **Dispute windows and penalties**
   - Time-bounded challenge periods with explicit penalty policies.
4. **Route-deploy guardrails**
   - CI/deploy checks to block nav links to undeployed pages.

## Practical guidance

- Treat attestation as a weighted trust signal, not absolute truth.
- Keep clear UX separation between `released`, `refunded`, and `disputed` outcomes.
- Use evidence hashes and run IDs in all operator workflows and support playbooks.
