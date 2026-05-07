# Write a provider spec

> Define routing, allowed endpoints, pricing, currencies, and operator settings.

A provider spec is the runtime contract for the gateway. It defines what the gateway exposes and how paid endpoints are priced.

`pay server start <spec.yml>` reads one YAML file and uses it for routing, payment recipients, currencies, endpoint allowlists, pricing, and runtime operator settings.

## Agent summary

- Treat `endpoints[]` as both pricing config and an allowlist.
- Omit `metering` for free endpoints.
- Keep upstream credentials in environment variables.
- Use `operator.network: localnet` for sandbox testing and `mainnet` for production.
- Use `routing.type: proxy` for a real upstream API and `routing.type: respond` only for demos or smoke tests.

## Scaffold

```sh
pay server scaffold provider.yml
```

## Minimal proxy spec

```yaml
name: my-api
subdomain: my-api
title: 'My API'
description: 'Paid API for normalized search results.'
category: data
version: v1
routing:
  type: proxy
  url: https://api.example.com/
operator:
  currencies:
    usd: ['USDC', 'USDT']
  network: localnet
  fee_payer: true
endpoints:
  - method: POST
    path: 'v1/search'
    resource: 'search'
    description: 'Search records by keyword and return normalized matches.'
    metering:
      dimensions:
        - direction: usage
          unit: requests
          scale: 1
          tiers:
            - price_usd: 0.01
```

Test the spec with a plain request and a paid request:

```sh
pay --sandbox server start provider.yml --bind 127.0.0.1:1402
curl -i http://127.0.0.1:1402/v1/search
pay --sandbox curl http://127.0.0.1:1402/v1/search
```

The plain request should receive `402 Payment Required`. The `pay --sandbox curl` request should pay, retry with proof, and receive the upstream response.

## Core fields

| Field         | Required | Description                                                                                               |
| ------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `name`        | Yes      | Machine-readable API name.                                                                                |
| `subdomain`   | Yes      | API subdomain identifier for multi-provider gateway contexts.                                             |
| `title`       | Yes      | Human-readable API title.                                                                                 |
| `description` | Yes      | Human-readable API description.                                                                           |
| `category`    | Yes      | Provider category such as `ai_ml`, `search`, `maps`, `data`, `compute`, or `productivity`.                |
| `version`     | Yes      | API version label, such as `v1`.                                                                          |
| `routing`     | Yes      | How the gateway handles a verified request.                                                               |
| `endpoints`   | Yes      | Allowlisted endpoint definitions. Unlisted paths return 404 from the gateway.                             |
| `operator`    | No       | Payment operator configuration, including currencies, network, recipient, RPC URL, fee payer, and signer. |
| `recipients`  | No       | Named recipient aliases for split payments.                                                               |
| `session`     | No       | Enables MPP session payments for capped repeated-call authorization.                                      |

## Routing auth

Inject upstream credentials only after payment verification:

```yaml
routing:
  type: proxy
  url: https://api.example.com/
  auth:
    method: header
    key: 'authorization'
    prefix: 'Bearer '
    value_from_env: EXAMPLE_API_TOKEN
```

Supported auth shapes include query parameter auth, header auth, and OAuth2 token fetching. Keep secret values in environment variables or a deployment secret manager, not in the spec file.
