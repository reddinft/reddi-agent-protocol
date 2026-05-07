# Wallets

> Reference for pay account, setup, topup, solana, and send.

Wallet commands manage local accounts and direct Solana interactions.

## Agent summary

- Do not run account mutation commands unless requested.
- Use `pay account list` to inspect configured accounts.
- Use `pay setup --update` to refresh agent config without creating a new account.
- Treat `send`, `export`, and `remove` as high-intent commands.

## Setup and funding

```sh
pay setup
pay setup --update
pay topup
pay topup --sandbox
```

## Accounts

```sh
pay account new --name work
pay account import ./keypair.json --name imported
pay account list
pay account default work
pay account export --name work
pay account remove work
```

## Solana passthrough

```sh
pay solana balance
pay solana transfer <recipient> 0.1
```

## Send SOL

```sh
pay send 0.1 <recipient>
pay send '*' <recipient>
```
