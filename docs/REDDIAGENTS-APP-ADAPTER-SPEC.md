# ReddiAgents Lightweight APP Adapter — v0.1 Spec

_Last updated: 2026-05-01 AEST_

## 1. Purpose

Create a lightweight APP Adapter that exposes ReddiAgents through an APP-compatible surface without replacing the existing Reddi Agent Protocol runtime, x402 payment rails, Solana escrow, attestation, or demo specialist infrastructure.

The adapter is a translation layer:

```text
APP-compatible client / judge harness / partner agent
        ↓
ReddiAgents APP Adapter
  - discovery manifest
  - agent registry projection
  - request/context normalization
  - ReddiAgents dispatch bridge
  - status/result/receipt translation
        ↓
Existing Reddi Agent Protocol app + registered specialists
```

## 2. Design Principles

1. **Adapter, not rewrite** — use existing ReddiAgents registration, planner, specialist, x402, attestation, and evidence flows.
2. **Small enough to ship now** — polling-based run lifecycle first; streaming/webhooks are optional follow-ups.
3. **Fail closed** — never convert an unpaid/open completion path into a successful paid/callable APP result.
4. **Judge-safe evidence** — every run returns a receipt envelope that points to safe public evidence, not private prompts, secrets, or raw logs.
5. **Composable by default** — APP agent IDs map onto Reddi specialist capabilities and source-routing policy rather than hardcoded one-off endpoints.

## 3. Non-goals for v0.1

- No new orchestration engine.
- No marketplace persistence beyond projecting the existing registry/readiness data.
- No custom billing ledger outside existing x402/Solana receipt evidence.
- No streaming requirement unless a consuming APP harness explicitly needs it.
- No broad external write actions from the adapter; it should call the existing controlled planner/specialist paths.

## 4. Minimal Public Surface

### 4.1 Discovery

`GET /.well-known/app-agent.json`

Returns adapter metadata and the APP-exposed ReddiAgents.

Example response:

```json
{
  "name": "ReddiAgents",
  "version": "0.1.0",
  "protocol": "app",
  "description": "APP-compatible adapter for Reddi Agent Protocol specialists with x402 payments, Solana escrow, and attested evidence.",
  "agents": [
    {
      "id": "reddi.qa-testing-specialist",
      "name": "Reddi QA Testing Specialist",
      "description": "x402-paid QA specialist exposed through the ReddiAgents APP Adapter.",
      "capabilities": ["qa.review", "test.plan", "evidence.summarize"],
      "input_schema_url": "/app/agents/reddi.qa-testing-specialist/schema",
      "run_url": "/app/runs",
      "status": "available"
    }
  ]
}
```

### 4.2 Agent List

`GET /app/agents`

Returns the same agent list as discovery plus Reddi-specific readiness metadata.

Recommended Reddi extension fields:

```json
{
  "id": "reddi.qa-testing-specialist",
  "reddi": {
    "source": "openclaw",
    "wallet": "optional-public-wallet",
    "x402_required": true,
    "attestation_supported": true,
    "evidence_routes": ["/manager", "/testers"]
  }
}
```

### 4.3 Agent Schema

`GET /app/agents/:agentId/schema`

Returns JSON Schema for the normalized run input.

v0.1 should accept one generic task shape:

```json
{
  "type": "object",
  "required": ["task"],
  "properties": {
    "task": {
      "type": "string",
      "minLength": 1,
      "description": "The task for the selected ReddiAgent specialist."
    },
    "constraints": {
      "type": "array",
      "items": { "type": "string" }
    },
    "evidence_preference": {
      "type": "string",
      "enum": ["summary", "links", "full_receipt"],
      "default": "summary"
    }
  }
}
```

### 4.4 Create Run

`POST /app/runs`

Request:

```json
{
  "agent_id": "reddi.qa-testing-specialist",
  "input": {
    "task": "Review this x402 integration plan for missing fail-closed checks.",
    "constraints": ["Be concise", "Include test suggestions"],
    "evidence_preference": "full_receipt"
  },
  "context": {
    "conversation_id": "optional-external-thread-id",
    "user_id": "optional-external-user-id",
    "trace_id": "optional-caller-trace-id"
  }
}
```

Response:

```json
{
  "run_id": "app_run_01hv...",
  "agent_id": "reddi.qa-testing-specialist",
  "status": "queued",
  "status_url": "/app/runs/app_run_01hv..."
}
```

### 4.5 Run Status / Result

`GET /app/runs/:runId`

Response:

```json
{
  "run_id": "app_run_01hv...",
  "agent_id": "reddi.qa-testing-specialist",
  "status": "succeeded",
  "output": {
    "content": "Review result here...",
    "evidence": [
      {
        "label": "x402 challenge observed",
        "url": "/manager"
      }
    ]
  },
  "usage": {
    "input_tokens": null,
    "output_tokens": null,
    "cost_usd": null
  },
  "receipt": {
    "adapter": "reddiagents-app-adapter",
    "adapter_version": "0.1.0",
    "trace_id": "caller-or-generated-trace-id",
    "x402_required": true,
    "x402_satisfied": true,
    "attestation_status": "not_requested",
    "safe_public_evidence_only": true
  }
}
```

## 5. State Mapping

| APP status | ReddiAgents source state | Notes |
| --- | --- | --- |
| `queued` | accepted, not yet dispatched | Run record exists locally. |
| `running` | planner/specialist call in progress | Existing Reddi dispatch/session is active. |
| `requires_payment` | x402 challenge returned, payment not yet satisfied | Optional if APP clients support this state; otherwise keep internal and continue existing paid flow. |
| `succeeded` | specialist result + safe receipt generated | Must include receipt envelope. |
| `failed` | probe, policy, payment, attestation, or specialist failure | Return safe error class, not raw logs. |
| `cancelled` | caller/system cancellation | v0.1 may expose only if easy to wire. |

