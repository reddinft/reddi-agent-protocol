# Per-request payments

> Charge once for a single metered API request.

Per-request pricing is the default model for simple paid endpoints.

## Agent summary

- Use `unit: requests` and `scale: 1`.
- Keep prices non-zero and compatible with token precision.
- Use simple per-request pricing unless another unit better matches the API.

## Example

```yaml
endpoints:
  - method: POST
    path: 'v1/generate'
    description: 'Generate content from a prompt.'
    metering:
      dimensions:
        - direction: usage
          unit: requests
          scale: 1
          tiers:
            - price_usd: 0.001
```

## Test

```sh
pay --sandbox server start provider.yml --debugger
pay --sandbox curl http://127.0.0.1:1402/v1/generate -d '{"prompt":"test"}'
```
