# Debug payment flows

> Use the payment debugger to inspect challenges, proofs, retries, and delivery.

The payment debugger visualizes each 402 challenge-response cycle as a sequence diagram.

## Agent summary

- Use the debugger for inspection, not arbitrary shell execution.
- Bind the gateway away from port `1402` when using the debugger proxy.
- Confirm that free endpoints pass through and metered endpoints return 402 before payment.

## Debugger proxy

```sh
EXAMPLE_API_KEY=... pay --sandbox server start provider.yml --bind 127.0.0.1:1403
pay --sandbox --debugger curl http://127.0.0.1:1403/v1/search -d '{"query":"test"}'
```

Open `http://127.0.0.1:1402/`.

## Embedded debugger

```sh
pay --sandbox server start provider.yml --debugger
pay --sandbox curl http://127.0.0.1:1402/v1/search -d '{"query":"test"}'
```
