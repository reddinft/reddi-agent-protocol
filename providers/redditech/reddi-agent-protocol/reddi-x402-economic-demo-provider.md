---
category: productivity
description: Sandbox Pay.sh gateway spec for a Reddi Agent Protocol paid API compatibility smoke using the reddi-x402 package surface.
endpoints:
- description: Return a sandbox Reddi Agent Protocol paid API smoke response after Pay.sh payment-proof verification.
  method: GET
  path: api/economic-demo/reddi-x402/pay-sh-smoke
  pricing:
    dimensions:
    - direction: usage
      scale: 1
      tiers:
      - price_usd: 0.01
      unit: requests
  resource: reddi-x402-pay-sh-smoke
name: reddi-x402-economic-demo-provider
sandbox_service_url: http://127.0.0.1:1402/reddi-x402-economic-demo-provider
service_url: ''
title: Reddi Agent Protocol economic demo
version: v1
---
