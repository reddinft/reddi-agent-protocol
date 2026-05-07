URL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/authorization
FETCHED_AS: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/authorization.md
FINAL: https://docs.magicblock.gg/pages/private-ephemeral-rollups-pers/introduction/authorization.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Authorization

> Customize authorized access through onchain restrictions on account level for user groups.

***

### Authorization Model

<img class="w-full h-auto max-w-5xl" src="https://mintcdn.com/magicblock-42/ct0E9_vTX6zALMvJ/images/TEE_permission.png?fit=max&auto=format&n=ct0E9_vTX6zALMvJ&q=85&s=c23e578afd0dacc83cf437d1855bf894" width="1142" height="653" data-path="images/TEE_permission.png" />

Private Ephemeral Rollups use a Permission Program to manage fine-grained privacy controls for accounts and account groups. This runs on Solana L1 and can be updated on the fly.

* **Permission Groups**: Define groups with arbitrary membership and IDs via CPI. A group aggregates users and the accounts governed by its permissions.
* **Permissions**: Add permissions to groups. Today a permission implies read access for the delegated account; read/write splits may be added in the future.
* **Access**: Client access to permissioned ER state requires authenticating ownership of a specified public key. Successful authentication yields a token used to query the ER.

<Note>
  Private Ephemeral Rollup (devnet) endpoint:
  `https://devnet-tee.magicblock.app?token=   {authToken}`. Replace `{authToken}` with your authorization token obtained
  from the TEE RPC to send requests.
</Note>

This abstraction into groups lets you modify the permissions for many users/accounts atomically in a single transaction.

***

<CardGroup cols={2}>
  <Card title="Access Control" icon="lock" href="/pages/private-ephemeral-rollups-pers/how-to-guide/access-control" iconType="duotone">
    Fine-grained Access Control
  </Card>

  <Card title="On-chain Privacy" icon="shield" href="/pages/private-ephemeral-rollups-pers/introduction/onchain-privacy" iconType="duotone">
    Privacy Mechanisms and Concepts
  </Card>

  <Card title="Authorization" icon="key" href="/pages/private-ephemeral-rollups-pers/introduction/authorization" iconType="duotone">
    Authorization Framework
  </Card>

  <Card title="Compliance Framework" icon="certificate" href="/pages/private-ephemeral-rollups-pers/introduction/compliance-framework" iconType="duotone">
    Compliance Standards and Guidelines
  </Card>
</CardGroup>
