# Use-Case Traceability Matrix — 2026-04-23

## Scope
This matrix maps product use-cases to executable coverage lanes so regressions are caught before demo/release.

## Buckets A-H

| Bucket | Use-case | Primary coverage | Result |
|---|---|---|---|
| A | Onboarding/operator gates | `operator-key-rotation.test.ts`, `onboarding-operator-status-routes.test.ts` | ✅ |
| B | Discovery/ranking | `registry-route.test.ts`, `registry-bridge-sort.test.ts` | ✅ |
| C | Planner resolve/invoke/signal | `planner-resolve-route.test.ts`, `planner-invoke-route.test.ts`, `planner-signal-route.test.ts` | ✅ |
| D/E | Endpoint security + reliability | `endpoint-security-compat.test.ts`, `program-rpc-config.test.ts`, `register-probe-route.test.ts` | ✅ |
| F | Jupiter/x402 settlement | `jupiter-client.test.ts`, `packages/x402-solana/tests/payment.test.ts` | ✅ |
| G | Torque retention layer | `torque-client.test.ts`, `torque-event-route.test.ts`, `torque-leaderboard-route.test.ts`, `torque-onboarding-event.test.ts` | ✅ |
| H | Consumer lifecycle | `planner-register-consumer-route.test.ts`, `planner-tools-manifest-route.test.ts`, `planner-resolve-attestor-route.test.ts`, `planner-release-route.test.ts`, `planner-auditability.test.ts` | ✅ |

## Gap closures included in this iteration
- Restored missing executable coverage files referenced by the BDD sweep gate for Buckets B, D/E, and H.
- Restored planner tool route surface for:
  - `register_consumer`
  - `resolve_attestor`
  - `decide_settlement` (`/release` route)
- Restored supporting onboarding helpers:
  - `lib/onboarding/attestor-resolver.ts`
  - `lib/onboarding/planner-settlement.ts`

## Verification artifact
- Representative sweep: `artifacts/bdd-sweep/20260423-232338/SUMMARY.md`
- Command: `npm run test:bdd:sweep`

## Next follow-up
- Keep this matrix synced with `scripts/run-bdd-bucket-sweep.sh` so each bucket has at least one representative executable gate.
- Maintain strict registration probe behavior (`requireX402`) so insecure open-completion endpoints fail compliance checks by default.
