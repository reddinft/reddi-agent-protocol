# Global flags

> Flags that select network, account, output, approval, and debugger behavior.

Global flags come before the subcommand.

## Agent summary

- Use `--sandbox` for tests and examples.
- Use `--mainnet` only for real funds.
- Use `--account <name>` when the user specifies a named account.
- Use `--debugger` when payment flow inspection is needed.

## Network flags

```sh
pay --sandbox curl <url>
pay --local curl <url>
pay --mainnet curl <url>
```

## Account and output

```sh
pay --account work curl <url>
pay --output json curl <url>
pay --verbose curl <url>
```

## Approval behavior

```sh
pay --yolo curl <url>
```

`--yolo` automatically satisfies 402 challenges after the user approves a spending cap. Do not use it unless the user intends capped auto-pay behavior.
