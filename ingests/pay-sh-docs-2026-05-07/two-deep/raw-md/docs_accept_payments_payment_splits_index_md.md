# Payment splits

> Distribute payment revenue across named recipients.

Splits distribute payment revenue to named recipients while the primary recipient still receives a positive amount.

## Agent summary

- Define every split recipient in the top-level `recipients` map.
- Use exactly one of `amount` or `percent` per split.
- Keep total splits below the minimum per-unit price.
- Use per-tier split overrides only when tiers need different distribution.

## Example

```yaml
recipients:
  partner:
    account: '${PARTNER_WALLET}'
    label: 'Partner'

endpoints:
  - method: POST
    path: 'v1/report'
    metering:
      dimensions:
        - direction: usage
          unit: requests
          scale: 1
          tiers:
            - price_usd: 0.10
      splits:
        - recipient: partner
          percent: 20
          memo: 'Partner revenue share'
```
