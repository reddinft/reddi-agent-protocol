# Troubleshooting

> Diagnose payment challenge, network, currency, account, and gateway failures.

Most pay failures come from network mismatch, unsupported currency, missing account setup, or gateway spec mismatch.

## Agent summary

- Use `--verbose` for local diagnosis.
- Use `--output json` when an agent needs structured status.
- Use the debugger for gateway payment loops.
- Try at most one clear fallback provider before asking the user.

## Client checks

```sh
pay --sandbox --verbose curl <url>
pay --sandbox --output json curl <url>
pay account list
pay topup --sandbox
```

## Gateway checks

```sh
pay --sandbox server start provider.yml --debugger
pay --sandbox curl http://127.0.0.1:1402/<path>
```

Check that the method and path are listed in `endpoints[]`, the endpoint has `metering` when it should charge, and the client network/currency matches the gateway.
