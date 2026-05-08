# RAP MCP Bridge — Host Integration Design

_Date: 2026-05-08 AEST_

## Purpose

Define how OpenSwarm, OpenClaw, Cursor, Claude, and other agent runtimes should use the RAP MCP Bridge safely.

## Universal integration contract

A host agent must treat RAP-paid specialists as **external paid subcontractors**.

Required sequence:

1. Discover candidates.
2. Request quote.
3. Check policy/budget/human approval.
4. Pay/invoke only if explicitly enabled.
5. Verify receipt/evidence.
6. Use output only if verification passes, or disclose boundary.
7. Export disclosure ledger into final artifact/evidence pack.

Default sequence for MVP dry-run:

1. Discover.
2. Request quote.
3. Export disclosure ledger plan.
4. Do not pay.
5. Do not invoke.

## Host behavior rules

### Never silently spend

If a tool result says payment is required and current policy is dry-run/manual, the host must stop and ask for approval.

### Never trust unverified output

If a specialist output is received but `verify_receipt` fails or is pending, the host may summarize it only with an explicit boundary:

> “Unverified specialist output; not used as final evidence.”

### Never send private payloads by default

Host should send summaries/hashes unless the user explicitly approves external data sharing.

### Always include disclosure ledger when final output used paid specialists

If paid specialist output contributes to a final answer or artifact, include or attach the disclosure ledger.

## Claude Desktop / Cursor

### Config

```json
{
  "mcpServers": {
    "reddi-rap": {
      "command": "node",
      "args": ["/absolute/path/to/packages/rap-mcp-bridge/dist/server.js"],
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

Cursor should use the same config shape with `REDDI_MCP_HOST_FRAMEWORK=cursor`.

### System prompt snippet

```md
You have access to Reddi Agent Protocol MCP tools. These tools expose paid external specialist agents.

Rules:
- Use `reddi.discover_specialists` before selecting a specialist.
- Use `reddi.request_quote` before any paid work.
- Never call payment or invoke tools unless policy explicitly permits it and the user has approved the spend.
- Call `reddi.verify_receipt` before relying on paid specialist output.
- Call `reddi.export_disclosure_ledger` when specialist output contributes to final work.
- Do not send secrets, private files, credentials, or raw personal data to specialists unless the user explicitly approves external sharing.
```

## OpenSwarm / VRSEN/OpenSwarm

OpenSwarm already uses an orchestrator that routes to specialists. RAP should appear as an external marketplace tool, not as a replacement orchestrator.

### AGENTS.md patch concept

```md
## Reddi Agent Protocol paid specialists

When the user requests work that would benefit from paid external specialist agents, use the Reddi Agent Protocol MCP bridge.

Flow:
1. Ask `reddi.discover_specialists` for candidates.
2. Ask `reddi.request_quote` for terms.
3. If quote requires payment, stop for user approval unless current policy says payment is preapproved.
4. After paid invocation, run `reddi.verify_receipt`.
5. Include `reddi.export_disclosure_ledger` in final deliverables.

Never hide downstream paid agent use. Never use unverified paid output as authoritative evidence.
```

### OpenSwarm demo scenario

Prompt:

> “Create a 5-slide market brief about paid specialist agents. Use external paid research only if quote is under $2 and evidence can be verified.”

Expected MVP behavior:

- OpenSwarm calls RAP discovery.
- Bridge returns research specialists.
- OpenSwarm requests quote.
- Since policy is dry-run, payment is blocked.
- OpenSwarm produces deck with a “paid specialist available but not invoked” evidence appendix.

Expected later behavior with approval:

- Human approves quote.
- Bridge pays/invokes.
- OpenSwarm verifies receipt.
- Deck includes specialist contribution and disclosure ledger.

## OpenClaw

OpenClaw should wrap RAP MCP Bridge as a skill/playbook, because OpenClaw already has approval, status, and memory protocols.

### Skill concept

```text
skills/reddi-paid-specialist/SKILL.md
```

Triggers:

- user asks to hire/pay/call external specialists
- task needs third-party paid specialist evidence
- comparison/demo wants x402 paid specialist workflow

Rules:

- Read project `STATUS.md` first.
- Check current budget/spend policy.
- Use RAP MCP bridge in dry-run unless Nissan explicitly approves live payment.
- Log quotes, approvals, receipts, and disclosure ledgers to project artifacts.
- Update STATUS and memory after any quote/payment/invoke.

### OpenClaw-specific advantage

OpenClaw can enforce stronger continuity:

- every quote is logged to project artifacts
- every paid invocation updates `STATUS.md`
- every receipt/disclosure ledger is preserved in repo evidence
- group chat approval flows can gate spend visibly

## OpenAI Agents SDK / custom agents

If MCP is unavailable, use direct HTTP endpoints or the future HTTP/SSE MCP server.

Recommended direct flow:

```text
POST /api/planner/tools/resolve
POST /api/planner/tools/quote       # future
POST /api/planner/tools/invoke      # gated
POST /api/planner/tools/signal
POST /api/planner/tools/release
```

But MCP is preferred because it carries host-neutral tool semantics and prompt/resource guidance.

## Demo ladder

### Demo 1 — zero-spend discovery

Host: Claude/Cursor

- Start RAP backend locally.
- Start RAP MCP Bridge in dry-run.
- Ask for best research specialist under $2.
- Show candidates and quote preview.
- Export disclosure ledger plan.

### Demo 2 — OpenSwarm quote-only workflow

Host: OpenSwarm fork/local clone

- Add RAP MCP bridge instructions.
- Run prompt asking for market brief with paid specialist option.
- Show quote blocked by dry-run policy.
- Final deliverable includes “specialist not invoked” evidence appendix.

### Demo 3 — controlled demo receipt

Host: OpenClaw or Claude

- Enable controlled demo mode only.
- Invoke a test specialist against local/fake backend.
- Verify controlled-demo receipt.
- Export disclosure ledger.

### Demo 4 — devnet verifier

Host: OpenClaw

- After receipt verifier exists.
- Use devnet specialist/payment lane.
- Verify devnet receipt.
- Include ledger in final artifact.

## Host integration acceptance criteria

- Claude/Cursor config can start bridge and list tools.
- OpenSwarm instructions cause quote-before-payment behavior.
- OpenClaw skill refuses live payment without approval.
- Demo 1 and 2 require no payment, no live specialist invoke.
- Every host-facing doc says dry-run/manual is default.
- Every final-output example includes disclosure/verification boundary.

## Loop 4 retrospective

### What became clearer

The strongest demo before payment is not “fake paid work.” It is: **agent runtime discovers that paid specialist work is available, requests a quote, and correctly stops at the approval/payment boundary while still producing a disclosure-ready plan.**

That is valuable because it shows governance and trust, not just tool plumbing.

### Plan adjustment

Host integrations should ship before live payment. This lets RAP become visible in Claude/Cursor/OpenSwarm while the dangerous parts remain gated.

### New requirement

Add explicit host prompt snippets to the package README so MCP clients do not treat `discover/quote` as permission to spend.
