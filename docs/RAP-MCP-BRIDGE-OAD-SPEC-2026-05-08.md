# RAP MCP Bridge — OAD Spec / Issue Draft

_Date: 2026-05-08 AEST_

## Issue title

Build RAP MCP Bridge MVP for paid specialist discovery, quotes, verification, and disclosure

## Intent

As an MCP-capable agent runtime — OpenSwarm, OpenClaw, Cursor, Claude, Codex, or custom — I want a safe Reddi Agent Protocol MCP bridge so I can discover specialist agents, request quotes, verify receipts/evidence, and eventually pay/invoke specialists under strict budget policy.

## Why now

OpenSwarm-style runtimes are emerging as orchestration layers. Reddi Agent Protocol should be the economic/trust layer they call when they need paid specialist work.

The RAP repo already has a near-MCP HTTP tool surface:

- `lib/mcp/tools.ts`
- `app/api/planner/tools/*`
- `lib/registry/bridge.ts`
- `lib/onboarding/planner-execution.ts`

The missing layer is a real MCP server/package with safe policy defaults and explicit quote/verification/disclosure primitives.

## Non-goals

- No mainnet payment.
- No automatic live payment by default.
- No live specialist invocation by default.
- No claim of production Solana receipt verification until verifier exists.
- No direct imports of Next internals into the MCP package.
- No replacing OpenSwarm/OpenClaw orchestration.

## Guardrails

- Default policy mode: `dry_run`.
- `REDDI_MCP_ALLOW_INVOKE=false` by default.
- `REDDI_MCP_ALLOW_PAYMENT=false` by default.
- Any payment-capable path must require explicit config and visible policy state.
- Any verification result must include boundary: `dry_run`, `controlled_demo`, `devnet`, or `mainnet`.
- `invoke_specialist` must be blocked unless explicitly enabled.
- Private payloads/files must not be sent by default; quote task summaries should be hash-bound and privacy-preserving.

## First PR scope — safe MCP adapter MVP

### Deliverables

Create:

```text
packages/rap-mcp-bridge/
  package.json
  tsconfig.json
  README.md
  src/
    server.ts
    config.ts
    policy.ts
    rap-client.ts
    schemas.ts
    store.ts
    tools/
      discover-specialists.ts
      request-quote.ts
      verify-receipt.ts
      export-disclosure-ledger.ts
  tests/
    policy.test.ts
    schemas.test.ts
    request-quote.test.ts
    verify-receipt.test.ts
```

### Tools in first PR

1. `reddi.discover_specialists`
   - Calls `POST /api/planner/tools/resolve`.
   - Returns normalized candidates.
   - Works when RAP backend is running.
   - Returns clear backend-unreachable error otherwise.

2. `reddi.request_quote`
   - Synthetic quote only.
   - Uses discovery candidate pricing.
   - Computes task hash and terms hash.
   - Stores quote in local bridge store.
   - Clearly marks quote as `draft|active` and not specialist-signed.

3. `reddi.verify_receipt`
   - Verifies bridge-generated quote/terms hash.
   - Supports dry-run/synthetic quote verification.
   - Does not claim devnet/mainnet settlement.
   - Returns warnings for unsupported checks.

4. `reddi.export_disclosure_ledger`
   - Emits `reddi.downstream-disclosure-ledger.v1` from stored quote/run data.
   - Safe-public-evidence only.

### Resources in first PR

- `reddi://policy/current`
- `reddi://registry/capabilities` if cheap to expose; otherwise defer

### Prompts in first PR

- `reddi_hire_specialist_prompt`
- `reddi_verify_before_use_prompt`
- `reddi_budget_guard_prompt`

## First PR acceptance criteria

- `npm --prefix packages/rap-mcp-bridge run build` passes.
- Package tests pass.
- MCP server starts in stdio mode.
- Tool list includes exactly safe MVP tools.
- Default config blocks payment and invocation.
- `request_quote` produces deterministic `termsHash` for stable input.
- `verify_receipt` honestly reports `dry_run` / unsupported payment checks.
- `export_disclosure_ledger` emits `reddi.downstream-disclosure-ledger.v1`.
- README includes Claude Desktop/Cursor config with dry-run policy.
- No live endpoint invocation in tests.
- No x402 payment submitted in tests.

## Second PR scope — gated wrappers for existing planner tools

Add:

- `reddi.register_consumer`
- `reddi.invoke_paid_specialist` as blocked-by-default wrapper over `/api/planner/tools/invoke`
- `reddi.submit_quality_signal`
- `reddi.decide_settlement`

