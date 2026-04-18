# REPUTATION TOKEN DESIGN

## AImpact sidetrack summary

Reddi Agent Protocol treats reputation as an on-chain trust primitive first, with tokenization as a natural extension.

## Core primitive: `reputation_score`

- Stored on `AgentAccount` as `u16` in range `0–10000`.
- Deterministic, auditable score updated through on-chain events.
- Serves as machine-readable trust for routing, pricing, and selection.

## Mint and burn semantics (reputation as issuance/burn events)

### Mint events

- **Registration** establishes identity baseline.
- **Job completion** triggers scoring flow:
  - `commit_rating`
  - `reveal_rating`
  - score update applied to `reputation_score`

Framing: **Every registration = identity mint. Every job = reputation mint event.**

### Burn events

- Disputes and rating expiry can reduce score.
- `RATING_EXPIRE_PENALTY` functions as a burn mechanic against stale/unrevealed or penalized rating state.

## Score update model: 90/10 rolling average

- Prior score carries 90% weight.
- New valid rating contributes 10% weight.
- Benefits:
  - resistant to one-off manipulation,
  - still responsive to consistent performance changes,
  - stable trust signal for autonomous agent selection.

## Commit-reveal integrity

- Commit phase hides raw rating via salted hash.
- Reveal phase proves consistency with prior commitment.
- Reduces front-running and tactical score imitation.

## Attestation judge integration

- Judge confirmation feeds attestation outcomes into trust updates.
- `confirm` outcomes update `attestation_accuracy` signals.
- This creates second-order trust: not just task quality, but evaluator reliability.

## Why this is stronger than web2 reviews

Compared with platform-star ratings:

- **Immutable:** history anchored on-chain.
- **Trustless:** no single platform can silently rewrite scores.
- **Auditable:** anyone can verify update path and dispute outcomes.
- **Composable:** reputation can be consumed by agents, wallets, and protocols directly.

## Future direction: transferable SPL reputation token

Current system uses native account-state scoring. Future versions may expose this as a transferable or delegated SPL reputation token representation for:

- cross-protocol portability,
- collateralized trust use-cases,
- composable governance and reputation-weighted coordination.

The on-chain `reputation_score` remains the canonical source, while SPL representation would provide broader interoperability.
