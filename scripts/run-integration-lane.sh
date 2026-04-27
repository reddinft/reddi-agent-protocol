#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

probe_ollama() {
  local raw=""
  raw="$(curl -s --max-time 4 http://localhost:11434/api/tags || true)"
  if [ -z "$raw" ]; then
    echo "down|"
    return
  fi

  local model
  model="$(OLLAMA_RAW="$raw" python3 - <<'PY'
import json, os
raw = os.environ.get("OLLAMA_RAW", "")
try:
    data = json.loads(raw)
    models = data.get("models") or []
    if not models:
        print("")
    else:
        first = models[0]
        if isinstance(first, dict):
            print(first.get("name", ""))
        else:
            print(str(first))
except Exception:
    print("")
PY
)"

  if [ -n "$model" ]; then
    echo "up|$model"
  else
    echo "down|"
  fi
}

probe_validator() {
  local health
  health="$(curl -s --max-time 4 -X POST http://localhost:8899 \
    -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' || true)"

  if printf "%s" "$health" | grep -q '"result"[[:space:]]*:[[:space:]]*"ok"'; then
    echo "up"
  else
    echo "down"
  fi
}

TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${ROOT_DIR}/artifacts/integration-lane/${TS}"
mkdir -p "$OUT_DIR"

echo "[integration-lane] output: $OUT_DIR"

OLLAMA_PROBE="$(probe_ollama)"
OLLAMA_STATUS="${OLLAMA_PROBE%%|*}"
OLLAMA_MODEL="${OLLAMA_PROBE#*|}"
VALIDATOR_STATUS="$(probe_validator)"

set +e
npx playwright test e2e/integration.spec.ts \
  --reporter=line,json \
  --output="$OUT_DIR/test-output" \
  > "$OUT_DIR/playwright.log" 2>&1
EXIT_CODE=$?
set -e

JSON_REPORT="playwright-report.json"
if [ -f "$JSON_REPORT" ]; then
  mv "$JSON_REPORT" "$OUT_DIR/report.json"
fi

SKIPPED_COUNT=$(grep -Eo "[0-9]+ skipped" "$OUT_DIR/playwright.log" | tail -1 | awk '{print $1}' || echo "0")
PASSED_COUNT=$(grep -Eo "[0-9]+ passed" "$OUT_DIR/playwright.log" | tail -1 | awk '{print $1}' || echo "0")
FAILED_COUNT=$(grep -Eo "[0-9]+ failed" "$OUT_DIR/playwright.log" | tail -1 | awk '{print $1}' || echo "0")
INFRA_HINT=$(grep -E "Integration tests skipped|Infra ready" "$OUT_DIR/playwright.log" | tail -1 || true)
LOG_SELECTED_MODEL="$(printf "%s" "$INFRA_HINT" | sed -n 's/.*Ollama model: \([^,\"]*\).*/\1/p')"
MODEL_SOURCE_NOTE="probe"
if [ -n "${LOG_SELECTED_MODEL:-}" ]; then
  MODEL_SOURCE_NOTE="playwright"
fi
FINAL_MODEL="${LOG_SELECTED_MODEL:-${OLLAMA_MODEL:-n/a}}"
MODEL_MISMATCH="no"
if [ -n "${LOG_SELECTED_MODEL:-}" ] && [ -n "${OLLAMA_MODEL:-}" ] && [ "$LOG_SELECTED_MODEL" != "$OLLAMA_MODEL" ]; then
  MODEL_MISMATCH="yes"
fi

cat > "$OUT_DIR/SUMMARY.md" <<EOF
# Integration Lane Summary

- Timestamp: ${TS}
- Exit code: ${EXIT_CODE}
- Passed: ${PASSED_COUNT}
- Skipped: ${SKIPPED_COUNT}
- Failed: ${FAILED_COUNT}

## Infra Readiness Snapshot (pre-run)
- Ollama: ${OLLAMA_STATUS}
- Ollama model (probe): ${OLLAMA_MODEL:-n/a}
- Ollama model (selected by tests): ${LOG_SELECTED_MODEL:-n/a}
- Ollama model (effective summary): ${FINAL_MODEL}
- Model source: ${MODEL_SOURCE_NOTE}
- Model probe/selection mismatch: ${MODEL_MISMATCH}
- Local validator (8899): ${VALIDATOR_STATUS}
- Playwright infra hint: ${INFRA_HINT:-n/a}

## Artifacts
- Log:
  - ${OUT_DIR}/playwright.log
- JSON report:
  - ${OUT_DIR}/report.json

## Interpretation
- If all tests are skipped, prerequisites were unavailable or not ready.
- If tests pass, this lane provides runtime-backed evidence beyond route/unit contracts.
EOF

if [ "$EXIT_CODE" -ne 0 ]; then
  echo "[integration-lane] FAILED (see $OUT_DIR/SUMMARY.md)"
  exit "$EXIT_CODE"
fi

echo "[integration-lane] complete (see $OUT_DIR/SUMMARY.md)"