Acceptance:

- `invoke_paid_specialist` returns policy block by default.
- Enabling invoke requires both env config and explicit per-call policy.
- Gated tests use mocked backend only.

## Third PR scope — backend quote endpoint

Add backend endpoint:

```text
POST /api/planner/tools/quote
```

Acceptance:

- quote IDs are backend-generated
- quotes include TTL, terms hash, selected specialist, pricing, and x402 challenge metadata if available
- quote records are persisted server-side
- MCP bridge prefers backend quote endpoint when available, falls back to synthetic quote only when allowed

## Fourth PR scope — receipt verifier hardening

Add:

- generic receipt verifier service
- devnet verifier where existing evidence supports it
- replay/idempotency checks
- run receipt normalization from `PlannerRunRecord`

Acceptance:

- controlled demo receipts and devnet receipts are distinct boundaries
- `mainnet` remains unsupported unless explicitly implemented and tested

## Fifth PR scope — OpenSwarm/OpenClaw/Cursor/Claude examples

Add:

- Claude Desktop config
- Cursor MCP config
- OpenSwarm AGENTS/orchestrator patch instructions
- OpenClaw skill draft
- smoke/demo script that does discover → quote → verify → disclosure without payment

## BDD scenarios

### Scenario 1 — dry-run discovery and quote

Given RAP backend is reachable
And MCP policy is dry-run
When a Claude/Cursor client asks for a research specialist under $2
Then the bridge returns candidates
And `request_quote` returns an active synthetic quote
And no payment is attempted

### Scenario 2 — backend unavailable

Given RAP backend is not reachable
When the client calls `reddi.discover_specialists`
Then the bridge returns a clear backend-unreachable error
And does not pretend local cached registry is authoritative unless cache mode is explicitly enabled

### Scenario 3 — payment blocked by default

Given default policy
When the client calls `reddi.pay_quote`
Then the bridge refuses with `payment_blocked_by_policy`
And explains the env/config required to enable payment

### Scenario 4 — invoke blocked by default

Given default policy
When the client calls `reddi.invoke_paid_specialist`
Then the bridge refuses with `invoke_blocked_by_policy`
And no specialist endpoint is called

### Scenario 5 — verification boundary honesty

Given a dry-run quote
When the client calls `reddi.verify_receipt`
Then the result says `boundary=dry_run`
And payment checks are `not_applicable` or `pending`, not `pass`

### Scenario 6 — disclosure ledger export

Given a quoted specialist call plan
When the client exports disclosure ledger
Then the output has schema `reddi.downstream-disclosure-ledger.v1`
And includes specialist wallet, capability, payload hash, terms hash/evidence refs
And marks evidence as safe-public-only

## Review checklist for Oli

- Does the package default to no payment/no invoke?
- Are verification boundaries honest?
- Are hashes deterministic and privacy-preserving?
- Can untrusted MCP clients cause spending or private file exfiltration?
- Is backend unreachable handled clearly?
- Are env vars documented accurately?
- Are tests free of live endpoint/payment dependency?

## Retrospective after Loop 3

### What became clearer

The first PR should not include `pay_quote` implementation except maybe as a blocked stub. The safest wedge is discovery, synthetic quotes, dry-run verification, and disclosure ledger export.

### Plan adjustment

Move `pay_quote` from MVP PR into a later payment phase. Keep the tool in the product design, but avoid shipping even a confusing pseudo-payment path in the first PR.

### Risk reduced

This first PR can be docs/tests/package-only and should not touch existing production planner behavior.

### Remaining decision

Whether to create the GitHub issue now or keep this as a local OAD spec until Nissan says to begin implementation. Because GitHub issue creation is an external write, default is to keep the issue draft local unless explicitly approved or unless we treat the current instruction as approval for repo workflow writes.

---

# Loop 5 Safety Review Incorporation — Oli gate

Reviewer verdict: direction solid, but first implementation must narrow the safety surface further before issue/PR.

## Must-fix changes accepted

### 1. Remove live-capable policy modes from first PR

First PR accepts exactly:

```text
REDDI_MCP_POLICY_MODE=dry_run
```

Any other value, including `manual`, `session_budget`, or `unsafe_live`, must fail closed with:

```text
unsupported_policy_mode
```

`manual` and `session_budget` may be introduced only in later payment/invoke PRs. `unsafe_live` should not be used as a product-facing mode name.

### 2. First PR tool list is exactly four safe tools

First PR MCP server must expose exactly:

- `reddi.discover_specialists`
- `reddi.request_quote`
- `reddi.verify_receipt`
- `reddi.export_disclosure_ledger`

