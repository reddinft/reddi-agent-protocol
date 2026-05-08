#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/loki/.openclaw/workspace/projects/reddi-agent-protocol-code"
cd "$ROOT"

TS="${1:-$(date -u +%Y%m%dT%H%M%SZ)}"
OUT_DIR="$ROOT/artifacts/claude-code-mcp-x402-peekaboo-demo/${TS}-claude-code-recording-run"
mkdir -p "$OUT_DIR"

cat <<'BANNER'
Reddi Agent Protocol + Claude Code MCP x402 demo
Boundary: Solana devnet only · exact endpoint allowlist · 60000 micro-USDC cap
BANNER

printf '\nProof ladder:\n'
printf '  Surfpool local proof: artifacts/rap-mcp-bridge-x402-surfpool-local/20260508T214434Z/SUMMARY.md\n'
printf '  Live smoke proof:    artifacts/claude-code-mcp-x402-peekaboo-demo/20260508T214912Z-live-x402-specialist-smoke/SUMMARY.md\n'
printf '  Rehearsal proof:     artifacts/claude-code-mcp-x402-peekaboo-demo/20260508T220315Z-claude-print-rehearsal/SUMMARY.md\n\n'

PROMPT=$(cat <<'EOF'
Use Reddi Agent Protocol MCP tools to answer this demo question:

What does a paid machine-to-machine specialist call prove for agent marketplaces?

Requirements:
- First call discovery to show the marketplace exists.
- For the paid call, use only this exact allowlisted devnet x402 endpoint: https://reddi-code-generation.preview.reddi.tech/v1/chat/completions
- Do not use example.com endpoints.
- Keep spend under the configured 60000 micro-USDC cap.
- Execute the x402 specialist call only if the configured devnet wallet is ready or if execute captures a valid 402 challenge and enforces readiness internally.
- Verify the receipt before relying on the specialist output.
- Export a disclosure ledger entry.
- Final answer must include: chosen specialist endpoint, what it contributed, devnet payment receipt/tx boundary, and disclosure-ledger summary.
- Product naming: call it "Reddi Agent Protocol" or "RAP" only; do not shorten the product name to "Reddi".
- If describing the hosted code-generation endpoint, call it the "Reddi Agent Protocol code-generation specialist endpoint" or "RAP code-generation specialist endpoint".
EOF
)

printf 'Starting Claude Code with Reddi Agent Protocol MCP tools...\n\n'
claude -p \
  --permission-mode acceptEdits \
  --allowedTools "mcp__reddi-rap-devnet__reddi_discover_specialists,mcp__reddi-rap-devnet__reddi_prepare_x402_specialist_call,mcp__reddi-rap-devnet__reddi_execute_x402_specialist_call,mcp__reddi-rap-devnet__reddi_verify_x402_specialist_receipt,mcp__reddi-rap-devnet__reddi_export_disclosure_ledger" \
  --max-budget-usd 1 \
  --output-format text \
  "$PROMPT" | tee "$OUT_DIR/claude-output.txt"

printf '\nSaved Claude output: %s\n' "$OUT_DIR/claude-output.txt"
printf 'MCP store: artifacts/claude-code-mcp-x402-peekaboo-demo/mcp-store/store.json\n'
printf 'Done.\n'
