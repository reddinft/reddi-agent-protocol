# Pay.sh / reddi-x402 Phase 3 extension smoke

- Product: Reddi Agent Protocol
- Package: `reddi-x402`
- URL: `http://127.0.0.1:1403/api/economic-demo/reddi-x402/pay-sh-session-splits-smoke`
- Plain curl status: 402 Payment Required
- Challenge count: 1
- Challenge intents: ['session']
- Session cap: 1000000 base units
- Pay.sh sandbox retry: Server returned 402 again after payment

## Claim boundary

Phase 3 extension evidence only: Pay.sh emitted session/split challenge metadata, but sandbox retry did not complete; do not claim working capped session or split settlement yet.
