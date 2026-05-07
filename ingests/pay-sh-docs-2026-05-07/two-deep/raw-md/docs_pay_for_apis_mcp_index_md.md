# Configure MCP

> Add the Pay MCP server to compatible agent clients.

Use MCP when an agent client should call Pay tools without being launched through `pay claude` or `pay codex`.

## Agent summary

- Configure `pay mcp` as a local MCP server.
- Expose only the Pay tools the agent needs.
- Keep wallet approval local; do not give agents private keys or upstream provider keys.

## MCP config

```json
{
  "mcpServers": {
    "pay": {
      "command": "pay",
      "args": ["mcp"]
    }
  }
}
```

## Tools

The Pay MCP server exposes provider discovery, endpoint detail lookup, paid HTTP calls, balance checks, and provider-file validation helpers.

```txt
search_skills
list_skills
get_skill_endpoints
curl
get_balance
create_skill
```
