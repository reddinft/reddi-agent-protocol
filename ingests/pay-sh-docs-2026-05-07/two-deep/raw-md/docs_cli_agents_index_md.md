# Agents

> Reference for pay claude, pay codex, and pay mcp.

Agent commands attach Pay MCP tools to agent sessions or run the Pay MCP server directly.

## Agent summary

- Use `pay --sandbox claude` or `pay --sandbox codex` for test sessions.
- Use `pay mcp` when configuring another MCP client.
- Keep allowed tools scoped to provider search, endpoint lookup, paid curl, balance, and provider validation.

## pay claude

```sh
pay --sandbox claude
pay --sandbox --debugger claude
```

Arguments after `claude` are forwarded to the `claude` binary.

## pay codex

```sh
pay --sandbox codex
pay --sandbox --debugger codex
```

Arguments after `codex` are forwarded to the `codex` binary.

## pay mcp

```sh
pay mcp
```

`pay mcp` starts the local MCP server for compatible clients.
