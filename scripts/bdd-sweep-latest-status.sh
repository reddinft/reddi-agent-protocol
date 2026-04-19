#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SWEEP_DIR="$ROOT_DIR/artifacts/bdd-sweep"

if [ ! -d "$SWEEP_DIR" ]; then
  echo "BDD_SWEEP_STATUS no_artifacts"
  exit 0
fi

LATEST_DIR="$(find "$SWEEP_DIR" -mindepth 1 -maxdepth 1 -type d | sort | tail -1)"
if [ -z "$LATEST_DIR" ]; then
  echo "BDD_SWEEP_STATUS no_artifacts"
  exit 0
fi

SUMMARY="$LATEST_DIR/SUMMARY.md"
if [ ! -f "$SUMMARY" ]; then
  echo "BDD_SWEEP_STATUS missing_summary dir=$(basename "$LATEST_DIR")"
  exit 0
fi

TS="$(grep -E '^- Timestamp:' "$SUMMARY" | head -1 | sed -E 's/^- Timestamp:[[:space:]]*//')"
PASS="$(grep -E '^- Steps passed:' "$SUMMARY" | head -1 | sed -E 's/^- Steps passed:[[:space:]]*//')"
FAIL="$(grep -E '^- Steps failed:' "$SUMMARY" | head -1 | sed -E 's/^- Steps failed:[[:space:]]*//')"
TOTAL="$(grep -E '^- Steps total:' "$SUMMARY" | head -1 | sed -E 's/^- Steps total:[[:space:]]*//')"

TS="${TS:-unknown}"
PASS="${PASS:-0}"
FAIL="${FAIL:-0}"
TOTAL="${TOTAL:-0}"

if [ "$FAIL" = "0" ]; then
  echo "BDD_SWEEP_STATUS ok ts=$TS passed=$PASS/$TOTAL failed=$FAIL summary=$SUMMARY"
else
  echo "BDD_SWEEP_STATUS fail ts=$TS passed=$PASS/$TOTAL failed=$FAIL summary=$SUMMARY"
fi
