# Serve OpenAPI to agents

> Expose a filtered and rewritten API description from the payment gateway.

When the upstream API has OpenAPI 3 or Google Discovery JSON, the gateway can serve a filtered agent-facing document at `/openapi.json`.

## Agent summary

- The served document only describes endpoints listed in `endpoints[]`.
- Base URLs are rewritten to the gateway.
- Upstream auth metadata is stripped because the gateway handles upstream credentials.
- Use `--public-url` behind reverse proxies that alter host headers.

## Start with OpenAPI

```sh
pay server start provider.yml --openapi openapi.json
```

## Override public URL

```sh
pay server start provider.yml \
  --openapi openapi.json \
  --public-url https://gateway.example.com
```
