#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[surfpool-smoke] missing required command: $1" >&2
    exit 1
  fi
}

require_cmd surfpool
require_cmd solana
require_cmd npm
require_cmd python3
require_cmd "${HOME}/.cargo/bin/cargo"

PROGRAM_KEYPAIR="target/deploy/escrow-keypair.json"
PROGRAM_SOURCE="programs/escrow/src/lib.rs"

declared_program_id() {
  python3 - <<'PY'
import re
from pathlib import Path
text = Path('programs/escrow/src/lib.rs').read_text()
m = re.search(r'declare_id!\("([^"]+)"\)', text)
if not m:
    raise SystemExit('declare_id! not found in programs/escrow/src/lib.rs')
print(m.group(1))
PY
}

assert_program_id_alignment() {
  local declared keypair
  declared="$(declared_program_id)"
  keypair="$(solana address -k "$PROGRAM_KEYPAIR")"
  if [ "$declared" != "$keypair" ]; then
    echo "[surfpool-smoke] program-id preflight failed" >&2
    echo "[surfpool-smoke] declare_id in $PROGRAM_SOURCE: $declared" >&2
    echo "[surfpool-smoke] keypair address in $PROGRAM_KEYPAIR: $keypair" >&2
    echo "[surfpool-smoke] Fix by restoring a matching escrow keypair or updating declare_id + dependent env/docs in a coordinated change." >&2
    exit 1
  fi
}

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/artifacts/surfpool-smoke/$TS"
LOG_FILE="$OUT_DIR/surfpool-smoke.log"
mkdir -p "$OUT_DIR"

PORT="${SURFPOOL_PORT:-18999}"
WS_PORT="${SURFPOOL_WS_PORT:-19000}"
RPC_URL="http://127.0.0.1:${PORT}"
SURFPOOL_LOG="$OUT_DIR/surfpool.log"
SURFPOOL_PID=""

cleanup() {
  if [ -n "$SURFPOOL_PID" ] && kill -0 "$SURFPOOL_PID" >/dev/null 2>&1; then
    kill "$SURFPOOL_PID" >/dev/null 2>&1 || true
    wait "$SURFPOOL_PID" 2>/dev/null || true
  fi

  local pids
  pids="$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill -9 $pids >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

run_step() {
  local label="$1"
  shift

  {
    echo ""
    echo "[surfpool-smoke] >>> $label"
    "$@"
  } 2>&1 | tee -a "$LOG_FILE"

  local code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then
    echo "[surfpool-smoke] FAIL: $label (code=$code)" | tee -a "$LOG_FILE"
    exit "$code"
  fi
}

{
  echo "[surfpool-smoke] starting critical scenario lane"
  echo "[surfpool-smoke] output: $OUT_DIR"
  echo "[surfpool-smoke] rpc: $RPC_URL"
} | tee "$LOG_FILE"

assert_program_id_alignment

# Start Surfpool in offline mode for deterministic local simulation.
run_step "Start Surfpool" bash -lc "
  surfpool start --ci --legacy-anchor-compatibility -y --offline \
    --port ${PORT} --ws-port ${WS_PORT} --no-studio --no-tui --log-level info \
    > '${SURFPOOL_LOG}' 2>&1 &
  echo \$! > '${OUT_DIR}/surfpool.pid'
"
SURFPOOL_PID="$(cat "$OUT_DIR/surfpool.pid")"

# Wait for RPC readiness.
for i in {1..40}; do
  if solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
  if [ "$i" -eq 40 ]; then
    echo "[surfpool-smoke] Surfpool RPC did not become ready" | tee -a "$LOG_FILE"
    exit 1
  fi
done

run_step "Capture versions" bash -lc "
  set -euo pipefail
  surfpool --version | tee '${OUT_DIR}/00-surfpool-version.log'
  solana --version | tee '${OUT_DIR}/00-solana-version.log'
"

run_step "Build escrow program" bash -lc "
  set -euo pipefail
  ~/.cargo/bin/cargo build-sbf --manifest-path programs/escrow/Cargo.toml --sbf-out-dir target/deploy \
    | tee '${OUT_DIR}/01-cargo-build-sbf.log'
"

run_step "Deploy escrow program to Surfpool local RPC" bash -lc "
  set -euo pipefail
  solana airdrop 10 --url '${RPC_URL}' d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR | tee '${OUT_DIR}/02a-upgrade-airdrop.log'
  solana balance --url '${RPC_URL}' d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR | tee '${OUT_DIR}/02b-upgrade-balance.log'
  solana program deploy target/deploy/escrow.so \
    --program-id "$PROGRAM_KEYPAIR" \
    --url '${RPC_URL}' \
    --keypair ~/.config/solana/blitz-dev.json \
    | tee '${OUT_DIR}/02-program-deploy.log'
"

PROGRAM_ID="$(solana address -k "$PROGRAM_KEYPAIR")"

run_step "Demo scenario A: public settlement on Surfpool" bash -lc "
  set -euo pipefail
  cd packages/demo-agents
  DEMO_DEVNET_RPC='${RPC_URL}' \
  DEMO_ESCROW_PROGRAM_ID='${PROGRAM_ID}' \
  DEMO_SETTLEMENT_MODE=public \
  DEMO_STOP_AFTER_SETTLEMENT=true \
  npm run fund | tee '${OUT_DIR}/03a-fund-public.log'

  DEMO_DEVNET_RPC='${RPC_URL}' \
  DEMO_ESCROW_PROGRAM_ID='${PROGRAM_ID}' \
  npm run register | tee '${OUT_DIR}/03b-register-public.log'

  DEMO_DEVNET_RPC='${RPC_URL}' \
  DEMO_ESCROW_PROGRAM_ID='${PROGRAM_ID}' \
  DEMO_SETTLEMENT_MODE=public \
  DEMO_STOP_AFTER_SETTLEMENT=true \
  npm run demo | tee '${OUT_DIR}/03c-demo-public.log'
"

run_step "Demo scenario B: PER requested + fallback to L1 on unreachable PER" bash -lc "
  set -euo pipefail
  cd packages/demo-agents
  DEMO_DEVNET_RPC='${RPC_URL}' \
  DEMO_ESCROW_PROGRAM_ID='${PROGRAM_ID}' \
  DEMO_PER_RPC='http://127.0.0.1:65535' \
  DEMO_SETTLEMENT_MODE=auto \
  DEMO_ALLOW_FALLBACK=true \
  DEMO_STOP_AFTER_SETTLEMENT=true \
  npm run demo | tee '${OUT_DIR}/04-demo-per-fallback.log'
"

{
  echo "# Surfpool Critical Scenario Smoke Summary"
  echo ""
  echo "- Timestamp: $TS"
  echo "- RPC: $RPC_URL"
  echo "- Program ID: ${PROGRAM_ID}"
  echo "- Scenario A: public settlement on Surfpool localnet ✅"
  echo "- Scenario B: PER requested with unreachable PER RPC -> L1 fallback ✅"
  echo ""
  echo "## Artifacts"
  echo "- Main log: $LOG_FILE"
  echo "- Surfpool log: $SURFPOOL_LOG"
  echo "- Deploy log: $OUT_DIR/02-program-deploy.log"
  echo "- Public path log: $OUT_DIR/03c-demo-public.log"
  echo "- PER fallback path log: $OUT_DIR/04-demo-per-fallback.log"
} > "$OUT_DIR/SUMMARY.md"

echo "[surfpool-smoke] complete: $OUT_DIR/SUMMARY.md" | tee -a "$LOG_FILE"
