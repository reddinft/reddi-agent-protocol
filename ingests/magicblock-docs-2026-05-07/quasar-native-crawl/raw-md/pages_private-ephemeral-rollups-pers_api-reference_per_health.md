URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/health
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/health.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/health.md
DEPTH: 2

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Health



## OpenAPI

````yaml /pages/private-ephemeral-rollups-pers/api-reference/per/openapi/health.openapi.json GET /health
openapi: 3.1.0
info:
  title: Private Payments API
  version: 0.1.0
  description: Health check endpoint for the Private Payments API.
servers:
  - url: https://payments.magicblock.app
    description: Mainnet - Private Payments API
security: []
paths:
  /health:
    get:
      summary: Health
      responses:
        '200':
          description: Health check
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    enum:
                      - ok
                required:
                  - status

````