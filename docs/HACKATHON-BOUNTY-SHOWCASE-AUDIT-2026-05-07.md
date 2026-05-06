# Hackathon Bounty Showcase Audit — 2026-05-07

## Verdict

Most bounty/ecosystem surfaces are incorporated into the website/demo enough to showcase, but they are not all equally strong. Quasar, x402, OpenRouter, Surfpool, and Jupiter-boundary evidence are strong. Torque exists but needed a clearer website/showcase beat. MagicBlock is intentionally honest-boundary only unless live PER/TEE validation is separately approved. ElizaOS/SendAI exist as framework adapter evidence, not core on-chain proof.

## Showcase matrix

| Surface | Website/demo presence | Qualification posture | Recording framing |
| --- | --- | --- | --- |
| Quasar | `/economic-demo`, `/register`, `/onboarding`, demo-agent script, CI/readiness docs | Strongest: live devnet final path across Registry/Escrow/Reputation/Attestation | “Final demo-critical on-chain path is Quasar-native.” |
| x402 | `/economic-demo`, `/planner`, `/onboarding`, `/testers`, `packages/x402-solana` | Strong: visible fail-closed payment challenge/receipt story | “Agent calls are payment-gated with x402-style challenge/receipt boundaries.” |
| OpenRouter specialists | `/economic-demo`, `/agents`, `packages/openrouter-specialists` | Strong: marketplace/profile layer visible without hidden paid calls | “30 specialist profiles support human-triggered workflow routing.” |
| Jupiter | `/economic-demo`, run-report/submission-prep artifacts, Surfpool/mock-Jupiter invoke lane | Medium/strong if framed honestly: quote/build/sign + local no-real-funds invoke proof | “Public Jupiter devnet execution is not claimed; successful live Jupiter would require approved mainnet.” |
| Surfpool | `/economic-demo`, local rehearsal scripts/artifacts | Strong supporting proof | “Local validator confidence gate before devnet; caught bugs before live proof.” |
| Torque | `/leaderboard`, `/api/torque/event`, `lib/torque/*`, Bucket G tests | Medium: implemented, now made more visible via homepage ecosystem map | “Retention/leaderboard and custom event plumbing for completed agent jobs.” |
| MagicBlock | `packages/per-client`, docs/proof boundaries, demo-agent fail-closed behavior | Weak for prize unless live PER/TEE validation is approved/run | “PER/TEE is not claimed in final Quasar path; approval-gated supporting lane.” |
| ElizaOS | `packages/eliza-plugin-x402`, planner tool manifest | Medium/weak: adapter evidence, not central demo path | “Framework adapter for x402-protected agent commerce.” |
| SendAI | `packages/sendai-x402` | Medium/weak: adapter evidence, not central demo path | “Framework adapter for distribution beyond the web app.” |

## Action taken in Loop 13

Added a homepage “Hackathon ecosystem proof map” so the deployed website can route judges to each sponsor/evidence surface without overclaiming. The panel includes Quasar, x402, OpenRouter, Jupiter, Surfpool, Torque, MagicBlock, and ElizaOS/SendAI with status labels and links.

## Remaining decision

If MagicBlock has a must-win bounty, decide whether to approve a separate live PER/TEE validation lane. Without that, keep MagicBlock as an honest supporting/boundary surface, not a final claim.
