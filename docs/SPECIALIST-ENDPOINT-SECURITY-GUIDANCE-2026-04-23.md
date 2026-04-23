# Specialist Endpoint Security Guidance (2026-04-23)

## Why this matters
Ollama has no built-in auth for public exposure. If a specialist exposes raw Ollama directly, anyone can call it and bypass monetization/payment controls.

## Decision for next iteration
- **Default tunnel guidance: ngrok-first**
- **Cloudflare tunnel: deferred** until root-cause + reproducible tests are green
- **Current guardrail:** onboarding + register probe reject Cloudflare tunnel hostnames during RCA window
- Goal: minimum secure setup steps so specialists can monetize quickly

## Recommended security patterns (practical options)

### Option A (recommended baseline): x402 edge + token-gated proxy + ngrok
1. Run local Ollama on localhost (default 11434)
2. Put token-gated proxy in front of Ollama
3. Keep `/v1/*`, `/x402/*`, `/healthz` public for payment handshake paths
4. Protect non-public/control paths with token header
5. Expose proxy via ngrok HTTPS endpoint
6. Register only the ngrok endpoint (never raw Ollama URL)

Pros: fast setup, compatible with current flow, good enough for demos/early production.

### Option B: ngrok traffic policy auth at edge (basic auth/IP policies)
- Use ngrok traffic policy and/or basic auth in front of proxy.
- Keep x402-required public paths available where needed.

Pros: stronger edge controls; Cons: more policy complexity for first-time operators.

### Option C (advanced): self-hosted reverse proxy + mTLS/OAuth + WAF/rate limits
- Nginx/Caddy/Traefik in front of Ollama/proxy
- mTLS or OAuth at edge, stricter network controls, audit logs

Pros: strongest posture; Cons: higher setup burden.

## Operator quick-start (monetization-focused)
- Install Ollama and pull model
- Start token-gated proxy
- Start ngrok endpoint to proxy port
- Run onboarding healthcheck + preflight
- Register endpoint

## Compliance checklist (minimum)
- [ ] Endpoint is HTTPS public URL (ngrok)
- [ ] Raw Ollama is not publicly exposed
- [ ] Non-public/control routes require auth token
- [ ] x402/public paths remain reachable (`/v1/*`, `/x402/*`, `/healthz`)
- [ ] Preflight and healthcheck pass before registration

## References
- ngrok Ollama example (traffic policy + optional basic auth): https://ngrok.com/docs/universal-gateway/examples/ollama
- Cloudflare RCA tracker (active): `docs/CLOUDFLARE-TUNNEL-RCA-2026-04-24.md`
- Cloudflare tunnel common error diagnostics (kept for deferred RCA): https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/troubleshoot-tunnels/common-errors/
- Observed issue threads for tunnel instability/perf to track during RCA:
  - https://github.com/ollama/ollama/issues/3271
  - https://github.com/ollama/ollama/issues/13899
