# Session payments

> Use MPP sessions for repeated calls under a capped authorization.

Session payments are for repeated calls under a capped authorization. Use this wording instead of "streamed payments" unless the product flow is explicitly a stream.

## Agent summary

- Present sessions as capped repeated-call authorization.
- Do not promise streaming semantics unless the API and payment flow provide them.
- Show session status, signatures, or proof details only when the gateway returns them.

## Runtime field

```yaml
session:
  cap_usdc: 1.00
```

## Client behavior

When a server returns an MPP session challenge, pay opens a session and retries with session authorization when auto-pay is enabled by sandbox, agent mode, or approved capped payment behavior.
