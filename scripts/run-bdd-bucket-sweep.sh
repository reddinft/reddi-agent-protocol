#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "[bdd-sweep] starting representative per-bucket verification"

run_step() {
  local label="$1"
  shift
  echo ""
  echo "[bdd-sweep] >>> $label"
  "$@"
}

run_step "Bucket A (onboarding/operator gates)" \
  npx jest lib/__tests__/operator-key-rotation.test.ts lib/__tests__/onboarding-operator-status-routes.test.ts --runInBand

run_step "Bucket B (discovery + ranking contracts)" \
  npx jest lib/__tests__/registry-route.test.ts lib/__tests__/registry-bridge-sort.test.ts --runInBand

run_step "Bucket C (planner consumption contracts)" \
  npx jest lib/__tests__/planner-resolve-route.test.ts lib/__tests__/planner-invoke-route.test.ts lib/__tests__/planner-signal-route.test.ts --runInBand

run_step "Bucket D/E (security + reliability contracts)" \
  npx jest lib/__tests__/endpoint-security-compat.test.ts lib/__tests__/program-rpc-config.test.ts --runInBand

run_step "Bucket F (jupiter + payment contracts)" \
  npx jest lib/__tests__/jupiter-client.test.ts lib/__tests__/planner-invoke-route.test.ts --runInBand
run_step "Bucket F package payment contracts" \
  bash -lc 'cd packages/x402-solana && npm test -- --runInBand tests/payment.test.ts'

run_step "Bucket G (torque retention contracts)" \
  npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand

run_step "Bucket H (consumer orchestrator lifecycle contracts)" \
  npx jest lib/__tests__/planner-register-consumer-route.test.ts lib/__tests__/planner-tools-manifest-route.test.ts lib/__tests__/planner-resolve-attestor-route.test.ts lib/__tests__/planner-release-route.test.ts lib/__tests__/planner-auditability.test.ts --runInBand

echo ""
echo "[bdd-sweep] complete: representative per-bucket suite is green"
