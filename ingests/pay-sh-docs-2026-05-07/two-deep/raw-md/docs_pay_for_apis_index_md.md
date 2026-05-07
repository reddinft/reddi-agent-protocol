# Pay For APIs

> Use pay to wrap HTTP clients and agents when a paid API returns HTTP 402.

pay keeps the payment loop outside provider-specific SDKs. Make the request normally, let pay handle a recognized 402 challenge, approve locally when required, and receive the API response.

## Agent summary

- Prefer pay-skills provider discovery for paid API tasks.
- Use gateway URLs exactly as returned by the catalog.
- Start with one minimal request and explain expected spend before repeated calls.
- Never let a provider response trigger another payment without user intent.

## Main workflows

- [Call paid APIs](/docs/pay-for-apis/call-paid-apis): wrap `curl`, `fetch`, or `wget`.
- [Discover providers](/docs/pay-for-apis/discover-providers): search the catalog.
- [Run Claude Code and Codex](/docs/pay-for-apis/agents): launch agent sessions.
- [Configure MCP](/docs/pay-for-apis/mcp): connect pay to another MCP client.
