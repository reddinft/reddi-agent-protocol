#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="$ROOT/artifacts/dogfood-demo/$TS"
mkdir -p "$OUT_DIR"

echo "[dogfood-demo] root: $ROOT"
echo "[dogfood-demo] out:  $OUT_DIR"

cd "$ROOT"

{
  echo "# Dogfood Demo Capture"
  echo
  echo "- timestamp: $TS"
  echo "- command: npx playwright test e2e/dogfood.spec.ts"
  echo
} > "$OUT_DIR/SUMMARY.md"

npx playwright test e2e/dogfood.spec.ts 2>&1 | tee "$OUT_DIR/playwright.log"

{
  echo
  echo "## Result"
  echo
  echo "- playwright run completed"
  echo "- log: artifacts/dogfood-demo/$TS/playwright.log"
} >> "$OUT_DIR/SUMMARY.md"

# Gather generated media artifacts from test-results
if [ -d "$ROOT/test-results" ]; then
  find "$ROOT/test-results" -type f \( -name "*.mp4" -o -name "*.webm" -o -name "*.png" -o -name "trace.zip" \) -print0 \
    | while IFS= read -r -d '' f; do
        rel="${f#$ROOT/}"
        safe_rel="${rel//\//__}"
        cp "$f" "$OUT_DIR/$safe_rel"
      done
fi

COUNT=$(find "$OUT_DIR" -type f | wc -l | tr -d ' ')
{
  echo "- artifact files copied: $COUNT"
  echo
  echo "## Files"
  find "$OUT_DIR" -maxdepth 1 -type f -exec basename {} \; | sort | sed 's/^/- /'
} >> "$OUT_DIR/SUMMARY.md"

echo "[dogfood-demo] done"
echo "$OUT_DIR"

