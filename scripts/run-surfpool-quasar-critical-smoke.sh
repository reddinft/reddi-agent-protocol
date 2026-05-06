#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[surfpool-quasar-smoke] missing required command: $1" >&2
    exit 1
  fi
}

require_cmd surfpool
require_cmd solana
require_cmd npm
require_cmd "$HOME/.cargo/bin/cargo"

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/artifacts/surfpool-quasar-smoke/$TS"
LOG_FILE="$OUT_DIR/surfpool-quasar-smoke.log"
mkdir -p "$OUT_DIR"

PORT="${SURFPOOL_PORT:-19099}"
WS_PORT="${SURFPOOL_WS_PORT:-19100}"
RPC_URL="http://127.0.0.1:${PORT}"
SURFPOOL_LOG="$OUT_DIR/surfpool.log"
SURFPOOL_PID=""

restore_declared_ids() {
  if [ -d "$OUT_DIR/source-backup" ]; then
    cp "$OUT_DIR/source-backup/quasar-escrow-lib.rs" experiments/quasar-escrow/src/lib.rs 2>/dev/null || true
    cp "$OUT_DIR/source-backup/quasar-registry-lib.rs" experiments/quasar-registry/src/lib.rs 2>/dev/null || true
    cp "$OUT_DIR/source-backup/quasar-reputation-lib.rs" experiments/quasar-reputation/src/lib.rs 2>/dev/null || true
    cp "$OUT_DIR/source-backup/quasar-attestation-lib.rs" experiments/quasar-attestation/src/lib.rs 2>/dev/null || true
  fi
}

cleanup() {
  restore_declared_ids

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
    echo "[surfpool-quasar-smoke] >>> $label"
    "$@"
  } 2>&1 | tee -a "$LOG_FILE"

  local code=${PIPESTATUS[0]}
  if [ "$code" -ne 0 ]; then
    echo "[surfpool-quasar-smoke] FAIL: $label (code=$code)" | tee -a "$LOG_FILE"
    exit "$code"
  fi
}

programs=(
  "quasar-escrow:quasar_escrow_poc"
  "quasar-registry:quasar_registry"
  "quasar-reputation:quasar_reputation"
  "quasar-attestation:quasar_attestation"
)

{
  echo "[surfpool-quasar-smoke] starting Quasar critical scenario lane"
  echo "[surfpool-quasar-smoke] output: $OUT_DIR"
  echo "[surfpool-quasar-smoke] rpc: $RPC_URL"
} | tee "$LOG_FILE"

run_step "Start Surfpool" bash -lc "
  surfpool start --ci --legacy-anchor-compatibility -y --offline \
    --port ${PORT} --ws-port ${WS_PORT} --no-studio --no-tui --log-level info \
    > '${SURFPOOL_LOG}' 2>&1 &
  echo \$! > '${OUT_DIR}/surfpool.pid'
"
SURFPOOL_PID="$(cat "$OUT_DIR/surfpool.pid")"

for i in {1..40}; do
  if solana cluster-version --url "$RPC_URL" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
  if [ "$i" -eq 40 ]; then
    echo "[surfpool-quasar-smoke] Surfpool RPC did not become ready" | tee -a "$LOG_FILE"
    exit 1
  fi
done

run_step "Capture versions" bash -lc "
  set -euo pipefail
  surfpool --version | tee '${OUT_DIR}/00-surfpool-version.log'
  solana --version | tee '${OUT_DIR}/00-solana-version.log'
  ~/.cargo/bin/cargo build-sbf --version | tee '${OUT_DIR}/00-cargo-build-sbf-version.log'
"

mkdir -p "$OUT_DIR/source-backup"
cp experiments/quasar-escrow/src/lib.rs "$OUT_DIR/source-backup/quasar-escrow-lib.rs"
cp experiments/quasar-registry/src/lib.rs "$OUT_DIR/source-backup/quasar-registry-lib.rs"
cp experiments/quasar-reputation/src/lib.rs "$OUT_DIR/source-backup/quasar-reputation-lib.rs"
cp experiments/quasar-attestation/src/lib.rs "$OUT_DIR/source-backup/quasar-attestation-lib.rs"

ensure_program_keypair() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  if [ ! -f "$path" ]; then
    solana-keygen new --no-bip39-passphrase --silent -o "$path" >/dev/null
  fi
}

ensure_program_keypair experiments/quasar-escrow/target/deploy/quasar_escrow_poc-keypair.json
ensure_program_keypair experiments/quasar-registry/target/deploy/quasar_registry-keypair.json
ensure_program_keypair experiments/quasar-reputation/target/deploy/quasar_reputation-keypair.json
ensure_program_keypair experiments/quasar-attestation/target/deploy/quasar_attestation-keypair.json

patch_declared_id() {
  local src="$1"
  local keypair="$2"
  local program_id
  program_id="$(solana address -k "$keypair")"
  python3 - "$src" "$program_id" <<'PY'
from pathlib import Path
import re, sys
p = Path(sys.argv[1])
program_id = sys.argv[2]
text = p.read_text()
text = re.sub(r'declare_id!\("[^"]+"\);', f'declare_id!("{program_id}");', text, count=1)
p.write_text(text)
PY
}

# Local Surfpool deploys use generated local program keypairs. Quasar Account<T>
# owner checks compare against declare_id!, so patch declare_id locally before
# building and restore sources on exit. This keeps devnet source IDs unchanged.
patch_declared_id experiments/quasar-escrow/src/lib.rs experiments/quasar-escrow/target/deploy/quasar_escrow_poc-keypair.json
patch_declared_id experiments/quasar-registry/src/lib.rs experiments/quasar-registry/target/deploy/quasar_registry-keypair.json
patch_declared_id experiments/quasar-reputation/src/lib.rs experiments/quasar-reputation/target/deploy/quasar_reputation-keypair.json
patch_declared_id experiments/quasar-attestation/src/lib.rs experiments/quasar-attestation/target/deploy/quasar_attestation-keypair.json

