# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Repository shape

This is a **mixed monorepo**: a Next.js web app at the root, Solana programs under `programs/escrow/`, and TypeScript packages under `packages/`. The root `package.json` is named `web` — it is *only* the Next.js app, not a workspace root. Each `packages/*` package has its own `package.json` and is installed independently (sibling packages reference each other via `file:../<pkg>`).

- `app/`, `components/`, `lib/`, `providers/`, `public/` — Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui + Solana wallet adapter
- `programs/escrow/` — legacy Anchor reference implementation containing all on-chain instructions (escrow, registry, reputation commit/reveal, attestation, MagicBlock PER CPI). Cargo workspace is rooted at the repo top via `Cargo.toml`. **Demo target is the Quasar program set** (four programs: registry, escrow, reputation, attestation) deployed to devnet per `config/quasar/deployments.json` — Quasar cutover completed 2026-05-06; the Anchor program remains for historical comparison only.
- `packages/x402-solana` — x402 payment-gate middleware (consumed by ElizaOS, SendAI, MCP bridge, demo agents)
- `packages/per-client` — MagicBlock PER (Private Ephemeral Rollup) delegation client
- `packages/demo-agents` — A→B→C devnet demo (orchestrator, specialist, judge wallets)
- `packages/rap-mcp-bridge`, `packages/eliza-plugin-x402`, `packages/sendai-x402`, `packages/openrouter-specialists`, `packages/testing-specialists` — framework-integration surfaces
- `e2e/` — Playwright specs (web server is started by Playwright on port **3010** with `NEXT_PUBLIC_ENABLE_PLAYWRIGHT_WALLET=true`)
- `scripts/` — large collection of smoke / evidence / readiness scripts (mostly `.mjs`), wired into `package.json` scripts
- `config/networks/{devnet,mainnet,local-surfpool}.json` and `config/quasar/deployments.json` drive runtime network selection
- `docs/` — extensive runbooks and BDD plans; `artifacts/` — generated evidence packs (do not hand-edit)

## Common commands

```bash
# Dev server (port 3000 normally; Playwright uses 3010)
npm run dev

npm run build         # next build
npm run lint          # eslint
```

**Jest** is configured (`jest.config.js`) but the root `package.json` has **no `test` script** — run it directly:

```bash
npx jest                                    # all lib/** tests
npx jest lib/__tests__/jupiter-client.test.ts  # single file
npx jest -t "registers an agent"             # by test-name pattern
```

**Playwright e2e** (auto-starts the dev server on 3010 unless `PLAYWRIGHT_BASE_URL` is set):

```bash
npm run test:e2e
npm run test:e2e -- e2e/onboarding.spec.ts   # single file
npm run test:e2e:ui                          # interactive UI mode
PLAYWRIGHT_BASE_URL=https://agent-protocol.reddi.tech npm run test:e2e
```

**Anchor program** (from repo root — `Anchor.toml` lives here, `Cargo.toml` is the workspace root):

```bash
anchor build
anchor test                                   # litesvm-based Rust tests under programs/escrow/tests/
cargo test -p escrow                          # same tests, direct cargo invocation
anchor deploy --provider.cluster devnet       # see DEPLOY.md before redeploying
```

**Demo agents** (separate package — `cd packages/demo-agents`):

```bash
npm run fund          # airdrop devnet SOL to A/B/C wallets
npm run register      # register agents on-chain
npm run demo          # run full A→B→C cycle (uses .env.devnet — gitignored)
```

The repo has a *huge* set of `npm run` scripts for smoke/evidence/readiness checks (BDD sweeps, Surfpool runs, Quasar deployment checks, Jupiter quote proofs, Umbra adapters, RAP-MCP bridge, etc.). Don't run these speculatively — many spend devnet SOL, hit live RPCs, or generate evidence artifacts. Read the script before invoking.

## Network profile resolution

