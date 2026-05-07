# Pay.sh / reddi-x402 compatibility note — 2026-05-07

## Context

Product: **Reddi Agent Protocol**

Package surface: **`reddi-x402`**

Goal: prove and document Pay.sh sandbox compatibility for agent-paid HTTP 402/x402-style API flows, then identify safe next steps for capped sessions, split payments, and public discovery metadata.

## Environment

- CLI: `pay 0.16.0` installed via Homebrew
- Mode: Pay.sh sandbox / localnet
- Repo-local runtime specs: `config/pay-sh/*.yml`
- Claim boundary: sandbox compatibility only; no mainnet settlement, no Umbra private settlement, no MagicBlock PER settlement.

## Working path — single-recipient charge

Runtime spec:

- `config/pay-sh/reddi-x402-economic-demo-provider.yml`

Endpoint:

- `GET /api/economic-demo/reddi-x402/pay-sh-smoke`
- Price: `$0.01/request`
- Currencies: `USDC`, `USDT`

Observed behavior:

1. Start gateway:

   ```sh
   pay --sandbox server start config/pay-sh/reddi-x402-economic-demo-provider.yml --bind 127.0.0.1:1402 --debugger
   ```

2. Plain curl returns HTTP 402 with MPP payment challenges.
3. Pay.sh sandbox curl completes:

   ```sh
   pay --sandbox curl -i http://127.0.0.1:1402/api/economic-demo/reddi-x402/pay-sh-smoke
   ```

4. Response returns HTTP 200 with `payment-receipt`.
5. Decoded receipt shows:
   - `status: success`
   - `method: solana`

Evidence:

- `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.md`
- `artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.json`

Guard:

```sh
npm run evidence:pay-sh:reddi-x402 -- artifacts/pay-sh-reddi-x402/20260507T064842Z
```

## Extension probe — capped session + splits

Runtime spec:

- `config/pay-sh/reddi-x402-economic-demo-session-splits.yml`

Endpoint:

- `GET /api/economic-demo/reddi-x402/pay-sh-session-splits-smoke`
- Session cap: `1.00 USDC`
- Split metadata: 20% downstream specialist share

Observed behavior:

- Plain curl returns HTTP 402 with MPP `intent="session"` challenge.
- Decoded challenge includes cap `1000000` base units.
- `pay --sandbox curl -i ...` returns:

```json
{"error":{"message":"Server returned 402 again after payment"}}
```

Evidence:

- `artifacts/pay-sh-reddi-x402/20260507T065805Z-session-splits/SUMMARY.md`
- `artifacts/pay-sh-reddi-x402/20260507T065805Z-session-splits/SUMMARY.json`

## Extension probe — split-only charge

Runtime spec:

- `config/pay-sh/reddi-x402-economic-demo-splits.yml`

Endpoint:

- `GET /api/economic-demo/reddi-x402/pay-sh-splits-smoke`
- Price: `$0.02/request`
- Split metadata: 20% downstream specialist share

Observed behavior:

- Plain curl returns HTTP 402 with MPP `intent="charge"` challenge.
- Decoded challenge includes split metadata:
  - first split amount: `4000` base units
  - recipient: `d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR`
- `pay --sandbox curl -i ...` returns:

```json
{"error":{"message":"Server returned 402 again after payment"}}
```

Evidence:

- `artifacts/pay-sh-reddi-x402/20260507T065908Z-splits/SUMMARY.md`
- `artifacts/pay-sh-reddi-x402/20260507T065908Z-splits/SUMMARY.json`

## Installed CLI differences from ingested docs

The ingested docs referenced commands such as:

```sh
pay skills build
pay skills probe
pay skills validate
```

Installed `pay 0.16.0` does **not** expose those subcommands. It exposes:

```sh
pay skills provider sync
pay skills list
pay skills search
pay skills endpoints
```

The local discovery path therefore uses:

```sh
pay skills provider sync \
  --operator redditech \
  --origin reddi-agent-protocol \
  --out providers \
  --sandbox-service-url 'http://127.0.0.1:1402/{name}' \
  config/pay-sh/reddi-x402-economic-demo-provider.yml
```

Generated registry metadata:

- `providers/redditech/reddi-agent-protocol/reddi-x402-economic-demo-provider.md`

Guard:

```sh
npm run check:pay-skills:registry
```

## Current recommendation

Use the working single-recipient charge flow for Reddi Agent Protocol demo/submission evidence.

Keep capped sessions and split payments as documented extension probes until one of these is true:

1. Pay.sh maintainers confirm expected spec syntax/runtime behavior for session/split settlement, or
2. We find a spec adjustment that makes `pay --sandbox curl` complete with HTTP 200, or
3. We implement a separate Reddi Agent Protocol-side adapter that handles these extension policies while preserving Pay.sh compatibility at the simple charge layer.

## Maintainer-ready repro question

In `pay 0.16.0`, single-recipient charge specs complete successfully with `pay --sandbox curl -i` and return HTTP 200 + `payment-receipt`. However, specs with `session.cap_usdc` and/or `metering.splits` emit plausible MPP challenge metadata but return `Server returned 402 again after payment` after sandbox payment.

Question: is this expected for the current sandbox CLI/runtime, or should session/split specs complete the same 402 → payment → 200 flow as simple charge specs?

Minimal evidence files are listed above.
