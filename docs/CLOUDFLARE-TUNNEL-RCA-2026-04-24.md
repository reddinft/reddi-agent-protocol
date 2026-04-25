# Cloudflare Tunnel RCA (2026-04-24)

## Context
Cloudflare Tunnel was intentionally deferred in specialist endpoint onboarding because endpoint reliability and x402-compatible behavior were inconsistent during fast setup flows.

## Current guardrail (live)
- Cloudflare tunnel path is re-enabled in controlled mode.
- ngrok remains the default recommendation (localtunnel fallback supported).
- Endpoint compliance is fail-closed: registration/onboarding checks require valid x402 challenge behavior (`/v1/chat/completions` and probe paths) before progression.

## Hypotheses to validate
1. Cloudflare edge/proxy behavior around streaming and HEAD/health probes causes false negatives in onboarding heartbeat.
2. Path handling for `/v1/*`, `/x402/*`, `/healthz` may differ from expected pass-through defaults.
3. Long-lived tunnel stability under local-runtime restarts introduces onboarding flakiness.

## Repro plan
1. Establish controlled local fixture: token-gated proxy + deterministic mock upstream.
2. Compare ngrok vs Cloudflare on the same proxy port across:
   - `HEAD /`
   - `GET /healthz`
   - `POST /v1/chat/completions`
   - x402 challenge path under `/x402/*`
3. Record pass/fail + latency + error class for 30-run sample.
4. Document required Cloudflare config to make checks deterministic.

### Repro runner (new)
Use the matrix runner to produce artifacted side-by-side results:

```bash
cd /Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code-pr97
NGROK_BASE_URL="https://<ngrok-subdomain>.ngrok-free.app" \
CLOUDFLARE_BASE_URL="https://<tunnel>.trycloudflare.com" \
RCA_SAMPLE_SIZE=30 \
npm run test:tunnel:rca
```

### Quick local x402 fixture (recommended for decision-grade runs)
Start a deterministic fixture locally (Terminal 1):

```bash
cd /Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code-pr97
npm run dev:rca:x402-fixture
```

Start tunnels to the same local port (Terminal 2 + 3):

```bash
ngrok http 19090
cloudflared tunnel --url http://127.0.0.1:19090
```

Use the printed HTTPS URLs as `NGROK_BASE_URL` and `CLOUDFLARE_BASE_URL`, then run matrix + evaluator.

- Optional: set `X402_PROBE_PATH` (default `/x402/health`).
- Artifact output: `artifacts/cloudflare-rca/<timestamp>/SUMMARY.md` + `results.json`.
- Built-in x402 preflight now runs first (3x `GET <X402_PROBE_PATH>` against ngrok baseline); run aborts early if baseline has zero 402 responses.
- Use `npm run test:tunnel:rca -- --dry-run` to validate config without sending probes.
- Use `npm run test:tunnel:rca -- --skip-x402-preflight` only for debugging (not for decision-grade runs).

After a real run, evaluate parity and stability gates:

```bash
npm run test:tunnel:rca:evaluate -- \
  --results artifacts/cloudflare-rca/<timestamp>/results.json \
  --out artifacts/cloudflare-rca/<timestamp>/EVALUATION.md
```

Evaluation PASS criteria:
- no `classification=error` samples on either provider
- probe mode-class parity between ngrok and Cloudflare for all 4 probes
- x402 challenge preservation (Cloudflare keeps the same 402 count as ngrok baseline)
- ngrok baseline must itself show at least one 402 on `x402_probe` (otherwise verdict is fail/inconclusive and fixture must be corrected)

## Exit criteria to re-enable Cloudflare
- 30/30 stable onboarding heartbeat checks
- x402 challenge + non-public token gating both preserved
- No regression in registration probe security classification
- Clear, minimal operator runbook with reproducible commands

## Operator policy (post-RCA)
Use ngrok HTTPS endpoint by default. Cloudflare tunnel is allowed when compliance checks pass; otherwise fail closed and fix endpoint policy/tunnel origin.
