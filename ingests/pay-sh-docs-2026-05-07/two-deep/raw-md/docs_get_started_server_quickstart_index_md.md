# Server quickstart

> Start a sandbox payment gateway and inspect the payment flow.

Run the bundled gateway demo to test the server side of pay without writing a provider spec first.

## Agent summary

- Use top-level `--sandbox`; `pay server demo` requires it.
- The demo writes `pay-demo.yaml` in the current directory.
- Open the debugger only for inspection; do not invent transaction details that are not shown.

## Start the demo

```sh
pay --sandbox server demo
```

Call a metered endpoint from another terminal:

```sh
pay --sandbox curl http://127.0.0.1:1402/api/v1/reports/usage
```

The debugger UI is served on the gateway port and shows the challenge, payment proof, retry, and final response.
