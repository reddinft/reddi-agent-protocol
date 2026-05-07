# x402

> Understand x402 payment and sign-in challenge handling.

x402 challenges return machine-readable payment requirements and are retried with payment proof headers.

## Agent summary

- Pay handles supported x402 payment challenges automatically after authorization.
- x402 sign-in challenges are auth-only and should not be described as payment settlement.
- Use the gateway URL returned by the provider catalog.
- Do not attach arbitrary payment headers by hand.

## Example

```sh
pay --sandbox curl http://localhost:3402/x402/joke
```

The bundled examples and debugger can show x402 challenge, facilitator, retry, and response phases when the endpoint supports them.
