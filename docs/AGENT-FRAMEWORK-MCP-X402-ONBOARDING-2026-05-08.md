# Agent Framework Onboarding — MCP + reddi-x402

_Date: 2026-05-08 AEST_

## Purpose

Help users with existing agent frameworks add Reddi Agent Protocol as a specialist discovery, quote, payment, verification, and disclosure layer without replacing their current orchestration stack.

Target hosts:

- OpenClaw
- OpenSwarm-style orchestrators
- Claude Code / Claude Desktop MCP clients
- Codex / OpenAI-style coding agents
- Custom agent runtimes

## Safety model

Default behavior is quote-first and dry-run-safe.

1. Discover specialists.
2. Request a quote.
3. Check budget, trust, privacy, and human approval policy.
4. Pay/invoke only when explicitly enabled.
5. Verify receipt and output evidence.
6. Export disclosure ledger when specialist output influences final work.

Never silently spend. Never send private payloads by default. Never rely on unverified paid output as authoritative evidence.

## MCP server setup

Use the Reddi Agent Protocol MCP bridge when the host supports MCP.

Example config:

```json
{
  "mcpServers": {
    "reddi-agent-protocol": {
      "command": "node",
      "args": ["/absolute/path/to/packages/rap-mcp-bridge/dist/src/server.js"],
      "env": {
        "REDDI_RAP_BASE_URL": "http://localhost:3000",
        "REDDI_MCP_POLICY_MODE": "dry_run",
        "REDDI_MCP_ALLOW_INVOKE": "false",
        "REDDI_MCP_ALLOW_PAYMENT": "false",
        "REDDI_MCP_HOST_FRAMEWORK": "claude"
      }
    }
  }
}
```

Expected tools in dry-run mode:

- `reddi.discover_specialists`
- `reddi.request_quote`
- `reddi.verify_receipt`
- `reddi.export_disclosure_ledger`

Payment/invocation tools must not be exposed until local Surfpool rehearsal and explicit devnet approval gates pass.

## OpenClaw instructions

Add a project skill or playbook that tells OpenClaw:

```md
When a task might benefit from paid external specialist agents, use Reddi Agent Protocol MCP tools.

Rules:

- Read the project STATUS.md first.
- Discover specialists before quoting.
- Request quote before any paid work.
- In dry-run mode, stop after quote and export disclosure ledger plan.
- For live/devnet mode, require explicit approval, spend cap, network allowlist, and receipt logging.
- Log quotes, approvals, payment receipts, specialist outputs, and disclosure ledgers to project artifacts.
- Update STATUS.md and memory after any payment or externally sourced specialist output.
```

Recommended OpenClaw default:

```bash
REDDI_MCP_POLICY_MODE=dry_run
REDDI_MCP_ALLOW_PAYMENT=false
REDDI_MCP_ALLOW_INVOKE=false
```

## OpenSwarm-style instructions

Patch the orchestrator instructions/AGENTS file:

```md
Use Reddi Agent Protocol as an external paid-specialist marketplace, not as the primary orchestrator.

Flow:

1. Use `reddi.discover_specialists` for external capability discovery.
2. Use `reddi.request_quote` for terms and budget.
3. If quote requires spend, stop for approval unless a bounded spend policy is already active.
4. Invoke/pay only when Reddi Agent Protocol policy exposes those tools and the user approved the spend.
5. Verify receipts and include the disclosure ledger in final artifacts.
```

Demo prompt:

> Build a market brief using paid research only if the quote is under $2, evidence is verifiable, and the disclosure ledger can be included.

Dry-run expected result: the swarm should mention that a specialist quote was available but not paid/invoked.

## Claude Code / Claude Desktop

Use the MCP config above. Add this host prompt:

```md
You have Reddi Agent Protocol tools for external paid specialist agents.
Use discovery and quote tools freely in dry-run mode.
Do not invoke or pay unless the user explicitly approves the exact quote, network, spend cap, and data-sharing boundary.
Verify receipts before relying on paid specialist output.
Include disclosure ledger details when specialist output influences final work.
```

## Codex / custom agents

If MCP is unavailable, use a thin wrapper around Reddi Agent Protocol HTTP endpoints with the same policy sequence:

```text
resolve/discover -> request quote -> approval -> pay/invoke if enabled -> verify -> export disclosure ledger
```

Do not call arbitrary specialist URLs directly from the agent runtime. Use the bridge or backend allowlist so payment, receipt, and disclosure state stays auditable.

## reddi-x402 for specialist agents

Specialist builders use `reddi-x402` to put a payment gate in front of their agent endpoint.

Minimum specialist path:

1. Run a useful specialist endpoint.
2. Add x402 challenge middleware using `reddi-x402`.
3. Publish capability, rate, health, and endpoint metadata.
4. Register the specialist on devnet.
5. Return receipts/evidence that consumer agents can verify.

Specialist endpoint contract:

- no payment header -> return x402 challenge
- valid payment receipt -> execute scoped work
- invalid receipt -> reject closed
- include receipt references in response metadata

## Consumer-agent wallet delegation

Consumer agents should not receive unlimited wallet authority.

Recommended delegation shape:

- owner wallet stays human/operator-controlled
- agent receives a bounded delegate/session authority
- caps: max per call, max total, expiry time, allowed network, allowed specialist registry/program IDs
- payment receipts must be logged
- unused authority should expire or be revoked

For demos, prefer:

1. dry-run quote mode
2. Surfpool local validator mode
3. bounded devnet mode with tiny caps
4. mainnet only with separate explicit approval

## Demo collateral plan

Before recording:

```bash
npm run test:e2e:marketplace-conversion -- --project=chromium
npm run smoke:rap-mcp-bridge:surfpool-local
npm run smoke:economic-demo:surfpool
npm run smoke:rap-mcp-bridge:devnet-proof
```

Record the session only after BDD and Surfpool pass. The script should follow the actual recording:

1. Existing agent framework connects through MCP.
2. Consumer agent discovers and quotes specialists.
3. Specialist path shows how builders monetize through `reddi-x402`.
4. Surfpool proof shows local on-chain semantics.
5. Devnet proof shows bounded real-network evidence.
6. Attestor path verifies receipts/output/reputation.

## Boundaries

- Do not claim mainnet settlement unless separately approved and proven.
- Do not claim arbitrary specialist invocation without allowlist/gating.
- Do not claim Jupiter devnet execution as reliable.
- Do not expose secrets/private payloads by default.
- Do not bypass human approval for paid execution.
