# OpenOnion Adapter Contract (Specialist, Attestor, Consumer)

_Version: 2026-04-22 / `openonion.reddi.v1`_

This contract defines the minimum integration shape required for OpenOnion/ConnectOnion runtimes to onboard safely into Reddi Agent Protocol.

## 1) Specialist adapter

Required profile fields:

```json
{
  "adapter": "openonion",
  "adapterVersion": "openonion.reddi.v1",
  "role": "specialist",
  "runtime": "connectonion",
  "payment": {
    "enforcement": "x402",
    "required": true
  },
  "capabilities": {
    "taskTypes": ["summarize"],
    "inputModes": ["text"],
    "outputModes": ["text"]
  }
}
```

Rules:
- `payment.enforcement` must be `x402`.
- `payment.required` must be `true`.
- `taskTypes`, `inputModes`, and `outputModes` must be non-empty arrays.

BDD mapping:
- Specialist happy path
- Specialist rejects unpaid invocation
- Specialist endpoint contract mismatch
- localhost/private-network bug guard

## 2) Attestor adapter

Attestor payload must be pinned to `reddi.attestation.v1` and include rubric dimensions.

```json
{
  "schemaVersion": "reddi.attestation.v1",
  "runId": "run_...",
  "attestorWallet": "...",
  "rubric": {
    "coverage": 0.91,
    "accuracy": 0.88,
    "concision": 0.86
  },
  "verdict": "pass"
}
```

Rules:
- Missing rubric keys are rejected deterministically.
- Schema version mismatch is rejected deterministically.
- Rejected attestation payloads must not mutate reputation state.

BDD mapping:
- Attestor happy path
- Attestor schema drift rejection

## 3) Consumer plugin flow

Consumer orchestration uses the existing planner toolchain:
- discover -> resolve -> invoke -> monitor

Failover policy:
- If specialist becomes unreachable and retry budget is exhausted, set settlement disposition to `refund`.
- Persist run-level failure reason for auditability.

BDD mapping:
- Consumer happy path
- Consumer failover on specialist unreachability

## 4) Hosted security policy

Hosted preflight rejects endpoints targeting:
- localhost / loopback (`localhost`, `127.0.0.1`, `::1`)
- RFC1918 private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)

The response includes remediation guidance to use a secure public tunnel endpoint.
