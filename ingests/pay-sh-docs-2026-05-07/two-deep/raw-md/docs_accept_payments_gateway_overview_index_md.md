# Gateway overview

> Understand the local payment gateway shape before writing a spec.

`pay server start <spec.yml>` loads a provider spec and starts an HTTP gateway.

You build a normal HTTP API. The pay gateway sits in front of it, returns HTTP 402 challenges for metered endpoints, verifies payment credentials, and forwards only verified paid traffic to the upstream API.

## Agent summary

- Metered endpoints return 402 before payment.
- Paid retries are verified before the upstream response is delivered.
- Free endpoints pass through without payment.
- Requests not listed in `endpoints[]` are not exposed by the gateway.
- The YAML configures the gateway; it does not run the upstream API unless `routing.type: respond` is used for a demo.

## Components

| Component               | Responsibility                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `pay` CLI or MCP server | Sends the user or agent request, handles HTTP 402 challenges, and retries with payment proof.                         |
| Payment gateway         | Public paid surface started with `pay server start <spec.yml>`.                                                       |
| Provider spec           | YAML source of truth for routing, endpoint allowlists, pricing, recipients, currencies, network, and signer settings. |
| Upstream API            | Your existing HTTP service behind the gateway.                                                                        |
| Pay Skills Registry     | Provider metadata that lets agents discover the gateway URL and endpoints.                                            |

## Runtime shape

```txt
client -> pay gateway: request
gateway -> client: 402 Payment Required
client -> wallet: local authorization
client -> gateway: retry with proof
gateway -> upstream: allowed paid request
gateway -> client: response
```

## Commands

```sh
pay server scaffold provider.yml
pay --sandbox server start provider.yml --debugger
```

## Demo gateway

```sh
pay --sandbox server demo
```

The demo scaffolds `./pay-demo.yaml`, starts a local sandbox gateway, and exposes several metered endpoints plus a free health endpoint. Call one metered endpoint from another terminal:

```sh
pay --sandbox curl -i http://127.0.0.1:1402/api/v1/reports/usage
```

Look for the HTTP status and `payment-receipt` header in the response. Decode receipt fields only when the response actually includes them.
