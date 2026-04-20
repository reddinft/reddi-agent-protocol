# Onboarding Attestation Operator, Setup and Recovery

This guide fixes Step 7 in `/onboarding` when attestation says the operator key is not configured.

## Required env var

Set:

`ONBOARDING_ATTEST_OPERATOR_SECRET_KEY`

Value format must be a JSON byte array with **64 numbers**.

Example:

`[12,34,56,...]`

## Local setup

1. Generate a dedicated devnet operator keypair (or reuse one).
2. Put the secret key array into `ONBOARDING_ATTEST_OPERATOR_SECRET_KEY`.
3. Restart the app server.
4. In onboarding Step 7, click **Check attestor key status**.

## Validation

`GET /api/onboarding/attestation-operator`

Expected success shape:

```json
{
  "ok": true,
  "result": {
    "ready": true,
    "operatorPubkey": "...",
    "note": "Operator signer is configured."
  }
}
```

## Recovery checklist

If status is not ready:

- Confirm env var is present in the same process that runs Next.js.
- Confirm the value is valid JSON.
- Confirm array length is exactly 64.
- Restart the server after changes.
- Re-run the status check.

## Notes

- This operator key only signs onboarding attestation transactions.
- Use a dedicated key for onboarding, not your primary wallet.