Runtime network is **not** hard-coded — it comes from `lib/config/network.ts` via `getNetworkProfile()`. Anywhere code references `ESCROW_PROGRAM_ID`, `DEVNET_RPC`, etc., the source is `config/networks/<profile>.json`. Profile selection:

- `NETWORK_PROFILE` / `NEXT_PUBLIC_NETWORK_PROFILE`: `devnet` (default), `mainnet`, or `local-surfpool` (aliases: `local`, `localnet`, `surfpool`)
- `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar` switches the devnet profile to the Quasar program set (uses `config/quasar/deployments.json`)
- `NEXT_PUBLIC_RPC_ENDPOINT` overrides RPC; `NEXT_PUBLIC_ESCROW_PROGRAM_ID` overrides the program id (but is **ignored on legacy-anchor devnet** unless `ALLOW_UNSAFE_ESCROW_OVERRIDE=true` — guard against accidental hijacks)

When debugging "wrong program id" or "wrong RPC", check these env vars before assuming the code is wrong.

## On-chain programs

The legacy Anchor implementation in `programs/escrow/` has all instructions in a single program, grouped by phase in `lib.rs`:

- **Escrow:** `lock_escrow`, `release_escrow`, `cancel_escrow`
- **Registry:** `register_agent`, `update_agent`, `deregister_agent`
- **Reputation (commit-reveal):** `commit_rating`, `reveal_rating`, `expire_rating`
- **Attestation:** `attest_quality`, `confirm_attestation`, `dispute_attestation`
- **MagicBlock PER:** `delegate_escrow`, `release_escrow_per` (CPI in `magicblock_cpi.rs`)

PDA seeds (`escrow`, `agent`, `rating`, `attestation`) and Anchor discriminators are mirrored in `lib/program.ts` — if you change a seed or rename an instruction, update **both** the Rust `constants.rs` and the TS `lib/program.ts`.

**Demo target is Quasar, not Anchor.** As of the 2026-05-06 cutover (`config/quasar/deployments.json`), the protocol deploys four separate Quasar programs to devnet:

- Registry: `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Escrow: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- Reputation: `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6` (audit-hardened commit-reveal: `sha256(score‖salt‖job_id‖program_id)`)
- Attestation: `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`

The legacy Anchor program id is `794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD` (per `config/quasar/deployments.json` → `legacyAnchorReference`) — historical comparison only, **must not** be used as the demo target. MagicBlock PER/TEE live execution is explicitly **not** part of the final Quasar claim. The `77rkRQxe…UZXmX` id that appears in some older `declare_id!` macros, `Anchor.toml` entries, and stale docs is even earlier doc rot — ignore it. See `DEPLOY.md` for redeploy procedure.

## Protocol economics

The protocol fee is **0.05% per transaction**, only on settlement (zero on failure). If you encounter `16.7%` / `83.3%` figures anywhere in `docs/`, BDD specs, or older runbooks, that's stale doc rot from before the fee was reset — flag it as a doc fix.

## Conventions to respect

- **Don't trust your Next.js training data.** This is Next.js 16 + React 19 — App Router only, breaking changes throughout. Per `AGENTS.md`, read `node_modules/next/dist/docs/` for the actual API before writing routes/middleware/server actions.
- **Don't run destructive devnet scripts speculatively.** Anything under `scripts/run-*` or `scripts/check-*` that ends in `-devnet`, `-live`, `-surfpool`, or `evidence` may spend SOL, sign transactions, or overwrite artifacts. Prefer dry-run/plan variants where they exist (e.g. `plan-economic-demo-devnet-usdc-sender.mjs`).
- **Artifacts and evidence packs are generated.** Don't hand-edit files under `artifacts/`. Regenerate with the corresponding `npm run evidence:*` / `generate-*` script.
- **STATUS.md is a rolling log,** not a source of truth about current code state. The most recent entry is at the top; older entries reflect intermediate states.
