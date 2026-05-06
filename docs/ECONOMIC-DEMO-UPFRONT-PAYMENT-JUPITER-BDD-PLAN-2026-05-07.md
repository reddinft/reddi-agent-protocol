# Economic Demo Upfront Payment + Jupiter Swap BDD Plan

_Date:_ 2026-05-07 AEST  
_Issue:_ #245  
_Status:_ Plan/spec slice started; implementation pending

## Product truth Nissan clarified

The demo must not merely show an orchestrator paying specialists from nowhere. It must show the real consumer-agent economy:

1. a user connects a wallet;
2. the user pays an upfront activity fee;
3. that fee covers all downstream specialist/attestor calls plus a markup for the first/orchestrator agent;
4. the orchestrator/first agent uses the funded run budget to buy downstream agent services;
5. the user can pay in USDC or SOL;
6. the SOL path proves a real-time Jupiter swap route before the downstream budget is spent;
7. the final result returns with communication-flow evidence, payment-flow evidence, receipts, and budget reconciliation.

## Demo narrative

```text
User wallet
  ├─ selects activity: webpage / research / picture
  ├─ receives upfront quote
  │    ├─ downstream specialist fees
  │    ├─ attestor fees
  │    ├─ Jupiter swap allowance/slippage when paying SOL
  │    └─ orchestrator markup
  ├─ pays in USDC directly OR pays in SOL through Jupiter swap
  ↓
Orchestrator / first consumer agent
  ├─ records gross run budget
  ├─ reserves downstream budget
  ├─ retains markup/margin
  ├─ buys specialist outputs via x402/agent receipts
  ├─ buys attestation/release guidance
  ↓
Final output returned to user
  ├─ deliverable
  ├─ downstream-disclosure ledger
  ├─ user payment receipt / swap proof
  ├─ downstream payment receipts
  └─ budget reconciliation
```

## Acceptance criteria

### UI / visualization

- Wallet connect is the first visible live-demo step.
- Activity quote shows:
  - total upfront fee;
  - downstream specialist fees;
  - attestor fees;
  - orchestrator markup;
  - swap allowance/slippage if SOL route selected;
  - refundable/unspent balance policy.
- Communication graph shows:
  - user → orchestrator;
  - orchestrator → specialists;
  - orchestrator → attestor(s);
  - attestor/result → user.
- Payment graph separately shows:
  - user → orchestrator/escrow upfront payment;
  - optional SOL → USDC Jupiter swap;
  - orchestrator → downstream specialists;
  - orchestrator → attestors;
  - orchestrator retained markup;
  - unspent/refund if applicable.
- Final panel shows output plus receipt chain and budget reconciliation.

### Proof / evidence

- USDC route records a user payment receipt without Jupiter.
- SOL route records Jupiter quote/route/slippage + swap signature or fail-closed reason.
- Downstream x402 calls spend only from the funded run budget.
- Evidence artifact includes:
  - selected payment asset;
  - quote terms;
  - upfront payment receipt;
  - Jupiter proof when used;
  - downstream payment receipts;
  - downstream-disclosure ledger;
  - wallet balance deltas;
  - final output hash/preview;
  - exact limitations.

### Playwright proof lane

- Add `e2e/economic-demo.spec.ts`.
- Deterministic fixture mode must be recordable without real signing/spend.
- Test should click through:
  1. open `/economic-demo`;
  2. connect mock wallet;
  3. select scenario;
  4. inspect quote;
  5. toggle USDC route;
  6. inspect payment + downstream graph;
  7. toggle SOL/Jupiter route;
  8. inspect swap proof panel;
  9. load final evidence/output;
  10. save screenshot/video/trace under `artifacts/playwright-economic-demo/`.

## Proposed implementation slices

### Slice 1 — Deterministic quote model and BDD tests

- Extend `lib/economic-demo/fixture.ts` with `quote`, `paymentOptions`, `budgetLedger`, and `visualFlow` objects.
- Add Jest/unit assertions for quote totals and no overspend.
- Update BDD feature index if needed.

### Slice 2 — Demo page visualization

- Add wallet-connect/upfront quote panel.
- Add explicit communication graph and payment graph components.
- Add budget reconciliation panel.
- Keep live execution controls gated and honest.

### Slice 3 — Playwright recordable proof

- Add `e2e/economic-demo.spec.ts` and artifact capture script.
- Assert visible quote, user payment edge, downstream edges, Jupiter panel, ledger, wallet deltas, and final output.
- Store recording artifacts in ignored `artifacts/playwright-economic-demo/`.

### Slice 4 — Surfpool/devnet/live payment path

- Surfpool rehearsal first for upfront payment and budget spending semantics.
- Devnet/live path only under explicit approval gates and caps.
- SOL/Jupiter path must fail closed on stale quote, slippage cap breach, insufficient output, or missing receipt.

## Guardrails

- No real signing, swap, transfer, wallet mutation, paid provider call, hosted downstream call, or env/deployment mutation in deterministic Playwright fixture mode.
- Do not claim production USDC settlement or Jupiter swap unless the artifact contains actual receipts/signatures.
- Keep controlled demo receipts labeled as bounded demo receipt mode until production verification exists.
- Surface approval gates and caps in the UI and evidence pack.
