#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT_DIR/artifacts/source-conformance-matrix/$TS"
LOG_FILE="$OUT_DIR/matrix.log"
SUMMARY="$OUT_DIR/SUMMARY.md"
mkdir -p "$OUT_DIR"

SOURCES=(openclaw hermes pi)

run_source() {
  local src="$1"

  {
    echo ""
    echo "[source-matrix] >>> $src smoke"
    ./scripts/run-source-conformance.sh --source "$src" --mode smoke
  } 2>&1 | tee -a "$LOG_FILE"

  local code=${PIPESTATUS[0]}
  local latest_summary
  latest_summary="$(find "$ROOT_DIR/artifacts/source-conformance" -maxdepth 1 -type d -name "*-${src}-smoke" | sort | tail -1)/SUMMARY.md"

  if [ "$code" -eq 0 ]; then
    printf "PASS\t%s\t%s\n" "$src" "$latest_summary" >> "$OUT_DIR/matrix.tsv"
  else
    printf "FAIL\t%s\t%s\n" "$src" "$latest_summary" >> "$OUT_DIR/matrix.tsv"
  fi

  return 0
}

for src in "${SOURCES[@]}"; do
  run_source "$src"
done

PASS_COUNT=$(awk -F'\t' 'BEGIN{c=0} $1=="PASS"{c++} END{print c}' "$OUT_DIR/matrix.tsv" 2>/dev/null || printf '0')
FAIL_COUNT=$(awk -F'\t' 'BEGIN{c=0} $1=="FAIL"{c++} END{print c}' "$OUT_DIR/matrix.tsv" 2>/dev/null || printf '0')
TOTAL_COUNT=$((PASS_COUNT + FAIL_COUNT))

{
  echo "# Source Conformance Matrix"
  echo ""
  echo "- Timestamp: $TS"
  echo "- Sources: openclaw, hermes, pi"
  echo "- Rows passed: $PASS_COUNT"
  echo "- Rows failed: $FAIL_COUNT"
  echo "- Rows total: $TOTAL_COUNT"
  echo ""
  echo "| Status | Source | Summary |"
  echo "|---|---|---|"
  while IFS=$'\t' read -r status source summary; do
    [ -n "$status" ] || continue
    echo "| $status | $source | $summary |"
  done < "$OUT_DIR/matrix.tsv"
  echo ""
  echo "- Log: $LOG_FILE"
  echo "- Matrix table source: $OUT_DIR/matrix.tsv"
} > "$SUMMARY"

echo "[source-matrix] summary: $SUMMARY"

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