No `pay_quote` tool.
No `invoke_paid_specialist` tool.
No blocked stubs for payment/invoke.

Rationale: visible future payment affordances are themselves risky in MCP clients. Payment/invoke tools arrive only after separate review.

### 3. Quote honesty is schema-level

`ReddiQuote` must include:

```ts
quoteAuthority: "bridge_synthetic" | "backend" | "specialist_signed";
binding: boolean;
```

First PR quotes are always:

```ts
quoteAuthority: "bridge_synthetic";
binding: false;
```

Synthetic quotes must never appear commercially binding.

### 4. Verification cannot overclaim

`verified=true` is allowed only if every requested/applicable check passes inside the declared boundary.

First PR dry-run/synthetic quote verification may pass quote/terms checks, but payment checks must be:

```text
not_applicable
```

or

```text
pending
```

Never `pass`.

### 5. MCP input limits and no arbitrary IO

First PR must enforce explicit limits:

```text
task: max 8,000 chars
inputSummary/taskSummary: max 2,000 chars
evidenceRefs: max 32 refs, max 512 chars each
trace arrays: max 100 entries, max 256 chars each
ledger entries: max 100 entries per export
agentName/framework metadata: max 128 chars after sanitization
```

First PR must not:

- fetch arbitrary specialist URLs
- accept local file paths
- read private files
- persist raw prompts unless explicitly designed and approved
- persist x402 headers, auth headers, or secrets

## Should-fix changes accepted

### Privacy default

`payloadClass="private_reference"` is rejected by default. It requires a later explicit `allowPrivatePayloads=true` mode, not present in first PR.

Disclosure ledgers must avoid:

- raw prompts
- raw outputs
- endpoint auth headers
- x402 headers
- sensitive nonces
- private host metadata unless configured

### Deterministic hashing

`taskHash` and `termsHash` use canonical JSON:

- stable recursive key ordering
- UTF-8 strings normalized to NFC
- no undefined values
- numbers represented as strings for money
- amount normalized as decimal string
- currency uppercased
- network lowercased
- TTL/expiresAt excluded from `termsHash` unless explicitly part of commercial terms
- `quoteId`, `createdAt`, and `expiresAt` excluded from `termsHash`

Golden tests must prove stable hash output for a fixture.

### Local store criteria

If first PR writes local store files under `~/.reddi/rap-mcp-bridge`:

- directory should be created with restrictive permissions where OS supports it
- first PR must not persist secrets or x402 headers
- duplicate idempotency keys return the same stored quote, not a new quote

### Backend unreachable / cache honesty

If backend is unreachable, return backend-unreachable. Do not silently use cache unless a later explicit cache mode exists, and cached responses must mark:

```ts
authoritative: false
```

### Host metadata privacy

`agentName` is optional, sanitized, capped, and not included in public ledger unless configured.

## Nice-to-have accepted

First PR docs should include a threat model covering:

- malicious MCP client
- prompt injection asking bridge to spend
- malicious specialist endpoint
- replayed quote/payment id
- backend spoofing / localhost confusion

README should include:

```text
What this does not prove
```

especially for dry-run verification and synthetic quotes.

## Revised first PR acceptance criteria — final

- MCP tool list contains exactly four tools: discover, request_quote, verify_receipt, export_disclosure_ledger.
- Unknown/live-capable policy modes fail closed.
- `request_quote` returns `quoteAuthority="bridge_synthetic"` and `binding=false`.
- `verify_receipt` cannot return `verified=true` when payment settlement is unsupported.
- Dry-run payment checks are `not_applicable` or `pending`, never `pass`.
- Private payload classes are rejected by default.
- Inputs have explicit max sizes and schema validation tests.
- `termsHash` uses documented canonical serialization with golden tests.
- Disclosure ledger contains safe public evidence only; no raw prompt/output/secrets/x402 headers.
- No arbitrary URL fetch or file access in first PR.
- Local store does not persist secrets and handles duplicate idempotency deterministically.
- README includes host config, threat model, and “what this does not prove.”

## New Nissan permission boundary — Surfpool before devnet

Nissan approved devnet spends only after the same flow is proven in the local Surfpool validator environment.

Implementation policy:

1. First prove local Surfpool flow.
2. Capture artifacts: local quote, local payment/settlement semantics, local receipt verification, disclosure ledger.
3. Run review gate.
4. Only then run bounded devnet spend.
5. Devnet spend must have explicit cap, target, command, and artifact directory.

This permission does **not** allow mainnet spend.
