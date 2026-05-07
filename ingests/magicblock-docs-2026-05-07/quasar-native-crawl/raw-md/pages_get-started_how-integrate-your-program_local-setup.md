URL: https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup
FETCHED_AS: https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup.md
FINAL: https://docs.magicblock.gg/pages/get-started/how-integrate-your-program/local-setup.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Local Validator Setup

> Run and test your Native Rust or Anchor programs with a fully local Ephemeral Rollup stack, Surfpool, or a local VRF oracle.

## Why Use a Local Setup?

When testing delegations and real-time behavior of your Solana programs, **fast feedback loops** are critical.

Running a **Local Ephemeral Rollup Validator** allows you to:

* Test delegations and behaviors quickly without network latency or rate limits.
* Simulate Solana runtime transactions locally.
* Customize your validator setup for your own needs.

***

## Quickstart: Local Ephemeral Validator

Explore delegation and test scripts for both Anchor and Native Rust:

<CardGroup cols={2}>
  <Card title="Anchor" icon="anchor" href="/pages/get-started/how-integrate-your-program/anchor" iconType="duotone">
    Integrate with an Anchor program
  </Card>

  <Card title="Native Rust" icon="rust" href="/pages/get-started/how-integrate-your-program/rust" iconType="duotone">
    Integrate with a Native Rust program
  </Card>
</CardGroup>

## Local Setup Options

You can run Ephemeral Rollups locally in three ways:

* A fully local stack with `mb-test-validator` as the base layer and a local `ephemeral-validator`.
* A local Surfpool instance as the base layer alternative, while still running the rollup locally.
* A local `ephemeral-validator` connected directly to a public base layer such as Devnet.

Use the fully local path when you want everything on your machine. Use Surfpool when you want to keep the Surfpool workflow while testing against a local Ephemeral Rollup. Use the Devnet option when you want a local rollup process without running a local Solana validator.

### Important: upgrade your program with the correct validator identity

When using a local ER validator, connect it to the base layer where the accounts are delegated. If you delegate your PDA to a specific ER validator identity, update the delegation config in your program so commits and undelegations can complete correctly on the base layer.

<Note>
  <p>
    These public validators are supported for development. Make sure to add the
    specific ER validator in your delegation instruction:
  </p>

  **Mainnet**

  <ul>
    <li>
      Asia (as.magicblock.app):{" "}
      <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
    </li>

    <li>
      EU (eu.magicblock.app):{" "}
      <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
    </li>

    <li>
      US (us.magicblock.app):{" "}
      <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
    </li>

    <li>
      TEE (mainnet-tee.magicblock.app):{" "}
      <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
    </li>
  </ul>

  **Devnet**

  <ul>
    <li>
      Asia (devnet-as.magicblock.app):{" "}
      <code>MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57</code>
    </li>

    <li>
      EU (devnet-eu.magicblock.app):{" "}
      <code>MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e</code>
    </li>

    <li>
      US (devnet-us.magicblock.app):{" "}
      <code>MUS3hc9TCw4cGC12vHNoYcCGzJG1txjgQLZWVoeNHNd</code>
    </li>

    <li>
      TEE (devnet-tee.magicblock.app):{" "}
      <code>MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo</code>
    </li>
  </ul>

  **Localnet**

  <ul>
    <li>
      Local ER (localhost:7799):{" "}
      <code>mAGicPQYBMvcYveUZA5F5UNNwyHvfYh5xkLS2Fr1mev</code>
    </li>
  </ul>
</Note>

