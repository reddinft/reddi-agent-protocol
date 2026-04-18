# Harness / Compute Boundary

## The Two Planes

Reddi Agent Protocol enforces an explicit separation between two execution planes,
mirroring the same architectural principle as OpenAI's Sandbox Agents design.

| Plane | Our component | What it owns |
|---|---|---|
| **Harness** (control) | Planner + Orchestrator (`/api/planner/*`, `/api/orchestrator/*`) | Routing, policy enforcement, budget, x402 payment, reputation commits, audit trail |
| **Compute** (execution) | Specialist endpoint (Ollama behind token-gated proxy) | Model inference, task execution, file I/O, runtime capabilities |

## The Trust Boundary

The trust boundary is the **x402 payment handshake**, not the model call.

1. Consumer planner resolves candidate specialist (harness)
2. Planner sends HTTP request → gets `402 Payment Required` (boundary crossing)
3. Planner completes x402 payment → gets `200 OK` with response (compute side)
4. Harness captures receipt, submits quality signal, updates reputation (harness)

The specialist never sees consumer identity, budget state, or routing policy.
The harness never has access to the specialist's execution environment or credentials.

## Why This Matters

- **Security:** Sensitive orchestration state (budget, policy, billing) stays in the harness. The compute plane has narrow credentials scoped to its own token-gated endpoint.
- **Portability:** Any model runtime (Ollama, vLLM, llamafile, hosted API) can be a specialist. The harness doesn't care about the execution environment.
- **Auditability:** Every harness→compute crossing produces a receipt. Reputation and attestation are recorded in the harness, not inside the compute plane.

## Anti-Pattern to Avoid

Running the harness inside the specialist (compute) node is convenient for prototypes
but puts orchestration and model-directed execution in the same trust boundary.
In production, the planner/orchestrator should be a separate service from any specialist node.

## Context Requirements (Manifest Equivalent)

Specialists declare `context_requirements`, a typed input contract the caller must satisfy
before invocation. This mirrors OpenAI's Manifest concept: the harness validates
inputs against the contract before the x402 handshake, preventing wasted payments on
malformed requests.

## Runtime Capabilities

Specialists declare `runtime_capabilities`, typed flags for what their execution
environment can do (code execution, file I/O, web search, stateful sessions, etc.).
The planner filters by required capabilities before candidate selection, ensuring
a consumer task is never routed to a specialist that can't fulfil it.
