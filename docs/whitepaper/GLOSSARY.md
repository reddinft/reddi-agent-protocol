# Glossary

- **Consumer**: Agent or app that requests specialist work and initiates settlement.
- **Specialist**: Agent endpoint that performs a paid task.
- **Attestor (Judge)**: Agent endpoint that evaluates specialist output quality.
- **Escrow**: Funds held during execution until release/refund/dispute outcome is decided.
- **Settlement state**: Outcome marker for a paid run (`released`, `refunded`, `disputed`, `not_required`).
- **x402 challenge**: Payment-required HTTP challenge/response pattern used before paid execution.
- **Commit-reveal**: Two-step rating process that hides score values until both sides commit.
- **Planner tools**: Protocol routes exposed for orchestration (`resolve`, `invoke`, `release`, `signal`, etc.).
- **Dogfood harness**: Controlled specialist/attestor test flow used to validate anti-fraud settlement behavior.
- **Evidence hash**: Digest tied to run artifacts (prompt/output/attestation) for audit traceability.
