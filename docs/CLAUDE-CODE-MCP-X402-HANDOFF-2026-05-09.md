# Claude Code MCP x402 — Handoff Note

_Date: 2026-05-09 AEST_

## Branch

`feature/claude-code-mcp-x402-demo`

Local commits over `main`:

1. `6045db55 feat: add gated devnet x402 MCP specialist demo`
2. `8b5b75e7 docs: enforce Reddi Agent Protocol naming in MCP demo`
3. `95db7b14 docs: point PR readiness at strict naming capture`

A follow-up local commit may include the Loop 43 final-gate test robustness fix and this handoff note.

## Canonical demo artifact

Use this bundle for review/submission handoff:

`artifacts/claude-code-mcp-x402-peekaboo-demo/final-bundle-20260508T231415Z-strict-naming-live.zip`

SHA256:

`b293e26fdbe8d30c5791a8e263541393b9302131961e83414ef8f164049584b0`

Do **not** use older locked-screen, replay, or pre-strict-naming captures except as historical troubleshooting notes.

## Product naming rule

- Product name: **Reddi Agent Protocol**.
- Short form: **RAP**.
- Avoid standalone “Reddi” as the product name.
- Literal URLs/package IDs may contain `reddi`.
- Recording start line: `Starting Claude Code with Reddi Agent Protocol MCP tools...`

## Canonical recording proof

- Receipt: `x402_specialist_0460d1e4214ab0f0ddb7d667`
- Devnet tx: `3oVM9kKqMME6J4sufvWRT5s6F1N9HcLnUGTDeLbxXQNyuAEkC7Nt4JxKs9aoxun7FVTCvzeS4Pwt2PqPMwF1oGGV`
- Amount: `0.05 USDC`
- Cap: `60000` micro-USDC
- Boundary: `solana-devnet-only-no-mainnet`
- Video: `154.9s`, `1440x810`, `1549` frames

## Final local gates from Loop 43

Passed:

```bash
npm run build --prefix packages/x402-solana
npm test --prefix packages/x402-solana -- --runInBand
npm run build --prefix packages/rap-mcp-bridge
npm test --prefix packages/rap-mcp-bridge
npm --prefix packages/rap-mcp-bridge run smoke:x402-tool-list
bash -n scripts/run-claude-code-mcp-x402-recording-demo.sh
unzip -t artifacts/claude-code-mcp-x402-peekaboo-demo/final-bundle-20260508T231415Z-strict-naming-live.zip
```

Forbidden shorthand scan passed for:

- `Reddi MCP`
- `Reddi paid`
- `Reddi backend`
- `Reddi code-generation`

## Loop 43 retrospective

The final gate caught a flaky privacy test in `packages/x402-solana/tests/client.test.ts`. The original assertion checked that the serialized readiness output did not contain `String(keypair.secretKey[0])`, but that short numeric fragment can naturally occur inside safe numeric fields such as `150000`.

The fix now checks the actual risk boundary: the serialized output must not contain the full secret-key JSON array or base64-encoded secret key.

## External actions still pending approval

- Push branch to GitHub.
- Open PR.
- Upload/share final bundle outside the local workspace.