<Tabs>
  <Tab title="Fully local">
    <Steps>
      <Step title="Install the Ephemeral Validator CLI">
        ```bash theme={null}
        npm install -g @magicblock-labs/ephemeral-validator@latest
        ```
      </Step>

      <Step title="Start the local Solana base layer">
        `mb-test-validator` starts a local Solana validator you can use as the base layer for a fully local setup.

        ```bash theme={null}
        mb-test-validator --reset
        ```

        This setup uses `http://localhost:8899` for RPC and `ws://localhost:8900` for WebSocket connections.
      </Step>

      <Step title="Deploy or upgrade your program on localhost">
        <Tabs>
          <Tab title="Rust Native">
            ```bash theme={null}
            cargo build-sbf
            solana config set --url localhost
            solana program deploy YOUR_PROGRAM_PATH
            ```
          </Tab>

          <Tab title="Anchor">
            ```bash theme={null}
            anchor build && anchor deploy \
              --provider.cluster localnet
            ```
          </Tab>
        </Tabs>
      </Step>

      <Step title="Start the local ephemeral validator">
        Connect the local Ephemeral Rollup to the local Solana validator:

        ```bash theme={null}
        ephemeral-validator --remotes "http://localhost:8899" --remotes "ws://localhost:8900" -l "7799" --lifecycle ephemeral
        ```
      </Step>

      <Step title="Run tests against the local rollup">
        The local rollup is exposed on `http://localhost:7799` for RPC and `ws://localhost:7800` for WebSocket connections.

        <Tabs>
          <Tab title="Rust Native">
            ```bash theme={null}
            EPHEMERAL_PROVIDER_ENDPOINT=http://localhost:7799 \
            EPHEMERAL_WS_ENDPOINT=ws://localhost:7800 \
            PROVIDER_ENDPOINT=http://localhost:8899 \
            WS_ENDPOINT=ws://localhost:8900 \
            yarn test
            ```
          </Tab>

          <Tab title="Anchor">
            ```bash theme={null}
            EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
            EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
            anchor test \
              --provider.cluster localnet \
              --skip-local-validator \
              --skip-build \
              --skip-deploy
            ```
          </Tab>
        </Tabs>
      </Step>
    </Steps>
  </Tab>

  <Tab title="Surfpool">
    <Steps>
      <Step title="Install Surfpool">
        ```bash theme={null}
        curl -sL https://run.surfpool.run/ | bash
        ```
      </Step>

      <Step title="Install the Ephemeral Validator CLI">
        ```bash theme={null}
        npm install -g @magicblock-labs/ephemeral-validator@latest
        ```
      </Step>

      <Step title="Start Surfpool">
        This example keeps Surfpool local while using Solana Devnet as the upstream base layer:

        ```bash theme={null}
        surfpool start --rpc-url https://api.devnet.solana.com
        ```

        Surfpool exposes the local RPC and WebSocket endpoints that the ephemeral validator connects to.
      </Step>

      <Step title="Start the ephemeral validator">
        Point the validator to Surfpool's local RPC and WebSocket endpoints:

        ```bash theme={null}
        ephemeral-validator --remotes "http://localhost:8899" --remotes "ws://localhost:8900" -l "7799" --lifecycle ephemeral
        ```
      </Step>

      <Step title="Send a test transaction to the rollup">
        ```bash theme={null}
        solana transfer <your address> 0 -u "http://localhost:7799"
        ```
      </Step>

      <Step title="Inspect the transaction">
        The transaction should appear in the ER TUI, where you can inspect it and open it in the explorer.

        This flow is based on [Running Ephemeral Rollups locally with Surfpool](https://x.com/PiccoGabriele/status/2030045550230524212).
      </Step>
    </Steps>
  </Tab>

  <Tab title="Devnet">
    <Steps>
      <Step title="Deploy or upgrade your program on Devnet">
        Upgrade your program with MagicBlock delegation and deploy it to Devnet:

        <Tabs>
          <Tab title="Rust Native">
            ```bash theme={null}
            cargo build-sbf
            solana config set --url devnet
            solana program deploy YOUR_PROGRAM_PATH
            ```
          </Tab>

          <Tab title="Anchor">
            ```bash theme={null}
            anchor build && anchor deploy \
              --provider.cluster devnet
            ```
          </Tab>
        </Tabs>
      </Step>

      <Step title="Install and run the local ephemeral validator">
        ```bash theme={null}
        npm install -g @magicblock-labs/ephemeral-validator@latest
        ```

        ```bash theme={null}
        RUST_LOG=info ephemeral-validator \
          --lifecycle ephemeral \
          --remote-url "https://rpc.magicblock.app/devnet" \
          --rpc-port 7799
        ```
      </Step>

      <Step title="Run tests against the local rollup">
        <Tabs>
          <Tab title="Rust Native">
            ```bash theme={null}
            EPHEMERAL_PROVIDER_ENDPOINT=http://localhost:7799 \
            EPHEMERAL_WS_ENDPOINT=ws://localhost:7800 \
            yarn test
            ```
          </Tab>

          <Tab title="Anchor">
            ```bash theme={null}
            EPHEMERAL_PROVIDER_ENDPOINT="http://localhost:7799" \
            EPHEMERAL_WS_ENDPOINT="ws://localhost:7800" \
            anchor test \
              --provider.cluster devnet \
              --skip-local-validator \
              --skip-build \
              --skip-deploy
            ```
          </Tab>
        </Tabs>
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Run the VRF Oracle Locally

If you also need to test VRF end to end, run a local `vrf-oracle` against a local test queue.

<Steps>
  <Step title="Install the latest Ephemeral Validator CLI">
    ```bash theme={null}
    npm install -g @magicblock-labs/ephemeral-validator@latest
    ```
  </Step>

  <Step title="Start the local Solana validator">
    ```bash theme={null}
    mb-test-validator --reset
    ```
  </Step>

  <Step title="Start the ephemeral validator">
    ```bash theme={null}
    ephemeral-validator --remote-url "http://localhost:8899" --rpc-port 7799 --lifecycle ephemeral
    ```
  </Step>

  <Step title="Start the local VRF oracle">
    This oracle adds requests to the local test queue:

    ```bash theme={null}
    VRF_ORACLE_SKIP_PREFLIGHT="true" RPC_URL="http://localhost:8899" WEBSOCKET_URL="ws://localhost:8999" RUST_LOG=info vrf-oracle
    ```

    If your local validator exposes a different WebSocket port, update `WEBSOCKET_URL` accordingly.
  </Step>
</Steps>