run_step "Build Quasar programs" bash -lc "
  set -euo pipefail
  export PATH=\"$HOME/.cargo/bin:\$PATH\"
  for manifest in experiments/quasar-escrow/Cargo.toml experiments/quasar-registry/Cargo.toml experiments/quasar-reputation/Cargo.toml experiments/quasar-attestation/Cargo.toml; do
    cargo build-sbf --manifest-path \"\$manifest\"
  done | tee '${OUT_DIR}/01-cargo-build-sbf.log'
"

UPGRADE_AUTHORITY="$HOME/.config/solana/blitz-dev.json"
run_step "Fund upgrade authority" bash -lc "
  set -euo pipefail
  solana airdrop 10 --url '${RPC_URL}' \"$(solana address -k "$UPGRADE_AUTHORITY")\" | tee '${OUT_DIR}/02a-upgrade-airdrop.log'
  solana balance --url '${RPC_URL}' \"$(solana address -k "$UPGRADE_AUTHORITY")\" | tee '${OUT_DIR}/02b-upgrade-balance.log'
"

for entry in "${programs[@]}"; do
  dir="${entry%%:*}"
  stem="${entry##*:}"
  so="experiments/${dir}/target/deploy/${stem}.so"
  keypair="experiments/${dir}/target/deploy/${stem}-keypair.json"
  program_id="$(solana address -k "$keypair")"
  safe_name="${dir#quasar-}"
  run_step "Deploy ${dir} to Surfpool local RPC" bash -lc "
    set -euo pipefail
    solana program deploy '${so}' \
      --program-id '${keypair}' \
      --url '${RPC_URL}' \
      --keypair '${UPGRADE_AUTHORITY}' \
      | tee '${OUT_DIR}/02-${safe_name}-deploy.log'
  "
  case "$dir" in
    quasar-escrow) ESCROW_PROGRAM_ID="$program_id" ;;
    quasar-registry) REGISTRY_PROGRAM_ID="$program_id" ;;
    quasar-reputation) REPUTATION_PROGRAM_ID="$program_id" ;;
    quasar-attestation) ATTESTATION_PROGRAM_ID="$program_id" ;;
  esac
done

COMMON_ENV=(
  "DEMO_PROGRAM_TARGET=quasar"
  "HACKATHON_DEMO_TARGET=quasar"
  "DEMO_DEVNET_RPC=${RPC_URL}"
  "DEMO_ESCROW_PROGRAM_ID=${ESCROW_PROGRAM_ID}"
  "DEMO_REGISTRY_PROGRAM_ID=${REGISTRY_PROGRAM_ID}"
  "DEMO_REPUTATION_PROGRAM_ID=${REPUTATION_PROGRAM_ID}"
  "DEMO_ATTESTATION_PROGRAM_ID=${ATTESTATION_PROGRAM_ID}"
)

run_step "Demo scenario A: Quasar public settlement on Surfpool" bash -lc "
  set -euo pipefail
  cd packages/demo-agents
  env ${COMMON_ENV[*]} DEMO_SETTLEMENT_MODE=public DEMO_STOP_AFTER_SETTLEMENT=true npm run fund | tee '${OUT_DIR}/03a-fund-public.log'
  env ${COMMON_ENV[*]} npm run register | tee '${OUT_DIR}/03b-register-public.log'
  env ${COMMON_ENV[*]} DEMO_SETTLEMENT_MODE=public DEMO_STOP_AFTER_SETTLEMENT=true npm run demo | tee '${OUT_DIR}/03c-demo-public.log'
"

run_step "Demo scenario B: Quasar PER requested + fail-closed/fallback boundary" bash -lc "
  set -euo pipefail
  cd packages/demo-agents
  env ${COMMON_ENV[*]} DEMO_PER_RPC='http://127.0.0.1:65535' DEMO_SETTLEMENT_MODE=auto DEMO_ALLOW_FALLBACK=true DEMO_STOP_AFTER_SETTLEMENT=true npm run demo | tee '${OUT_DIR}/04-demo-per-fallback.log'
"

{
  echo "# Surfpool Quasar Critical Scenario Smoke Summary"
  echo ""
  echo "- Timestamp: $TS"
  echo "- RPC: $RPC_URL"
  echo "- Target: quasar"
  echo "- Escrow program: ${ESCROW_PROGRAM_ID}"
  echo "- Registry program: ${REGISTRY_PROGRAM_ID}"
  echo "- Reputation program: ${REPUTATION_PROGRAM_ID}"
  echo "- Attestation program: ${ATTESTATION_PROGRAM_ID}"
  echo "- Scenario A: Quasar public settlement on Surfpool localnet ✅"
  echo "- Scenario B: Quasar PER requested with unreachable PER RPC, fallback boundary exercised ✅"
  echo ""
  echo "## Artifacts"
  echo "- Main log: $LOG_FILE"
  echo "- Surfpool log: $SURFPOOL_LOG"
  echo "- Public path log: $OUT_DIR/03c-demo-public.log"
  echo "- PER fallback path log: $OUT_DIR/04-demo-per-fallback.log"
} > "$OUT_DIR/SUMMARY.md"

echo "[surfpool-quasar-smoke] complete: $OUT_DIR/SUMMARY.md" | tee -a "$LOG_FILE"
