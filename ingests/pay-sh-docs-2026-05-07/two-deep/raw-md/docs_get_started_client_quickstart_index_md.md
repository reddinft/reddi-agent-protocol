# Client quickstart

> Make a sandbox paid API request from the command line.

Use the sandbox first. The API returns HTTP 402, pay builds the proof, and the retried request returns the paid response.

## Agent summary

- Start with a single `pay --sandbox curl` call.
- Keep the original gateway URL unchanged.
- Add `--verbose` only when debugging payment details.
- Use `--output json` when another program or agent needs structured status.

## Run the request

```sh
curl https://payment-debugger.vercel.app/mpp/quote/AAPL
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

## Built-in client

Use `pay fetch` when no external `curl` binary should be required:

```sh
pay --sandbox fetch https://payment-debugger.vercel.app/mpp/quote/AAPL
```

## Verbose Mode

```sh
pay --sandbox --verbose curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```
