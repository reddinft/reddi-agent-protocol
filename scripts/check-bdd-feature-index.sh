#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FEATURE_DIR="$ROOT_DIR/docs/bdd/features"
INDEX_FILE="$ROOT_DIR/docs/bdd/FEATURE-INDEX.md"

if [ ! -d "$FEATURE_DIR" ]; then
  echo "[bdd-index-check] missing feature directory: $FEATURE_DIR"
  exit 1
fi

if [ ! -f "$INDEX_FILE" ]; then
  echo "[bdd-index-check] missing index file: $INDEX_FILE"
  exit 1
fi

missing=0
while IFS= read -r feature; do
  rel="docs/bdd/features/$feature"
  if ! grep -Fq "$rel" "$INDEX_FILE"; then
    echo "[bdd-index-check] missing from index: $rel"
    missing=1
  fi
done < <(find "$FEATURE_DIR" -maxdepth 1 -type f -name '*.feature' -print | xargs -n1 basename | sort)

if [ "$missing" -ne 0 ]; then
  echo "[bdd-index-check] FAILED"
  exit 1
fi

echo "[bdd-index-check] OK: all feature files are indexed"
