# Claude Code MCP x402 Recording Runbook

_Date: 2026-05-09 AEST_

## Status

Ready for repeatable recording.

Proof ladder completed:

1. **Dry MCP surface:** `smoke:stdio` and `smoke:x402-tool-list` passed.
2. **Surfpool prerequisite:** local validator x402 E2E passed.
3. **Funding preflight:** demo payer already funded; no treasury transfer required.
4. **Live devnet smoke:** hosted specialist x402 call passed with a bounded `0.05 USDC` devnet payment.

## Evidence artifacts

- Surfpool/local x402 E2E proof:
  - `artifacts/rap-mcp-bridge-x402-surfpool-local/20260508T214434Z/SUMMARY.md`
- Devnet funding preflight:
  - `artifacts/claude-code-mcp-x402-peekaboo-demo/20260508T214759Z-devnet-funding-preflight/SUMMARY.md`
- Live devnet x402 specialist smoke:
  - `artifacts/claude-code-mcp-x402-peekaboo-demo/20260508T214912Z-live-x402-specialist-smoke/SUMMARY.md`

Live smoke result:

- Payer: `3Vmcwra5tfxGwaX3jnpmYybCd7gH4fstJzi1Yci38f94`
- Payee: `8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To`
- Receipt: `x402_specialist_e12428767c48f25a1e5ae5c3`
- Devnet tx: `1g3B6EBdBcAVWQaGU3EWGLuSGYBnuFCU4MN7Vbn8SUZtEDczF5eSxRxjgZR3rUhsna5WxQjWPzbWAW6VbzfwKj9`
- Payer USDC: `0.87 → 0.82`
- Ledger entries: `1`

## Safety boundaries

Say:

- Solana **devnet** payment.
- x402 specialist challenge → bounded devnet USDC payment → paid retry succeeds.
- MCP receipt and disclosure ledger are exported locally.
- Surfpool local validator proof was run before live devnet spend.

Do **not** say:

- Mainnet settlement.
- Unlimited wallet delegation.
- Arbitrary endpoint invocation.
- Every marketplace specialist is paid-live.
- Production custody/wallet-router is complete.

## Build and smoke gates

From repo root:

```bash
npm --prefix packages/rap-mcp-bridge run smoke:stdio
npm --prefix packages/rap-mcp-bridge run smoke:x402-tool-list
npm --prefix packages/rap-mcp-bridge run smoke:x402-surfpool-local
RAP_MCP_LIVE_X402_SPECIALIST_SMOKE=1 \
RAP_MCP_DEVNET_WALLET_KEYPAIR=/Users/loki/.config/solana/id.json \
RAP_MCP_DEVNET_RPC_URL=https://api.devnet.solana.com \
RAP_MCP_DEVNET_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
RAP_MCP_DEVNET_MAX_USDC_MICRO_UNITS=60000 \
npm --prefix packages/rap-mcp-bridge run smoke:live-x402-specialist
npm test --prefix packages/rap-mcp-bridge
```

The live smoke spends one capped devnet x402 payment if the hosted specialist returns a valid 402 challenge.

## Claude Code MCP registration

Build first:

```bash
npm --prefix packages/rap-mcp-bridge run build
```

Register MCP server:

```bash
claude mcp add reddi-rap-devnet \
  -e REDDI_RAP_MCP_MODE=devnet \
  -e REDDI_MCP_HOST_FRAMEWORK=claude \
  -e REDDI_MCP_AGENT_NAME=claude-code-demo \
  -e REDDI_MCP_STORE_DIR=/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/artifacts/claude-code-mcp-x402-peekaboo-demo/mcp-store \
  -e RAP_MCP_DEVNET_PROOF_APPROVED=1 \
  -e RAP_MCP_ALLOW_SPECIALIST_INVOKE=1 \
  -e RAP_MCP_DEVNET_WALLET_KEYPAIR=/Users/loki/.config/solana/id.json \
  -e RAP_MCP_DEVNET_RPC_URL=https://api.devnet.solana.com \
  -e RAP_MCP_DEVNET_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU \
  -e RAP_MCP_DEVNET_MAX_USDC_MICRO_UNITS=60000 \
  -e RAP_MCP_SPECIALIST_ENDPOINT_ALLOWLIST=https://reddi-code-generation.preview.reddi.tech/v1/chat/completions \
  -- node /Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code/packages/rap-mcp-bridge/dist/src/server.js
```

Do not open or print the keypair JSON during recording. It is acceptable to show the public wallet address and balances.

Optional sanity check:

```bash
claude mcp list
claude mcp get reddi-rap-devnet
```

## Recording prompt

Use this prompt in Claude Code:

```text
Use Reddi Agent Protocol MCP tools to answer this demo question:

What does a paid machine-to-machine specialist call prove for agent marketplaces?

Requirements:
- Discover or identify an available code-generation specialist.
- Use only the allowlisted devnet x402 specialist endpoint.
- Keep spend under the configured 60000 micro-USDC cap.
- Execute the x402 specialist call only if the tool reports the configured devnet wallet is ready.
- Verify the receipt before relying on the specialist output.
- Export a disclosure ledger entry.
- Final answer must include: chosen specialist, what it contributed, devnet payment receipt/tx boundary, and disclosure-ledger summary.
```

## Screen storyboard

Target: 60–100 seconds.

1. Show build/smoke proof artifacts briefly.
2. Show Claude MCP server registration/listing.
3. Show public demo wallet address and balances only.
4. Paste the recording prompt.
5. Show MCP tool calls:
   - specialist discovery / selection
   - x402 execute call
   - receipt verify
   - disclosure ledger export
6. Show final answer with receipt tx and devnet boundary.
7. End on artifact paths.

## If live call fails during recording

1. Stop recording.
2. Re-run the live smoke script.
3. If it fails before payment, no spend occurred; inspect endpoint/challenge readiness.
4. If it fails after payment, use the smoke artifact and receipt/tx to debug before trying again.
5. Do not raise cap or broaden allowlist during recording.

## Next improvement after recording

Add a dedicated, low-balance demo-only keypair path or wallet-router session so the recording no longer uses the default Solana CLI keypair, even though it is currently devnet-only and funded for the demo.
