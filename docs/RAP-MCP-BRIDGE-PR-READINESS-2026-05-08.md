# RAP MCP Bridge — PR Readiness Checklist

_Date: 2026-05-08 AEST_
_Branch: `feature/rap-mcp-bridge-design-demo`_

## Scope implemented locally

### Safe MCP bridge package

`packages/rap-mcp-bridge`

- stdio MCP server
- dry-run-only first PR policy
- exactly four tools:
  - `reddi.discover_specialists`
  - `reddi.request_quote`
  - `reddi.verify_receipt`
  - `reddi.export_disclosure_ledger`
- localhost-only RAP backend URL policy
- structured backend-unreachable response
- synthetic non-binding quote generation
- deterministic canonical JSON hashing
- dry-run verifier that never claims payment settlement
- safe public disclosure-ledger export
- local idempotent JSON store
- repeatable MCP stdio smoke script
- README with config, threat model, and “what this does not prove”

### Demo route

`/mcp-bridge-demo`

- static judge-facing demo page
- quote-only → Surfpool local proof → bounded devnet proof ladder
- explicit permission boundary: devnet only after Surfpool proof; no mainnet
- non-binding synthetic quote panel
- disclosure-ledger panel
- recording script cards

### Design artifacts

- `docs/RAP-MCP-BRIDGE-DESIGN-2026-05-08.md`
- `docs/RAP-MCP-BRIDGE-SCHEMAS-2026-05-08.md`
- `docs/RAP-MCP-BRIDGE-PACKAGE-PLAN-2026-05-08.md`
- `docs/RAP-MCP-BRIDGE-OAD-SPEC-2026-05-08.md`
- `docs/RAP-MCP-BRIDGE-HOST-INTEGRATIONS-2026-05-08.md`
- `docs/RAP-MCP-BRIDGE-DEMO-SITE-PLAN-2026-05-08.md`

## Safety checklist

- [x] No payment tool exposed.
- [x] No invoke tool exposed.
- [x] Non-dry-run policy modes fail closed.
- [x] `REDDI_RAP_BASE_URL` restricted to localhost/127.0.0.1/::1 over HTTP(S).
- [x] Backend fetch errors return structured `backend_unreachable` dry-run response.
- [x] Synthetic quotes include `quoteAuthority="bridge_synthetic"` and `binding=false`.
- [x] Dry-run verifier returns `verified=false`; payment check is `not_applicable`.
- [x] Private payload class rejected by schema.
- [x] No arbitrary specialist URL fetch.
- [x] No local file-path input support.
- [x] Disclosure ledger excludes raw prompts/outputs and contains safe public evidence only.
- [x] Idempotency key reuse with different request body fails closed.
- [x] Package build output ignored via `.gitignore`.

## Validation run

Passed locally:

```bash
npm --prefix packages/rap-mcp-bridge test
npm --prefix packages/rap-mcp-bridge run smoke:stdio
npx eslint packages/rap-mcp-bridge/src packages/rap-mcp-bridge/tests app/mcp-bridge-demo/page.tsx lib/mcp-bridge-demo/fixture.ts
npm run check:product:naming -- packages/rap-mcp-bridge/src/server.ts packages/rap-mcp-bridge/README.md app/mcp-bridge-demo/page.tsx lib/mcp-bridge-demo/fixture.ts docs/RAP-MCP-BRIDGE-DEMO-SITE-PLAN-2026-05-08.md
npm run build
```

Current package test count: 13/13 passing.

Root build notes:

- `/mcp-bridge-demo` prerenders successfully as a static route.
- Build emits pre-existing Turbopack/NFT warnings around `lib/economic-demo/webpage-live-workflow-evidence-server.ts` and workspace-root inference. These warnings are not introduced by the MCP bridge route/package.

## Known non-goals / claim boundaries

- No payment settlement proven.
- No devnet spend performed by this PR.
- No mainnet path.
- No specialist endpoint invoked.
- No backend quote endpoint added yet.
- No remote RAP backend allowlist yet.
- No HTTP/SSE MCP transport yet.

## Recommended PR title

`feat: add safe dry-run RAP MCP bridge and demo scaffold`

## Recommended PR body

```md
## Summary

Adds a dry-run-only RAP MCP Bridge MVP and a static `/mcp-bridge-demo` page.

The MCP package exposes only safe first-slice tools: discovery, synthetic quote generation, dry-run verification, and disclosure ledger export. It intentionally exposes no payment or invoke tools.

## Safety boundaries

- dry-run only
- no payment/invoke tools
- localhost-only RAP backend URL
- synthetic quotes are `quoteAuthority="bridge_synthetic"`, `binding=false`
- verifier never claims payment settlement
- private payloads rejected by schema
- no arbitrary URL/file access

## Validation

- `npm --prefix packages/rap-mcp-bridge test` — 13/13 pass
- `npm --prefix packages/rap-mcp-bridge run smoke:stdio` — pass
- targeted ESLint — pass
- product naming check — pass
- `npm run build` — pass; pre-existing Turbopack/NFT warnings noted

## Claim boundary

This PR does not perform or prove payment settlement. Devnet spend remains gated behind Surfpool local proof and explicit bounded approval.
```

