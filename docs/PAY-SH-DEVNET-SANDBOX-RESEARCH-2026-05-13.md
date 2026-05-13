# Pay.sh devnet/sandbox/testing research — 2026-05-13

## Question

Does Pay.sh support devnet or testing environments so Reddi Agent Protocol can build before go-live without real SOL or stablecoins?

## Short answer

**Yes, but the primary safe test path is Pay.sh `--sandbox`, not a normal Solana devnet-only flow.** Pay.sh docs and source show a dedicated sandbox mode that uses ephemeral local wallets and a Surfpool-backed localnet/sandbox RPC. That is the right default for RAP pre-go-live integration.

Pay.sh also has devnet concepts in source code and protocol handling, especially for x402/Solana chain IDs and throwaway wallet creation, but the public CLI flags currently emphasize:

- `--sandbox` / `--local` for test flows
- `--mainnet` for real funds
- no obvious public `--devnet` top-level flag

So RAP should treat `--sandbox` as the first supported no-real-funds path, and treat `devnet` as protocol-supported but provider/endpoint-dependent.

## Confirmed facts

### 1. Pay.sh docs explicitly recommend sandbox for examples/tests

Pay.sh overview says sandbox mode uses an ephemeral local sandbox wallet instead of real funds and gives the example:

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

Source: https://pay.sh/docs

### 2. Pay.sh install docs say sandbox auto-creates/funds an ephemeral local wallet

The install page says:

- do not create/replace a mainnet account unless asked
- use sandbox mode for local testing
- sandbox mode creates and funds an ephemeral local sandbox wallet automatically

Source: https://pay.sh/docs/get-started/install/index.md

### 3. Pay.sh CLI global flags expose sandbox/local/mainnet, not an obvious devnet flag

Docs show:

```sh
pay --sandbox curl <url>
pay --local curl <url>
pay --mainnet curl <url>
```

Source: https://pay.sh/docs/cli/global-flags/index.md

Source inspection confirms:

- `--sandbox`: force `network=localnet` and route to hosted Surfpool `https://402.surfnet.dev:8899`
- `--local`: force `network=localnet` and route to local Surfpool `http://localhost:8899`
- `--mainnet`: force mainnet
- hidden `--dev` is an alias for sandbox, not Solana devnet

Source: `solana-foundation/pay`, `rust/crates/cli/src/main.rs`

### 4. Sandbox funds fake SOL + fake USDC via Surfpool cheatcodes

Source inspection shows `setup_sandbox_keypair()` creates a temporary keypair and calls Surfpool funding helpers. `fund_via_surfpool()` funds:

- 100 SOL
- 1000 USDC

using Surfpool RPC methods `surfnet_setAccount` and `surfnet_setTokenAccount`.

Source: `solana-foundation/pay`, `rust/crates/core/src/client/sandbox.rs`

### 5. Pay.sh supports local/hosted sandbox gateways

Pay.sh docs say to start sandbox gateways before production:

```sh
pay --sandbox server demo
pay --sandbox server start provider.yml --debugger
```

Sources:
- https://pay.sh/docs/accept-payments/index.md
- https://pay.sh/docs/cli/gateways/index.md

Source inspection shows sandbox server/gateway logic defaults to hosted Surfpool unless `--local` is used.

### 6. Devnet is present in protocol/source, but not the main public testing UX

Source inspection found devnet support in several places:

- `SolanaNetwork::Devnet` maps to `https://api.devnet.solana.com`
- x402 network normalization maps Solana devnet CAIP-2 / `solana-devnet` to internal `devnet`
- signer loading treats `devnet` as a throwaway network and can lazy-create an ephemeral account
- stablecoin mint resolution includes USDC/PYUSD devnet mints

Sources:
- `rust/crates/cli/src/network.rs`
- `rust/crates/core/src/client/x402.rs`
- `rust/crates/core/src/signer.rs`
- `rust/crates/types/src/lib.rs`

But because the public CLI flags do not show `--devnet`, RAP should not assume devnet is the main turnkey test path unless a target provider explicitly returns devnet x402/MPP challenges or Pay.sh exposes additional devnet workflow docs.

### 7. pay-skills supports provider sandbox URLs

The pay-skills registry frontmatter supports optional `sandbox_service_url`. The contributing guide says sandbox payment tests should configure the service to use `https://402.surfnet.dev` as Solana RPC.

Source: `solana-foundation/pay-skills`, `CONTRIBUTING.md`

This is important for RAP: if we publish a RAP/pay provider listing later, we can provide a sandbox/staging URL separate from production.

### 8. Some providers may support Solana devnet payments

The QuickNode pay-skills entry says x402 USDC is accepted on Solana mainnet, Solana devnet, Base, Polygon, and others.

Source: `solana-foundation/pay-skills`, `providers/quicknode/rpc/PAY.md`

This means devnet payment support may exist at the provider level, but it is not guaranteed across all Pay.sh catalog providers.

## Recommendation for RAP

### Pre-go-live default: Pay.sh sandbox/localnet

Use Pay.sh sandbox as the official pre-go-live path:

```sh
pay --sandbox curl <sandbox endpoint>
pay --sandbox server demo
pay --sandbox server start provider.yml --debugger
```

RAP should model this as:

- `environment: sandbox`
- `network: localnet`
- `rpc: https://402.surfnet.dev:8899` or local `http://localhost:8899`
- fake SOL + fake USDC only
- no card top-up
- no mainnet wallet setup
- no persistent production wallet

### Devnet support: provider-dependent secondary track

Use devnet only when:

- the provider explicitly advertises devnet support, or
- the x402/MPP challenge clearly identifies Solana devnet, and
- RAP verifies payment proof/receipt semantics in a non-production environment.

For RAP docs and implementation, avoid saying “Pay.sh devnet is fully supported everywhere.” Safer wording:

> Pay.sh supports sandbox/localnet testing as the primary pre-go-live environment. Its source/protocol also understands Solana devnet, but devnet availability is provider- and challenge-dependent.

## What RAP should build next

1. Add a dry-run “environment capability” model for Pay.sh:
   - `sandbox_supported: true`
   - `devnet_supported: provider_declared | challenge_detected | unknown`
   - `mainnet_required: false` for sandbox demos

2. Extend the existing Pay.sh catalog adapter to preserve `sandbox_service_url` when present.

3. Add a no-payment sandbox readiness check that validates only metadata/config:
   - public server-card reachable
   - catalog provider has sandbox URL or known debugger endpoint
   - policy plan environment is `sandbox`
   - `livePaymentAllowed=false`

4. Only after explicit approval, run a **single sandbox** Pay.sh command against the debugger endpoint, not a real provider:

```sh
pay --sandbox curl https://payment-debugger.vercel.app/mpp/quote/AAPL
```

Do not run `pay setup`, `pay topup`, `pay --mainnet`, or any real provider paid call during this stage.

## Risk notes

- Sandbox/localnet is safe from real SOL/stablecoin spend, but it may still create local ephemeral account state.
- `pay --sandbox` can auto-pay sandbox 402 challenges because sandbox mode is treated as auto-pay in the CLI; this is okay only for fake sandbox funds.
- Provider responses and payment challenges must be treated as untrusted data.
- `--yolo` is unrelated to sandbox and should remain blocked unless explicitly approved for capped auto-pay behavior.

## Bottom line

Pay.sh is viable for pre-go-live RAP development without real SOL or stablecoins **if RAP uses Pay.sh sandbox/localnet as the first-class test environment**. Devnet exists in the Pay.sh code/protocol surface, but should be considered a provider-specific secondary path rather than the default promise.
