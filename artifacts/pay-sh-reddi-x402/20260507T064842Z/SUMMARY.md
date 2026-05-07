# Pay.sh / reddi-x402 sandbox compatibility evidence

- Product: Reddi Agent Protocol
- Package: `reddi-x402`
- Mode: Pay.sh sandbox
- Provider spec: `config/pay-sh/reddi-x402-economic-demo-provider.yml`
- Provider spec SHA-256: `77f48c499b1b335e297372b58d8746ffd8b54783d73188ebedff766371af49ef`
- URL: `http://127.0.0.1:1402/api/economic-demo/reddi-x402/pay-sh-smoke`

## Result

- Plain curl returned: 402 Payment Required
- Challenge protocol: mpp
- Challenge count: 2
- Price: $0.01 USD/request
- `pay --sandbox curl` returned: 200 OK
- Payment receipt present: true
- Receipt status: success
- Receipt method: solana
- Receipt reference: `5QYPZc6sFu3tQ6XhMSnCEBqBaJk1dou1J3vMDUV6z2nwjNpDGvBW8yu1futaAdXwZyrAgXHfmuhfNFukymDt8uJH`

## Claim boundary

Sandbox Pay.sh gateway compatibility evidence only; no mainnet funds, no Umbra private settlement, and no MagicBlock PER settlement claimed.
