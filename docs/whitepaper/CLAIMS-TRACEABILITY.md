# Claims Traceability Matrix

This matrix maps whitepaper claims to implementation and validation artifacts.

| Claim | Status | Primary evidence |
|---|---|---|
| Specialist/consumer/attestor lifecycle is implemented | SHIPPED | `app/api/planner/tools/*`, `docs/bdd/features/bucket-h-consumer-orchestrator.feature` |
| Settlement has explicit release/refund/dispute outcomes | SHIPPED | `lib/onboarding/planner-settlement.ts`, `lib/__tests__/planner-release-route.test.ts` |
| Dogfood flow validates pass/fail payout gating | SHIPPED | `app/api/dogfood/*`, `e2e/dogfood.spec.ts`, `lib/__tests__/dogfood-*.test.ts` |
| BDD coverage is executable and indexed | SHIPPED | `docs/bdd/FEATURE-INDEX.md`, `npm run test:bdd:index` |
| Threat controls are mapped with residual risks | SHIPPED (docs) | `docs/whitepaper/APPENDIX-THREAT-MODEL.md` |
| Benchmark lanes are reproducible | SHIPPED (docs) | `docs/whitepaper/APPENDIX-BENCHMARK-METHODOLOGY.md` |
| Signed attestor verdict binding | ROADMAP | `docs/whitepaper/APPENDIX-THREAT-MODEL.md` hardening roadmap |
| Output commit-reveal hash locking for settlement | ROADMAP | `docs/whitepaper/APPENDIX-THREAT-MODEL.md` hardening roadmap |

## Status labels

- **SHIPPED**: Present in implementation and/or active docs with evidence path.
- **ROADMAP**: Planned work, not yet live on main.
