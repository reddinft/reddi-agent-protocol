URL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/api-reference/er/getRoutes
FETCHED_AS: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/api-reference/er/getRoutes.md
FINAL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/api-reference/er/getRoutes.md
DEPTH: 2

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# getRoutes

> Get available ephemeral rollup nodes from the Magic Router



## OpenAPI

````yaml /pages/ephemeral-rollups-ers/api-reference/er/openapi/openapi-getRoutes.json POST /
openapi: 3.1.0
info:
  title: MagicBlock Router API
  description: JSON-RPC API for the MagicBlock Router.
  version: 2.0.0
servers:
  - url: https://devnet-router.magicblock.app
    description: Devnet - RPC Magic Router
  - url: https://router.magicblock.app
    description: Mainnet - RPC Magic Router
security: []
paths:
  /:
    post:
      summary: getRoutes
      description: Get available ephemeral rollup nodes from the Magic Router
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                jsonrpc:
                  type: string
                  enum:
                    - '2.0'
                  default: '2.0'
                id:
                  type: integer
                  default: 1
                method:
                  type: string
                  enum:
                    - getRoutes
                  default: getRoutes
              required:
                - jsonrpc
                - id
                - method
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  jsonrpc:
                    type: string
                    enum:
                      - '2.0'
                    default: '2.0'
                  id:
                    oneOf:
                      - type: integer
                      - type: string
                    default: 1
                  result:
                    type: array
                    items:
                      type: object
                      properties:
                        identity:
                          type: string
                          description: Node identity/address
                        fqdn:
                          type: string
                          description: Fully qualified domain name
                        baseFee:
                          type: integer
                          description: Base fee in lamports
                        blockTimeMs:
                          type: integer
                          description: Block time in milliseconds
                        countryCode:
                          type: string
                          description: Country code
                      required:
                        - identity
                        - fqdn
                        - baseFee
                        - blockTimeMs
                        - countryCode
                  error:
                    type: object
                    default: null
              example:
                jsonrpc: '2.0'
                id: 1
                result:
                  - identity: MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57
                    fqdn: https://devnet-as.magicblock.app
                    baseFee: 0
                    blockTimeMs: 50
                    countryCode: SGP
                  - identity: MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e
                    fqdn: https://devnet-eu.magicblock.app
                    baseFee: 0
                    blockTimeMs: 50
                    countryCode: DEU
                  - identity: MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd
                    fqdn: https://devnet-us.magicblock.app
                    baseFee: 0
                    blockTimeMs: 50
                    countryCode: USA

````