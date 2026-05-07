# Pay.sh / reddi-x402 Phase 3 extension smoke

- Product: Reddi Agent Protocol
- Package: `reddi-x402`
- URL: `http://127.0.0.1:1404/api/economic-demo/reddi-x402/pay-sh-splits-smoke`
- Plain curl status: 402 Payment Required
- Challenge count: 2
- Challenge intents: ['charge']
- Split count: 1; first split amount: 4000; recipient: `d4ST3N4Vkio1Xsg2NaF6Zox7Xq8MdqWihvyip9AHioR`
- Pay.sh sandbox retry: Server returned 402 again after payment

## Claim boundary

Phase 3 extension evidence only: Pay.sh emitted session/split challenge metadata, but sandbox retry did not complete; do not claim working capped session or split settlement yet.
