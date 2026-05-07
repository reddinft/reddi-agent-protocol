URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/mcp
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/mcp.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/mcp.md
DEPTH: 2

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# MCP



## OpenAPI

````yaml /pages/private-ephemeral-rollups-pers/api-reference/per/openapi/mcp.openapi.json POST /mcp
openapi: 3.1.0
info:
  title: Private Payments API
  version: 0.1.0
  description: Stateless Streamable HTTP MCP endpoint for the Private Payments API.
servers:
  - url: https://payments.magicblock.app
    description: Mainnet - Private Payments API
security: []
paths:
  /mcp:
    post:
      summary: MCP
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              description: JSON-RPC request body for the MCP endpoint.
      responses:
        '200':
          description: MCP JSON-RPC response
        '202':
          description: Notification accepted; no response body is returned.
        '400':
          description: Invalid JSON or invalid JSON-RPC request
        '415':
          description: Content-Type must be application/json

````