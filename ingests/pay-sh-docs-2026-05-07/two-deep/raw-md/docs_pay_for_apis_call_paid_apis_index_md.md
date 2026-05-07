# Call paid APIs

> Wrap curl, fetch, or wget and let pay handle HTTP 402 challenges.

Use pay with the HTTP tool you already planned to use. pay forwards the request, detects supported 402 challenges, signs a proof after authorization, and retries.

## Agent summary

- Use `pay --sandbox curl` for examples and tests.
- Preserve method, headers, body, and gateway URL.
- Use `pay fetch` for simple JSON-friendly requests without an external client.
- Use `pay wget` only for download-shaped tasks.

## curl

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

Pass curl flags after `curl`:

```sh
pay --sandbox curl https://example.gateway/v1/search \
  -H 'content-type: application/json' \
  -d '{"query":"test"}'
```

## fetch

```sh
pay --sandbox fetch https://payment-debugger.vercel.app/mpp/quote/AAPL
pay --sandbox fetch https://example.gateway/v1/search -H 'content-type: application/json'
```

## wget

```sh
pay --sandbox wget https://example.gateway/v1/export.csv
```
