# Install pay

> Install the pay CLI, verify the binary, and update agent integrations.

Install the CLI before running client, agent, or server flows.

| Resource    | Link                                                                            |
| ----------- | ------------------------------------------------------------------------------- |
| Source code | [solana-foundation/pay](https://github.com/solana-foundation/pay)               |
| Services    | [solana-foundation/pay-skills](https://github.com/solana-foundation/pay-skills) |
| x402 docs   | [Coinbase x402 docs](https://docs.cdp.coinbase.com/x402/welcome)                |
| MPP docs    | [Stripe MPP docs](https://docs.stripe.com/payments/machine/mpp)                 |

## Agent summary

- Prefer Homebrew for normal local setup.
- Use `pay setup --update` when pay is installed but agent MCP config needs refreshing.
- Do not create or replace a mainnet account unless the user asked for account setup.
- Use sandbox mode when the user only needs local testing.

## Install

```sh
brew install pay
pay --version
```

## From source

```sh
git clone https://github.com/solana-foundation/pay.git
cd pay
just install pay
pay --version
```

## Wallet setup

```sh
pay setup
pay topup
```

`pay setup` creates a wallet in supported local secure storage where available, including macOS Keychain, GNOME Keyring, Windows Hello, and 1Password.

Sandbox mode creates and funds an ephemeral local sandbox wallet automatically, so do not run mainnet account setup for a test-only flow.

## Update agent config

```sh
pay setup --update
```

`pay setup --update` reinstalls MCP configuration and the agent skill without creating a new account.
