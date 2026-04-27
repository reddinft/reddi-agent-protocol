#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[per-happy] missing required command: $1" >&2
    exit 1
  fi
}

require_cmd npm
require_cmd node
require_cmd python3

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/artifacts/per-happy/$TS"
LOG_FILE="$OUT_DIR/per-happy.log"
mkdir -p "$OUT_DIR"

PROFILE="${NETWORK_PROFILE:-devnet}"
if [ "$PROFILE" = "local-surfpool" ] || [ "$PROFILE" = "local" ] || [ "$PROFILE" = "localnet" ]; then
  echo "[per-happy] NETWORK_PROFILE=$PROFILE is not valid for PER happy-path validation." | tee "$LOG_FILE"
  echo "[per-happy] use devnet/mainnet profile with reachable TEE endpoint." | tee -a "$LOG_FILE"
  exit 1
fi

PER_RPC="${NEXT_PUBLIC_PER_RPC:-${DEMO_PER_RPC:-https://devnet-tee.magicblock.app}}"
RPC_URL="${NEXT_PUBLIC_RPC_ENDPOINT:-https://api.devnet.solana.com}"

run_step() {
  local label="$1"
  shift
  {
    echo ""
    echo "[per-happy] >>> $label"
    "$@"
  } 2>&1 | tee -a "$LOG_FILE"

  local code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then
    echo "[per-happy] FAIL: $label (code=$code)" | tee -a "$LOG_FILE"
    return "$code"
  fi
  return 0
}

{
  echo "[per-happy] starting PER happy-path lane"
  echo "[per-happy] output: $OUT_DIR"
  echo "[per-happy] network_profile: $PROFILE"
  echo "[per-happy] rpc: $RPC_URL"
  echo "[per-happy] per_rpc: $PER_RPC"
} | tee "$LOG_FILE"

run_step "Fund + register agents" bash -lc "
  cd packages/demo-agents
  NETWORK_PROFILE='${PROFILE}' \
  NEXT_PUBLIC_RPC_ENDPOINT='${RPC_URL}' \
  NEXT_PUBLIC_PER_RPC='${PER_RPC}' \
  npm run fund | tee '${OUT_DIR}/01-fund.log'

  NETWORK_PROFILE='${PROFILE}' \
  NEXT_PUBLIC_RPC_ENDPOINT='${RPC_URL}' \
  NEXT_PUBLIC_PER_RPC='${PER_RPC}' \
  npm run register | tee '${OUT_DIR}/02-register.log'
"

set +e
cd "$ROOT_DIR/packages/demo-agents"
NETWORK_PROFILE="$PROFILE" \
NEXT_PUBLIC_RPC_ENDPOINT="$RPC_URL" \
NEXT_PUBLIC_PER_RPC="$PER_RPC" \
DEMO_SETTLEMENT_MODE=magicblock_per \
DEMO_ALLOW_FALLBACK=false \
DEMO_STOP_AFTER_SETTLEMENT=true \
npm run demo > "$OUT_DIR/03-demo.log" 2>&1
DEMO_CODE=$?
cd "$ROOT_DIR"
set -e

FAIL_CLASS=""
if [ "$DEMO_CODE" -ne 0 ]; then
  FAIL_CLASS="$(python3 - <<PY
from pathlib import Path
text = Path(r"$OUT_DIR/03-demo.log").read_text(errors="ignore").lower()
if "per settlement failed and fallback disabled" in text:
    print("per_unavailable_or_rejected")
elif "429" in text or "airdrop" in text and "rate" in text:
    print("rate_limited")
elif "blockhash not found" in text:
    print("stale_blockhash")
else:
    print("unknown")
PY
)"
fi

PER_SENT="no"
if grep -q "PER settlement submitted" "$OUT_DIR/03-demo.log"; then
  PER_SENT="yes"
fi
FALLBACK_USED="no"
if grep -q "L1 fallback used" "$OUT_DIR/03-demo.log"; then
  FALLBACK_USED="yes"
fi

RESULT_LINE="❌ FAIL"
if [ "$DEMO_CODE" -eq 0 ] && [ "$PER_SENT" = "yes" ] && [ "$FALLBACK_USED" = "no" ]; then
  RESULT_LINE="✅ PASS"
fi

{
  echo "# PER Happy-Path Lane Summary"
  echo ""
  echo "- Timestamp: $TS"
  echo "- Network profile: $PROFILE"
  echo "- RPC: $RPC_URL"
  echo "- PER RPC: $PER_RPC"
  echo "- Result: $RESULT_LINE"
  echo "- PER submitted: $PER_SENT"
  echo "- Fallback used: $FALLBACK_USED"
  if [ "$DEMO_CODE" -ne 0 ]; then
    echo "- Failure class: ${FAIL_CLASS}"
  fi
  echo ""
  echo "## Artifacts"
  echo "- Main log: $LOG_FILE"
  echo "- Fund log: $OUT_DIR/01-fund.log"
  echo "- Register log: $OUT_DIR/02-register.log"
  echo "- Demo log: $OUT_DIR/03-demo.log"
} > "$OUT_DIR/SUMMARY.md"

if [ "$RESULT_LINE" != "✅ PASS" ]; then
  echo "[per-happy] incomplete: class=${FAIL_CLASS:-none} artifacts=$OUT_DIR" | tee -a "$LOG_FILE"
  exit 1
fi

echo "[per-happy] complete: $OUT_DIR/SUMMARY.md" | tee -a "$LOG_FILE"