## Next recommended slice

Before devnet spend:

1. Add Surfpool local proof generator for MCP quote/payment semantics.
2. Generate artifact under `artifacts/rap-mcp-bridge-surfpool-local/<timestamp>/`.
3. Add `/mcp-bridge-demo` Surfpool evidence panel backed by artifact.
4. Review local proof.
5. Only then run bounded devnet spend.

---

# Loop 13 Update — Surfpool local transaction proof

Added executable local proof script:

```bash
npm run smoke:rap-mcp-bridge:surfpool-local
```

Latest successful artifact:

```text
artifacts/rap-mcp-bridge-surfpool-local/20260507T145133Z/SUMMARY.md
artifacts/rap-mcp-bridge-surfpool-local/20260507T145133Z/summary.json
```

Proof boundary:

- `schemaVersion=reddi.rap-mcp-bridge.surfpool-executed.v1`
- local Surfpool validator only
- no devnet mutation
- no mainnet path
- no specialist HTTP invocation

Successful local semantics:

- downstream specialist transfer executed
- protocol rail fee transfer executed
- specialist credited expected amount: `true`
- protocol treasury credited expected 0.05% fee: `true`
- local payment semantics: `pass`

This satisfies the local proof prerequisite for designing a bounded devnet spend, but devnet should still be a separate loop with explicit cap/command/artifact path.

---

# Loop 14 Update — bounded devnet proof

Added executable bounded devnet script:

```bash
npm run smoke:rap-mcp-bridge:devnet-proof
```

Latest successful artifact:

```text
artifacts/rap-mcp-bridge-devnet-proof/20260507T145907Z/SUMMARY.md
artifacts/rap-mcp-bridge-devnet-proof/20260507T145907Z/summary.json
```

Proof boundary:

- `schemaVersion=reddi.rap-mcp-bridge.devnet-proof.v1`
- Solana devnet only
- no mainnet path
- no specialist HTTP invocation
- explicit default max debit cap: `100050` lamports

Successful devnet semantics:

- host funding source: existing balance, no new successful faucet airdrop in final run
- recipient setup: existing balances, no new recipient setup transfer in final run
- downstream tx: `62CP7sHi9KyUDbnVFgM5WCvwiSq2p5WCkThsTkNrpqYnUxLGN9QNRDjye1nBDB7UWjgqtonoYbuKxawjzAvWrUgD`
- protocol fee tx: `5kV43JjPAWQBbzTohbP3y8ZsUCXPZpBSDLbPkmw1odSVoZXtJER3LJ7PiRBUL3DuD5jPUPM66NjMxSQTcuQcUsjp`
- specialist credited expected amount: `true`
- protocol treasury credited expected fee: `true`
- spend cap respected: `true`
- devnet payment semantics: `pass`

Review note: the first devnet attempt exposed a real operational constraint: devnet faucet 429/rent checks. The script now avoids extra faucet calls when deterministic wallets already have enough balance and uses host-funded recipient setup only when required.

---

# Loop 16 Update — final readiness sweep

Changed-file state:

- tracked modifications: `.gitignore`, `STATUS.md`, `package.json`
- untracked PR files: 37 source/doc/package files
- generated runtime artifacts remain ignored under `artifacts/`
- package build output remains ignored under `packages/rap-mcp-bridge/dist/`

Safety checks:

- `git diff --check` passed
- untracked-file credential scan found no sensitive material or local env/keypair/PEM paths
- no ignored `artifacts/` files are staged/tracked

Final validation set from the latest loops:

```bash
npm --prefix packages/rap-mcp-bridge test
npm --prefix packages/rap-mcp-bridge run smoke:stdio
npm run smoke:rap-mcp-bridge:surfpool-local
npm run smoke:rap-mcp-bridge:devnet-proof
npx eslint lib/mcp-bridge-demo/fixture.ts app/mcp-bridge-demo/page.tsx scripts/run-rap-mcp-bridge-devnet-proof.mjs
npm run check:product:naming -- lib/mcp-bridge-demo/fixture.ts app/mcp-bridge-demo/page.tsx scripts/run-rap-mcp-bridge-devnet-proof.mjs
npm run build
```

Readiness verdict: PR-ready locally, with the explicit boundary that the package remains dry-run only and payment/invoke tools are not exposed by the MCP bridge. Surfpool/devnet proof scripts are evidence helpers, not MCP payment tools.
