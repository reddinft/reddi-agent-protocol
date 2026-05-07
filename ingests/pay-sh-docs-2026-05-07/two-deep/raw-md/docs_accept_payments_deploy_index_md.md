# Deploy a gateway

> Run pay server in production with pinned images, secrets, signers, and observability.

Run pay as a cloud gateway with declarative specs and managed secrets.

## Agent summary

- Pin container image versions.
- Deploy one gateway per provider or upstream API surface.
- Store API keys, RPC URLs, signer config, and recipients in secret management.
- Alert on payment and delivery failures, not only process health.

## Command shape

```sh
pay server start provider.yml --bind 0.0.0.0:8080
```

## Production spec fragment

```yaml
operator:
  currencies:
    usd: ['USDC', 'USDT']
  network: mainnet
  fee_payer: true
  rpc_url: '${PAY_RPC_URL}'
  recipient: '${PAY_PAYMENT_RECIPIENT}'
```

Use a production signer backend such as KMS where available. Do not bake private keys or upstream API keys into images.
