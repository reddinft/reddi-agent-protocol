# Gateways

> Reference for pay server start, demo, and scaffold.

`pay server` runs and creates payment gateway specs.

## Agent summary

- Use `pay --sandbox server demo` for the bundled demo.
- Use `pay server scaffold provider.yml` to create a starter spec.
- Use `--openapi` when the gateway should expose a filtered agent-facing API document.
- Use `--debugger` for local inspection.

## pay server demo

```sh
pay --sandbox server demo
pay --sandbox server demo --local
```

## pay server scaffold

```sh
pay server scaffold provider.yml
```

## pay server start

```sh
pay --sandbox server start provider.yml --debugger
pay server start provider.yml --bind 0.0.0.0:8080
pay server start provider.yml --openapi openapi.json --public-url https://gateway.example.com
```

Useful flags include `--bind`, `--recipient`, `--currency`, `--rpc-url`, `--debugger`, `--otlp-sidecar`, `--openapi`, and `--public-url`.
