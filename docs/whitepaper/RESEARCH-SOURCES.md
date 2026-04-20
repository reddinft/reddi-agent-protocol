# Research Sources and Claims Ledger Inputs

## Internal canonical sources

- `README.md` — protocol overview, architecture framing, economics summary
- `docs/PAYMENT-FLOW-ARCHITECTURE.md` — x402 + escrow settlement path
- `docs/REPUTATION-TOKEN-DESIGN.md` — reputation semantics, commit-reveal framing
- `docs/bdd/FEATURE-INDEX.md` — executable coverage index
- `docs/bdd/features/*.feature` — behavior-level spec
- `lib/onboarding/planner-execution.ts` — run lifecycle and x402 flow
- `lib/onboarding/planner-settlement.ts` — settlement decision state machine
- `lib/onboarding/attestor-resolver.ts` — attestor selection and scoring
- `app/api/planner/tools/*` — MCP/tooling surfaces for integrators
- `app/api/dogfood/*` + `app/dogfood/page.tsx` — test harness and operator flow

## External context references (for narrative framing)

- Solana transaction economics and execution model
- HTTP 402 payment-challenge patterns (x402 style challenge/response)
- TEE-assisted private execution patterns (MagicBlock PER positioning)

## Claims rubric

Each major claim should be tagged:

- `SHIPPED` — present on main branch and test-covered
- `EXPERIMENTAL` — implemented but not default production path
- `ROADMAP` — not yet shipped

## High-risk claims requiring explicit wording discipline

1. **Privacy guarantees**
   - Must state exact mode and fallback behavior.
2. **Attestation correctness guarantees**
   - Must clarify probabilistic/agentic nature and dispute path.
3. **Economic outcomes**
   - Must separate protocol mechanics from market adoption assumptions.
4. **Performance metrics**
   - Must tie to benchmark environment and constraints.

## Open research tasks (next)

- Add benchmark appendix with reproducible setup and commands.
- Add threat model matrix mapped to controls and residual risk.
- Add interoperability section (MCP/tool route compatibility details).
