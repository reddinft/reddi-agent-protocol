# Sandbox and networks

> Choose sandbox, localnet, mainnet, accounts, and output modes intentionally.

Network flags force how pay interprets and satisfies payment challenges.

## Agent summary

- Use `--sandbox` for tests and examples.
- Use `--mainnet` only when the user intends to spend real funds.
- Use `--local` only when a local Surfpool RPC is running.
- Use `--account` when the user specifies a named account.

## Flags

```sh
pay --sandbox curl <url>
pay --local curl <url>
pay --mainnet curl <url>
pay --account work curl <url>
```

## Output

```sh
pay --sandbox --output json curl <url>
pay --sandbox --verbose curl <url>
```

Only display transaction, signature, session, or status details when the command output actually includes them.
