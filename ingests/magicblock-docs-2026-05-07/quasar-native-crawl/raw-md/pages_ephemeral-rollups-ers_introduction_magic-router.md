URL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/magic-router
FETCHED_AS: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/magic-router.md
FINAL: https://docs.magicblock.gg/pages/ephemeral-rollups-ers/introduction/magic-router.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Magic Router

> Learn how Magicblock's Magic Router accelerates transactions by routing them to the right execution environment.

<div
  style={{
position: "relative",
paddingBottom: "56.25%",
height: 0,
overflow: "hidden",
}}
>
  <iframe
    src="https://www.youtube.com/embed/Wc2XMAKtEug?si=bjitIDG7w5fY5zmK&list=PLWR_ZQiGMS8mIe1kPZe8OfHIbhvZqaM8V"
    title="Why Build with MagicBlock? Solve Scaling & UX Pain Points with Ephemeral Rollups"
    style={{
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
}}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
    referrerPolicy="strict-origin-when-cross-origin"
  />
</div>

***

## Dynamic Transaction Routing

**Magicblock's Magic Router** is an dynamic transaction routing engine that accelerates transactions by intelligently deciding where they should be executed — either on **Ephemeral Rollups** or **Solana** — based on transaction metadata.

This eliminates the need for manual routing logic from the developer, providing significant benefits in transaction speed and development experience.

* ✅ **Simple Integration with Single Endpoint**: Just connect to a single RPC endpoint.
* ✅ **Seamless Wallet Experience**: Connect, sign, and submit — no need to know what’s happening behind the scenes.
* ✅ **Faster Confirmations**: Magic Router routes to the fastest available endpoint.

<img class="w-full h-auto max-w-5xl" src="https://mintcdn.com/magicblock-42/5iyVpKJBt1PkwHw4/images/magic-router.png?fit=max&auto=format&n=5iyVpKJBt1PkwHw4&q=85&s=89797c78d3081846949e7e8ad36fd3fb" width="1748" height="920" data-path="images/magic-router.png" />

***

## Quick Access

<CardGroup cols={2}>
  <Card title="Anchor" icon="anchor" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/anchor-counter" iconType="duotone">
    Integrate with an Anchor program
  </Card>

  <Card title="Native Rust" icon="rust" href="https://github.com/magicblock-labs/magicblock-engine-examples/tree/main/rust-counter" iconType="duotone">
    Integrate with a Native Rust program
  </Card>

  <Card title="API" icon="server" href="/pages/ephemeral-rollups-ers/api-reference/er/getRoutes" iconType="duotone">
    Experiment with Magic Router API
  </Card>
</CardGroup>

***

## Code Snippets

Initialize connection with Magic Router before you send transactions dynamically.

<Note>
  These public RPC endpoints are currently free and supported for development:
  <br /> Magic Router Devnet: [https://devnet-router.magicblock.app](https://devnet-router.magicblock.app) <br />
</Note>

Choose your preferred SDK to initialize, send and confirm transactions:

* `ephemeral-rollups-kit` for `@solana/kit`
* `ephemeral-rollups-sdk` for `@solana/web.js`

<CodeGroup>
  ```typescript Kit theme={null}
  import { Connection } from "@magicblock-labs/ephemeral-rollups-kit";

  // Initialize connection
  const connection = await Connection.create(
    "https://devnet-router.magicblock.app",
    "wss://devnet-router.magicblock.app"
  );

  // ... create transaction

  // Send and confirm transaction
  const txHash = await connection.sendAndConfirmTransaction(
    transactionMessage,
    [userKeypair],
    { commitment: "confirmed", skipPreflight: true }
  );
  ```

  ```typescript Web3.js theme={null}
  import { sendAndConfirmTransaction } from "@solana/web3.js";
  import { ConnectionMagicRouter } from "@magicblock-labs/ephemeral-rollups-sdk";

  // Initialize connection
  const connection = new ConnectionMagicRouter(
    "https://devnet-router.magicblock.app/",
    { wsEndpoint: "wss://devnet-router.magicblock.app/" }
  );

  // ... create transaction

  // Send and confirm transaction
  const txHash = await sendAndConfirmTransaction(connection, tx, [payer], {
    skipPreflight: true,
    commitment: "confirmed",
  });
  ```
</CodeGroup>

The Magic Router analyzes each transaction’s metadata (e.g. writable accounts, owner, and signer) and automatically routes it to the closest dedicated endpoint:

<img class="w-full h-auto max-w-5xl" src="https://mintcdn.com/magicblock-42/5iyVpKJBt1PkwHw4/images/magic-router-scenarios.png?fit=max&auto=format&n=5iyVpKJBt1PkwHw4&q=85&s=4ef8b83ef98061f9073bb11f834d7cc2" width="1800" height="970" data-path="images/magic-router-scenarios.png" />

1. **Client - Transaction Submission** The dApp or user sends a transaction to the
   Magic Router RPC endpoint.

2. **RPC - Metadata Inspection**
   The Magic Router inspects the transaction metadata and checks the owner of writable accounts.

3. **Validator - Smart Routing and Execution**
   Based on the metadata, the router determines whether to send it to:

   * **Ephemeral Rollup** for fast, low-latency, zero-cost execution
   * **Solana** for persistent, high-throughput execution

***
