# Usage-metered payments

> Price endpoints by requests, tokens, characters, pages, bytes, or other units.

Use usage-metered pricing when the API naturally charges by a measured unit.

## Agent summary

- Use the unit that matches the provider's cost driver.
- Make scale explicit.
- Use tiers when larger usage should have a different unit price.
- Keep endpoint descriptions concrete enough for agents to choose correctly.

## Example

```yaml
metering:
  dimensions:
    - direction: usage
      unit: characters
      scale: 1000
      tiers:
        - price_usd: 0.01
```

Good units include `requests`, `tokens`, `characters`, `minutes`, `pages`, and `bytes` when they match the API behavior.
