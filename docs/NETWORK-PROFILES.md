# Network Profiles

This project supports configuration-first network switching using `NETWORK_PROFILE`.

## Supported profiles

- `local-surfpool`
- `devnet` (default)
- `mainnet`

Profile definitions live in:
- `config/networks/local-surfpool.json`
- `config/networks/devnet.json`
- `config/networks/mainnet.json`

## Resolution order

Runtime values are resolved from profile defaults, then optional env overrides:

- RPC: `NEXT_PUBLIC_RPC_ENDPOINT` (or `DEMO_DEVNET_RPC` in demo scripts)
- Program ID: `NEXT_PUBLIC_ESCROW_PROGRAM_ID` (or `DEMO_ESCROW_PROGRAM_ID`)
- PER RPC: `NEXT_PUBLIC_PER_RPC` (or `DEMO_PER_RPC`)

Resolver module:
- `lib/config/network.ts`

Explorer URL helpers:
- `lib/config/explorer.ts`

## Examples

### Devnet (default)
```bash
NETWORK_PROFILE=devnet
```

### Local Surfpool
```bash
NETWORK_PROFILE=local-surfpool
NEXT_PUBLIC_RPC_ENDPOINT=http://127.0.0.1:18999
NEXT_PUBLIC_ESCROW_PROGRAM_ID=<local-deployed-program-id>
```

### Mainnet
```bash
NETWORK_PROFILE=mainnet
NEXT_PUBLIC_RPC_ENDPOINT=<mainnet-rpc>
NEXT_PUBLIC_ESCROW_PROGRAM_ID=<audited-mainnet-program-id>
NEXT_PUBLIC_PER_RPC=<mainnet-tee-endpoint>
```

## Mainnet note

Mainnet switching is config-only **after** the audited program is deployed once to mainnet.
Clusters are separate ledgers, so a one-time deployment on target cluster is still required.

## Read-only readiness check

Run a read-only mainnet readiness probe before cutover:

```bash
NETWORK_PROFILE=mainnet npm run test:mainnet:readiness
```

Artifacts are written to:
- `artifacts/mainnet-readiness/<timestamp>/SUMMARY.md`
- `artifacts/mainnet-readiness/<timestamp>/result.json`

Current expected blocker before first mainnet deploy:
- `program_executable` fails until audited escrow program is deployed to mainnet and `NEXT_PUBLIC_ESCROW_PROGRAM_ID` points to that deployed address.
