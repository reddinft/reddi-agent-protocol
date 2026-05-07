# MPP

> Understand Machine Payments Protocol charge and session challenges.

MPP challenges are usually expressed through `WWW-Authenticate` and retried with an authorization credential.

## Agent summary

- `mpp` charge challenges map to a single paid retry.
- `mpp-session` challenges map to capped repeated-call authorization.
- Pay selects compatible Solana charge challenges based on wallet and network.
- Do not parse or construct MPP credentials manually in docs examples.

## Charge flow

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

## Session language

Use "session payments" or "capped repeated calls" for MPP sessions. Avoid "streamed payments" unless the API and payment contract actually stream value or usage state.
