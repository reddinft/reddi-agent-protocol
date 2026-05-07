# Accept Payments

> Run a payment gateway for an API and expose metered endpoints that agents can call.

pay can run a gateway in front of an API. The gateway returns HTTP 402 for metered endpoints, verifies payment proofs, and then serves or proxies the response.

## Agent summary

- Start with a sandbox gateway before production.
- Keep endpoint specs explicit: method, path, pricing, network, and currencies.
- Publish gateway URLs, not upstream provider URLs.
- Only show payment details that the gateway actually returns.

## Start paths

- [Gateway overview](/docs/accept-payments/gateway-overview): understand the runtime shape.
- [Write a provider spec](/docs/accept-payments/provider-spec): define the gateway YAML.
- [Debug payment flows](/docs/accept-payments/debugging): inspect challenge and retry behavior.

```sh
pay --sandbox server demo
```
