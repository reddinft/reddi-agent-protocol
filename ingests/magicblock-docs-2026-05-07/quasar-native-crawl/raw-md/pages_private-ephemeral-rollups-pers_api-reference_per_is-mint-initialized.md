URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/is-mint-initialized
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/is-mint-initialized.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/api-reference/per/is-mint-initialized.md
DEPTH: 2

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Is Mint Initialized



## OpenAPI

````yaml /pages/private-ephemeral-rollups-pers/api-reference/per/openapi/is-mint-initialized.openapi.json GET /v1/spl/is-mint-initialized
openapi: 3.1.0
info:
  title: Private Payments API
  version: 0.1.0
  description: >-
    Check whether the validator-scoped transfer queue exists for a mint on the
    ephemeral RPC.
servers:
  - url: https://payments.magicblock.app
    description: Mainnet - Private Payments API
security: []
paths:
  /v1/spl/is-mint-initialized:
    get:
      summary: Is Mint Initialized
      parameters:
        - name: mint
          in: query
          required: true
          schema:
            type: string
        - name: cluster
          in: query
          required: false
          schema:
            type: string
        - name: validator
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Mint transfer queue initialization status
          content:
            application/json:
              schema:
                type: object
                properties:
                  initialized:
                    type: boolean
                required:
                  - initialized
        '400':
          description: Query error
        '422':
          description: Validation error

````