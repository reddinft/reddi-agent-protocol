# Onboarding Attestation Operator Key Rotation Runbook (E2.2)

## Purpose
Rotate `ONBOARDING_ATTEST_OPERATOR_SECRET_KEY` safely and verify onboarding attestation paths stay healthy.

## When to rotate
- Credential exposure suspicion
- Scheduled credential hygiene
- Team/operator handoff

## Procedure

1. Generate new operator keypair
   - Use a secure local process and keep secret key out of logs/history.
2. Encode as JSON byte array (64 bytes)
   - Required format: `[12,34,...]`
3. Update runtime secret
   - Set `ONBOARDING_ATTEST_OPERATOR_SECRET_KEY` in environment/secret manager.
4. Restart app/runtime so new env is loaded.

## Verification checklist

1. Operator key status route
   - `GET /api/onboarding/operator-key`
   - Expect: `{ present: true, valid: true, state: "ready", publicKey_suffix: "...", checkedAt: "..." }`
2. Attestation operator status route
   - `GET /api/onboarding/attestation-operator`
   - Expect: `{ ready: true, state: "ready", operatorPubkey: "...", checkedAt: "..." }`
3. Onboarding attestation dry validation
   - In onboarding Step 7, run operator status check (no submission yet)
   - Expect explicit ready state in UI note
4. Full attestation submission smoke
   - Submit one devnet attestation
   - Confirm tx signature present and explorer link resolves

## Failure modes and remediation

- `not set` / `Missing ONBOARDING_ATTEST_OPERATOR_SECRET_KEY`
  - Secret missing in runtime environment; set and restart.
- `Expected 64-byte array`
  - Wrong format/length; ensure 64-byte JSON array.
- `must be a JSON byte array`
  - Secret is not JSON array string; convert before setting.

## Automated guardrails
- Tests: `lib/__tests__/operator-key-rotation.test.ts`
  - missing key detection
  - invalid format detection
  - valid key acceptance and pubkey suffix verification
  - attestation operator readiness helper verification

## Post-rotation audit note
Record rotation time and operator pubkey suffix in project status/memory for traceability.
