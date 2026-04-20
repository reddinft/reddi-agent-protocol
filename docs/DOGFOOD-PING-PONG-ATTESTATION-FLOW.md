# Dogfood Flow: Ping/Pong + Haiku Specialist with Attestor Gate

This flow validates end-to-end specialist discovery, invocation, attestation, and escrow settlement.

## Goal

- Consumer sends `ping`
- Testing specialist should return:
  - `pong`
  - 3-line haiku (5/7/5)
- Testing attestor verifies both rules
- Escrow is released only when attestation passes
- If attestation fails, escrow is refunded/disputed path (no payout)

Specialist intentionally fails **1 in 4 calls** to test rejection logic.

## Live endpoints

- `GET/POST /api/dogfood/seed`
  - Registers test specialist + attestor in off-chain specialist index (searchable)
- `GET /api/dogfood/search`
  - Returns dogfood-tagged specialists from registry bridge
- `POST /api/dogfood/testing-specialist`
  - Returns specialist payload (25% failure injection)
- `POST /api/dogfood/testing-attestor`
  - Validates `pong` + haiku format
- `GET/POST /api/dogfood/consumer-run`
  - End-to-end orchestrator run with escrow decision

## Quick run

```bash
# 1) seed searchable agents
curl -s http://localhost:3000/api/dogfood/seed | jq

# 2) verify search can surface them
curl -s http://localhost:3000/api/dogfood/search | jq '.total, .listings[].walletAddress'

# 3) execute one full consumer flow (random 25% fail)
curl -s http://localhost:3000/api/dogfood/consumer-run | jq

# 4) force pass/fail for deterministic demo clips
curl -s -X POST http://localhost:3000/api/dogfood/consumer-run \
  -H 'content-type: application/json' \
  -d '{"force":"pass"}' | jq

curl -s -X POST http://localhost:3000/api/dogfood/consumer-run \
  -H 'content-type: application/json' \
  -d '{"force":"fail"}' | jq
```

## Anti-gaming posture (current)

1. **Escrow state machine**
   - `held -> released|refunded|disputed`
   - no double settlement allowed
2. **Independent attestor gate**
   - consumer settlement decision is driven by attestor verdict
3. **Run-linked evidence hashes**
   - `promptHash`, `outputHash`, `attestationHash` returned per run
4. **Intentional specialist failure injection**
   - proves consumer and attestor reject bad outputs

## Anti-gaming hardening (next)

To prevent “take answer without payment” and “pay for false answer” in production:

1. **Commit-reveal receipt binding**
   - specialist commits `outputHash` before reveal
   - reveal only accepted when hash matches prior commitment
2. **Attestor signature requirement**
   - attestor signs verdict `(runId, outputHash, pass/fail)`
   - settlement contract verifies signature
3. **Dispute window + slashing**
   - hold funds through challenge period
   - slash attestor/specialist stake on provable bad verdict
4. **Encrypted result release**
   - specialist encrypts output to consumer key; decryption key released only after payment proof
5. **Replay protection**
   - nonce, expiry, and chain/domain separation in all signed payloads

## Demo capture plan (Playwright/Peekaboo)

Record three deterministic runs:
- Pass path (`force=pass`) -> attestor PASS -> escrow RELEASED
- Fail path A (`force=fail`) -> missing pong -> REFUNDED
- Fail path B (random fail) -> malformed haiku -> REFUNDED

Use these JSON traces as on-screen evidence in the next demo cut.

