#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

SOURCE="openclaw"
MODE="smoke"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --source)
      SOURCE="${2:-}"
      shift 2
      ;;
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown arg: $1"
      exit 1
      ;;
  esac
done

case "$SOURCE" in
  openclaw|hermes|pi)
    ;;
  *)
    echo "Unsupported source: $SOURCE (allowed: openclaw|hermes|pi)"
    exit 1
    ;;
esac

case "$MODE" in
  smoke|full)
    ;;
  *)
    echo "Unsupported mode: $MODE (allowed: smoke|full)"
    exit 1
    ;;
esac

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/artifacts/source-conformance/${TS}-${SOURCE}-${MODE}"
LOG_FILE="$OUT_DIR/conformance.log"
STEPS_FILE="$OUT_DIR/steps.tsv"
mkdir -p "$OUT_DIR"

FAILED_STEPS=0

run_step() {
  local label="$1"
  shift

  {
    echo ""
    echo "[source-conformance] >>> $label"
    "$@"
  } 2>&1 | tee -a "$LOG_FILE"

  local code=${PIPESTATUS[0]}
  if [ "$code" -eq 0 ]; then
    printf "PASS\t%s\n" "$label" >> "$STEPS_FILE"
  else
    printf "FAIL\t%s\n" "$label" >> "$STEPS_FILE"
    FAILED_STEPS=$((FAILED_STEPS + 1))
  fi

  return 0
}

echo "[source-conformance] source=$SOURCE mode=$MODE"
echo "[source-conformance] artifacts=$OUT_DIR"

run_step "BDD feature index integrity" \
  ./scripts/check-bdd-feature-index.sh

run_step "Source adapter schema + probe contracts" \
  npx jest lib/__tests__/source-adapter-schema.test.ts lib/__tests__/register-probe-route.test.ts --runInBand

if [ "$MODE" = "full" ]; then
  run_step "Representative BDD bucket sweep" \
    ./scripts/run-bdd-bucket-sweep.sh
fi

run_step "Build safety gate" \
  pnpm build

PASS_COUNT=$(awk -F'\t' 'BEGIN{c=0} $1=="PASS"{c++} END{print c}' "$STEPS_FILE" 2>/dev/null || printf '0')
FAIL_COUNT=$(awk -F'\t' 'BEGIN{c=0} $1=="FAIL"{c++} END{print c}' "$STEPS_FILE" 2>/dev/null || printf '0')
TOTAL_COUNT=$((PASS_COUNT + FAIL_COUNT))

{
  echo "# Source Conformance Summary"
  echo ""
  echo "- Timestamp: $TS"
  echo "- Source: $SOURCE"
  echo "- Mode: $MODE"
  echo "- Output dir: $OUT_DIR"
  echo "- Steps passed: $PASS_COUNT"
  echo "- Steps failed: $FAIL_COUNT"
  echo "- Steps total: $TOTAL_COUNT"
  echo ""
  echo "## Step Results"
  echo ""
  echo "| Status | Step |"
  echo "|---|---|"
  if [ -f "$STEPS_FILE" ]; then
    while IFS=$'\t' read -r status label; do
      [ -n "$status" ] || continue
      echo "| $status | $label |"
    done < "$STEPS_FILE"
  fi
  echo ""
  echo "## Artifacts"
  echo "- Log: $LOG_FILE"
  echo "- Step status table source: $STEPS_FILE"
} > "$OUT_DIR/SUMMARY.md"

if [ "$FAILED_STEPS" -gt 0 ]; then
  echo "[source-conformance] complete with failures ($FAILED_STEPS)"
  echo "[source-conformance] summary: $OUT_DIR/SUMMARY.md"
  exit 1
fi

echo "[source-conformance] complete: all steps green"
echo "[source-conformance] summary: $OUT_DIR/SUMMARY.md"
