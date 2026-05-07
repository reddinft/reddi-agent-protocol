URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/initialize-mint
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/initialize-mint.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/initialize-mint.md
DEPTH: 2

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Initialize Mint



## OpenAPI

````yaml /pages/private-ephemeral-rollups-pers/api-reference/per/openapi/initialize-mint.openapi.json POST /v1/spl/initialize-mint
openapi: 3.1.0
info:
  title: Private Payments API
  version: 0.1.0
  description: >-
    Build an unsigned base-chain transaction that initializes a validator-scoped
    transfer queue for a mint.
servers:
  - url: https://payments.magicblock.app
    description: Mainnet - Private Payments API
security: []
paths:
  /v1/spl/initialize-mint:
    post:
      summary: Initialize Mint
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                owner:
                  type: string
                cluster:
                  type: string
                mint:
                  type: string
                validator:
                  type: string
              required:
                - owner
                - mint
      responses:
        '200':
          description: Unsigned serialized transaction
        '400':
          description: Build error
        '422':
          description: Validation error

````