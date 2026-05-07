# HTTP 402 lifecycle

> Trace request, challenge, approval, payment proof, retry, and response.

The 402 lifecycle is the same shape for client and agent calls.

## Agent summary

- First request the resource normally.
- Let pay parse the 402 challenge.
- Authorize locally when payment is required.
- Retry with the proof produced by pay.
- Return the final API response.

## Flow

```txt
client -> API: request resource
API -> client: 402 Payment Required
pay -> wallet: request local authorization
pay -> API: retry with payment proof
API -> client: 200 OK
```

## Runnable check

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```
