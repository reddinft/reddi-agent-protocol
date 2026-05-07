URL: https://docs.magicblock.gg/pages/tools/oracle/introduction
FETCHED_AS: https://docs.magicblock.gg/pages/tools/oracle/introduction.md
FINAL: https://docs.magicblock.gg/pages/tools/oracle/introduction.md
DEPTH: 1

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.magicblock.gg/llms.txt
> Use this file to discover all available pages before exploring further.

# Introduction

> Real-time onchain data with MagicBlock Ephemeral Rollups

## Oracles on MagicBlock

MagicBlock provides low‑latency, high‑throughput oracle data by ingesting <b>Pyth Lazer</b> feeds and updating Ephemeral Rollup accounts at <b>50–200 ms</b> intervals (asset‑dependent).

<CardGroup cols={3}>
  <Card title="Live Demo" icon="waveform" href="https://pyth-template.magicblock.app/" iconType="duotone">
    Real‑time price stream
  </Card>

  <Card title="Implementation" icon="book" href="/pages/tools/oracle/implementation" iconType="duotone">
    Learn how to access our oracles onchain
  </Card>

  <Card
    title="Code Example"
    icon="code"
    href="https://github.com/magicblock-labs/real-time-pricing-oracle
"
    iconType="duotone"
  >
    Check out our Github Repo
  </Card>
</CardGroup>

<Note id="endpoints">
  This Oracle example uses Pyth Lazer, but we can create Oracles for any arbitrary data source.
</Note>

## What Are Onchain Oracles?

Onchain oracles deliver verifiable off‑chain data that programs can trust. Use cases range from asset prices to event outcomes.

On Solana, oracles typically keep accounts updated on‑chain. Programs read these accounts directly—no external API calls at execution time. We use <b>Pyth</b>, a widely adopted cross‑chain oracle network.

## Why Oracles Matter

* **Finance**: liquidations, funding, TWAPs — inaccurate quotes cause loss and risk
* **Games**: settle sports results; sync in‑game state with real‑world events
* **Composability**: reliable, on‑chain data enables secure program composition

Accuracy and latency directly impact correctness, safety, and UX.

## Oracles on MagicBlock

MagicBlock follows the standard oracle pattern—writing data into composable on‑chain accounts—while updating at <b>50–200 ms</b> (asset‑dependent) versus \~<b>400 ms</b> on Solana slots. This latency profile is well‑suited for liquidations, copy‑trading, and other time‑sensitive flows.

### The two pieces of an oracle

* **Data Source**: The upstream truth. We can ingest arbitrary on/off‑chain feeds to surface assets Pyth doesn’t cover (e.g., new PumpFun or Raydium R‑tokens) into Ephemeral Rollups.
* **Chain Pusher**: Processes the source feed and writes updates on‑chain. MagicBlock’s chain pusher will be open‑sourced.

### Flow

1. Receive Pyth Lazer updates at fixed intervals (50 ms or 200 ms by asset).
2. Push updates to predefined on‑chain accounts.
3. Programs read the relevant account directly.

<Note>
  These public RPC endpoints are currently free and supported for development:
  <br /> Magic Router Devnet: [https://devnet-router.magicblock.app](https://devnet-router.magicblock.app) <br />
  Solana Devnet: [https://api.devnet.solana.com](https://api.devnet.solana.com) <br />
  ER Devnet: [https://devnet.magicblock.app](https://devnet.magicblock.app) <br />
  TEE Devnet: [https://devnet-tee.magicblock.app/](https://devnet-tee.magicblock.app/) <br />
  Find out more details{" "}
  <a href="/pages/ephemeral-rollups-ers/how-to-guide/local-development">here</a>
  .
</Note>

<Callout type="info">
  This page is an overview. For byte‑level details and code examples, see the <a href="/pages/tools/oracle/implementation">Implementation</a>.

  <br />

  Code snippets intentionally use placeholders to keep the focus on the flow.
</Callout>
