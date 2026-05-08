# Marketplace Demo Storyboard — 2026-05-08

## Source packet

Use the readiness harness packet as the source of truth:

```text
artifacts/marketplace-demo-readiness/20260508T114520Z/summary.json
artifacts/marketplace-demo-readiness/20260508T114520Z/marketplace-recording.webm
```

Fresh local Surfpool proof artifacts from the same run:

- RAP MCP Bridge local payment semantics: `artifacts/rap-mcp-bridge-surfpool-local/20260508T114531Z/SUMMARY.md`
- Economic demo local rehearsal: `artifacts/economic-demo-surfpool-rehearsal/20260508T114535Z/SUMMARY.md`
- Onboarding/attestation local smoke: `artifacts/surfpool-onboarding/20260508-214541/SUMMARY.md`

## Core claim

Reddi Agent Protocol lets existing agent systems discover, quote, pay, verify, and disclose specialist-agent work without replacing the host framework.

## Video beats

### Beat 1 — Homepage promise

Visual: homepage hero.

Narration:

> Reddi Agent Protocol is the marketplace rail for agent commerce. Existing agents can discover, pay, verify, and rate specialist agents instead of doing every task themselves.

### Beat 2 — Existing agent systems connect through MCP

Visual: click “Connect your agent system” and land on `/mcp-bridge-demo`.

Narration:

> If you already run OpenClaw, Claude Code, Codex, OpenSwarm-style agents, or a custom runtime, you can keep your orchestration stack. The MCP bridge gives those agents a safe quote-first path into specialist discovery.

Boundary line:

> The default mode is dry-run and quote-first. Payment and invocation are gated.

### Beat 3 — Policy before payment

Visual: planner path.

Narration:

> A consumer agent does not just call an endpoint. It resolves candidates by capability, price, trust, privacy mode, and budget policy before any x402 payment is attempted.

### Beat 4 — Specialist monetization path

Visual: `/register`.

Narration:

> Specialist builders can publish capabilities and pricing, add `reddi-x402` payment gates, and list their agents so consumer agents can hire them for scoped work.

### Beat 5 — Attestor verification path

Visual: `/attestation`, resolve attestor.

Narration:

> Attestor agents verify outputs, receipts, release criteria, and reputation updates. That turns paid specialist work into an auditable trail, not a blind API call.

### Beat 6 — Economic demo proof

Visual: `/economic-demo`, money + work graph and boundary copy.

Narration:

> The economic demo ties the story together: one request becomes quoted specialist work, payment evidence, attestation, and a disclosure ledger.

Boundary line:

> This recording is local-first. Surfpool validates the on-chain semantics before any bounded devnet proof. No mainnet execution is claimed.

### Beat 7 — Surfpool proof packet

Visual: terminal/artifact summary.

Narration:

> Before devnet, the readiness harness runs the conversion BDD, captures the recording journey, and proves MCP bridge, economic-demo, and onboarding-attestation flows on a local Surfpool validator.

Show:

```text
npm run demo:marketplace:readiness
```

### Beat 8 — Optional bounded devnet follow-up

Visual: command or runbook, not necessarily executed in the first video.

Narration:

> When the local gates are green, the same harness can opt into a bounded devnet proof. Devnet is explicit; mainnet remains out of scope unless separately approved and proven.

Show:

```text
npm run demo:marketplace:readiness -- --include-devnet
```

## Suggested short script (60–90 seconds)

> Your agent should not need to do every job itself. Reddi Agent Protocol gives existing agent systems a marketplace rail for specialist work: discover, quote, pay, verify, and disclose.
>
> Here, an operator connects an existing agent system through the MCP bridge. The host can be OpenClaw, Claude Code, Codex, OpenSwarm-style orchestration, or a custom runtime. The default path is quote-first and dry-run safe.
>
> In the planner, the consumer agent applies policy before payment: task type, spend cap, privacy mode, and attestation requirements. No specialist is paid just because it was discovered.
>
> Specialist builders can register their agents, publish capabilities and pricing, and add `reddi-x402` payment gates so other agents can hire them for scoped work.
>
> Attestor agents close the loop. They verify outputs, receipt chains, release criteria, and reputation updates so paid work becomes auditable evidence.
>
> Before recording or touching devnet, we run the full local readiness harness. It checks the conversion BDD, captures this Playwright journey, and proves the MCP bridge, economic-demo, and onboarding-attestation flows on Surfpool local validator.
>
> Once those local gates pass, a bounded devnet proof can be run explicitly. This demo does not claim mainnet execution. It shows the path from existing agent frameworks to paid specialist-agent commerce with safety gates and evidence built in.

## Final recording checklist

- Run `npm run demo:marketplace:readiness`.
- Confirm `summary.json` has `ok: true`.
- Confirm `marketplace-recording.webm` exists and is long enough for narration.
- If devnet proof is desired, rerun with `--include-devnet` only after reviewing local artifacts.
- Build final script from the captured packet and current claim boundaries.
