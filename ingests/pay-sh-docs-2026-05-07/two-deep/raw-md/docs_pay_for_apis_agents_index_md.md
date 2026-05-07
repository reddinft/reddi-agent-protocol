# Run Claude Code and Codex

> Run agent sessions with Pay MCP tools and wallet-approved API calls.

`pay claude` and `pay codex` start the agent with the Pay MCP server configured for the session.

## Agent summary

- Use `--sandbox` until the user explicitly asks for mainnet spending.
- State provider, endpoint, expected call count, and estimated spend before paid work.
- For a single obvious low-cost call, proceed to the normal wallet approval flow.
- Ask before purchases, persistent resources, unclear pricing, or repeated calls.

## Launch

```sh
pay --sandbox claude
pay --sandbox codex
```

## With debugger

```sh
pay --sandbox --debugger claude
pay --sandbox --debugger codex
```

The debugger proxy captures Pay MCP curl requests and serves the local payment debugger at `http://127.0.0.1:1402/`.
