# HTTP clients

> Reference for pay curl, pay fetch, and pay wget.

HTTP client commands make requests and handle recognized HTTP 402 payment challenges.

## Agent summary

- Preserve the URL, method, headers, and body selected by the user or provider catalog.
- Use `curl` for general requests.
- Use `fetch` for simple built-in requests.
- Use `wget` for download-shaped calls.

## pay curl

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
pay --sandbox curl https://example.gateway/v1/search -H 'content-type: application/json' -d '{"query":"test"}'
```

All arguments after `curl` are forwarded to the real `curl` binary.

## pay fetch

```sh
pay --sandbox fetch https://payment-debugger.vercel.app/mpp/quote/AAPL
pay --sandbox fetch https://example.gateway/v1/search -H 'content-type: application/json'
```

`pay fetch` uses the built-in HTTP client and prints the response body.

## pay wget

```sh
pay --sandbox wget https://example.gateway/v1/export.csv
```

All arguments after `wget` are forwarded to the real `wget` binary.
