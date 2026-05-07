# Publish to pay-skills

> Create and validate provider metadata so agents can discover the gateway.

Publish a provider entry when the gateway is ready for agent discovery.

## Agent summary

- Registry markdown is for discovery; runtime YAML is for `pay server start`.
- Include concrete endpoint descriptions and spend-aware usage notes.
- Omit pricing for free endpoints.
- Probe and validate changed providers before opening a PR.

## Build and probe

```sh
pay skills build . --output /tmp/pay-skills-dist
pay skills probe . --files providers/<operator>/<name>.md --currencies USDC,USDT
pay skills validate . --files providers/<operator>/<name>.md
```

## Convert runtime specs

```sh
pay skills provider sync providers/google/*.yml \
  --operator solana-foundation \
  --out providers
```

Agents discover published providers through `pay skills search` and Pay MCP `search_skills`.
