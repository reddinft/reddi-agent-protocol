# Cloudflare Tunnel RCA (2026-04-24)

## Context
Cloudflare Tunnel was intentionally deferred in specialist endpoint onboarding because endpoint reliability and x402-compatible behavior were inconsistent during fast setup flows.

## Current guardrail (live)
- Onboarding endpoint manager now rejects Cloudflare tunnel hostnames (`*.trycloudflare.com`, `*.cfargotunnel.com`) with a clear error.
- Operators are redirected to ngrok-first (or localtunnel fallback) until Cloudflare path is re-qualified.

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

## Exit criteria to re-enable Cloudflare
- 30/30 stable onboarding heartbeat checks
- x402 challenge + non-public token gating both preserved
- No regression in registration probe security classification
- Clear, minimal operator runbook with reproducible commands

## Temporary operator policy
Use ngrok HTTPS endpoint for onboarding and registration. Treat Cloudflare tunnel as unsupported until this RCA is closed.