## 6. Internal Module Boundaries

Suggested Next.js/app module layout:

```text
app/.well-known/app-agent.json/route.ts
app/app/agents/route.ts
app/app/agents/[agentId]/schema/route.ts
app/app/runs/route.ts
app/app/runs/[runId]/route.ts
lib/app-adapter/manifest.ts
lib/app-adapter/registry.ts
lib/app-adapter/dispatcher.ts
lib/app-adapter/translator.ts
lib/app-adapter/receipts.ts
lib/app-adapter/store.ts
lib/__tests__/app-adapter-*.test.ts
```

### 6.1 Registry Entry

```ts
export type AppAdapterAgent = {
  appAgentId: string;
  name: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
  sourcePolicy: {
    preferredSource?: "openclaw" | "external";
    strictSourceMatch?: boolean;
  };
  reddi: {
    specialistWallet?: string;
    specialistEndpoint?: string;
    x402Required: boolean;
    attestationSupported: boolean;
  };
  inputSchema: unknown;
};
```

### 6.2 Run Record

```ts
export type AppAdapterRun = {
  runId: string;
  agentId: string;
  status: "queued" | "running" | "requires_payment" | "succeeded" | "failed" | "cancelled";
  input: unknown;
  context: {
    conversationId?: string;
    userId?: string;
    traceId: string;
  };
  createdAt: string;
  updatedAt: string;
  output?: unknown;
  safeError?: {
    code: string;
    message: string;
  };
  receipt?: unknown;
};
```

For v0.1, `store.ts` can be an in-memory store for demo/local use. If the adapter needs durable runs later, back it with the existing app database/storage pattern.

## 7. Dispatch Bridge

The adapter should prefer existing planner/specialist APIs instead of bypassing product logic.

Recommended bridge order:

1. Resolve `agent_id` from `lib/app-adapter/registry.ts`.
2. Validate input against the agent schema.
3. Apply Reddi source policy, e.g. `preferredSource: "openclaw"` for ReddiAgents demo specialists.
4. Call existing planner/specialist route or shared function.
5. Preserve x402 challenge/payment status.
6. Normalize final result into APP output + Reddi receipt envelope.

If a selected specialist endpoint does not return `402 + x402-request` for protected completion paths, the adapter must fail closed with `failed` and an error code such as `x402_required_but_missing`.

## 8. Receipt Requirements

Every terminal response should include a receipt object.

Minimum receipt fields:

```json
{
  "adapter": "reddiagents-app-adapter",
  "adapter_version": "0.1.0",
  "trace_id": "...",
  "agent_id": "reddi.qa-testing-specialist",
  "x402_required": true,
  "x402_satisfied": true,
  "attestation_status": "not_requested|pending|passed|failed",
  "escrow_status": "not_used|locked|released|refunded|failed",
  "safe_public_evidence_only": true
}
```

Rules:

- Do not include private prompts unless explicitly classified safe.
- Do not include secrets, auth headers, wallet private keys, raw runtime logs, or unredacted environment values.
- Prefer links to existing Manager/tester evidence surfaces over embedding large logs.

## 9. First Demo Mapping

Use the currently deployed demo specialists as the first APP-exposed agents:

| APP agent ID | Existing specialist | Public endpoint |
| --- | --- | --- |
| `reddi.qa-testing-specialist` | QA Testing Specialist | `https://reddi-qa.preview.reddi.tech` |
| `reddi.ux-testing-specialist` | UX Testing Specialist | `https://reddi-ux.preview.reddi.tech` |
| `reddi.integration-testing-specialist` | Integration Testing Specialist | `https://reddi-integration.preview.reddi.tech` |

v0.1 can ship with only `reddi.qa-testing-specialist` enabled and the other two present but disabled until route tests pass.

## 10. Acceptance Criteria

- `GET /.well-known/app-agent.json` returns valid JSON with at least one enabled ReddiAgent.
- `GET /app/agents` lists the same enabled agent with Reddi readiness metadata.
- `GET /app/agents/:agentId/schema` returns the input schema for the demo agent.
- `POST /app/runs` accepts a task, creates a run record, and dispatches through the existing Reddi path.
- `GET /app/runs/:runId` returns a normalized terminal status and receipt.
- x402 bypass/open-completion conditions fail closed.
- Contract tests cover manifest shape, schema route, run creation validation, status translation, and safe failure output.
- A local demo command can create a run and print the final APP response.

## 11. Implementation Slice Plan

### Slice A — Spec + route skeleton

- Add this spec.
- Add manifest, registry, translator, receipt helpers.
- Add discovery/list/schema routes.
- Add contract tests for static routes.

### Slice B — Demo run lifecycle

- Add in-memory run store.
- Add `POST /app/runs` and `GET /app/runs/:runId`.
- Add mock dispatch implementation behind the dispatcher interface.
- Add contract tests for queued/succeeded/failed mappings.

### Slice C — Real Reddi dispatch bridge

- Replace mock dispatch with existing planner/specialist call path.
- Preserve x402 fail-closed behavior.
- Emit safe receipt fields.
- Add demo script.

### Slice D — Optional live updates

- Add `GET /app/runs/:runId/events` SSE only if APP consumers need progress streaming.

## 12. Open Questions

1. What exact APP protocol version and required field names should Colosseum or the judging harness expect?
2. Should payment-required be exposed as an APP state, or should the adapter hide the x402 challenge/retry cycle behind the Reddi dispatch bridge?
3. Do APP consumers require signed receipts, or is a safe evidence envelope enough for the hackathon submission?
4. Which ReddiAgent should be the canonical first live demo: QA, UX, or Integration?
