# Accept Payments
> Run a payment gateway and expose metered endpoints that agents can call.

- [Accept Payments](/docs/accept-payments/index.md): Run a payment gateway for an API and expose metered endpoints that agents can call.
- [Gateway overview](/docs/accept-payments/gateway-overview/index.md): Understand the local payment gateway shape before writing a spec.
- [Write a provider spec](/docs/accept-payments/provider-spec/index.md): Define routing, allowed endpoints, pricing, currencies, and operator settings.
- [Per-request payments](/docs/accept-payments/per-request/index.md): Charge once for a single metered API request.
- [Usage-metered payments](/docs/accept-payments/usage-metered/index.md): Price endpoints by requests, tokens, characters, pages, bytes, or other units.
- [Session payments](/docs/accept-payments/session-payments/index.md): Use MPP sessions for repeated calls under a capped authorization.
- [Payment splits](/docs/accept-payments/payment-splits/index.md): Distribute payment revenue across named recipients.
- [Serve OpenAPI to agents](/docs/accept-payments/openapi/index.md): Expose a filtered and rewritten API description from the payment gateway.
- [Debug payment flows](/docs/accept-payments/debugging/index.md): Use the payment debugger to inspect challenges, proofs, retries, and delivery.
- [Deploy a gateway](/docs/accept-payments/deploy/index.md): Run pay server in production with pinned images, secrets, signers, and observability.
- [Publish to pay-skills](/docs/accept-payments/publish-to-pay-skills/index.md): Create and validate provider metadata so agents can discover the gateway.
