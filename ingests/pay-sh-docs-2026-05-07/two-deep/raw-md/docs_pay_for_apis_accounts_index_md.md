# Accounts and wallets

> Create, import, list, fund, export, and remove local pay accounts.

pay stores wallet keys in local secure storage where possible. Mainnet signing should remain user-authorized unless the user explicitly chooses another mode.

## Agent summary

- Do not create, replace, export, or delete accounts unless the user asked.
- Prefer sandbox mode for tests because it uses a local sandbox account.
- Use `pay account list` before assuming which mainnet account exists.

## Setup

```sh
pay setup
pay account list
pay topup
```

Supported secure storage includes macOS Keychain, GNOME Keyring, Windows Hello, and 1Password when available. `pay topup` adds funds to the selected wallet later.

You do not need to fund a mainnet wallet for sandbox examples. Sandbox mode creates and funds an ephemeral local account automatically.

## Account management

```sh
pay account new --name work
pay account import ./keypair.json --name imported
pay account default work
pay account export --name work
pay account remove work
```

Use `--account <name>` with top-level pay commands to select a named account.
