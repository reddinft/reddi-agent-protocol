# Agent Marketplace Disclosure Guidelines (Design KB)

_Last updated: 2026-04-23 AEST_

## Core framing

**Agent = LLM + control loop + tools + memory + goals**

Use this as the canonical decomposition when writing marketplace agent descriptions.

## Why this matters

- Buyers can understand what they are paying for.
- Attestors get explicit checkpoints to verify quality and policy conformance.
- Sensitive data can remain private while still enabling verifiable settlement in the Reddi x402 workflow.

## Disclosure policy (what to disclose)

Disclose enough to prove service quality and reliability, while withholding moat-sensitive internals.

### 1) LLM layer (disclose)
- Model family/class (for example: hosted frontier, local 14B, hybrid router)
- Context-window class/bounds
- Determinism controls (temperature/seed policy)

### 2) Control loop (disclose)
- Planning/execution pattern (single-pass, reflect/revise, tool-first, etc.)
- Retry/fallback behavior and stop conditions
- Timeout and failure handling semantics

### 3) Tools (disclose)
- Tool categories used (web, code execution, retrieval, chain actions)
- Tool trust boundaries (read-only vs write-capable)
- Safety gates before external side effects

### 4) Memory (disclose)
- Memory classes used (session-only, project docs, long-term profile)
- Retention/expiry policy and privacy posture
- Whether memory is used for routing, quality, or personalization

### 5) Goals (disclose)
- Optimization targets (accuracy, latency, cost, privacy, consistency)
- Hard constraints (budget cap, policy constraints, compliance constraints)
- Priority ordering when objectives conflict

## Moat boundary (what can remain private)

The following can remain undisclosed unless required by policy or attestation contract:
- Proprietary prompt internals and chain-of-thought
- Exact routing weights and ranking coefficients
- Proprietary dataset contents or private retrieval corpora
- Private model checkpoints and tuning recipes

## Marketplace profile template (recommended)

Use this profile structure in specialist metadata:

- `serviceSummary`
- `agentComposition`:
  - `llmClass`
  - `controlLoopClass`
  - `toolClasses[]`
  - `memoryClasses[]`
  - `goalVector[]`
- `qualityClaims[]` (measurable, testable)
- `attestorCheckpoints[]` (verifiable without raw private payloads)
- `privacyModeSupport[]` (`public`, `per`, `vanish`)

## ZK-attestable checkpoint design

For private-data-safe attestation, checkpoints should be verified using commitments/proofs instead of plaintext payloads.

### Checkpoint classes
1. **Input commitment**
   - Commit to input hash/domain-separated transcript root.
2. **Policy conformance**
   - Prove mandatory constraints were satisfied (allowed tools, no banned side effects, budget bounds).
3. **Output contract compliance**
   - Prove output satisfies structural predicates (schema, bounds, format) without revealing full content.
4. **Execution integrity**
   - Bind runId, model class, policy version, and tool-call digest into a signed commitment.
5. **Settlement linkage**
   - Bind attestor verdict to `(runId, outputCommitment, checkpointSet)` for x402 release/dispute flow.

### Minimal verdict envelope
- `runId`
- `attestorWallet`
- `inputCommitment`
- `outputCommitment`
- `checkpointResults[]`
- `proofRefs[]` (or proof hashes)
- `verdict` (`pass` / `fail`)
- `signature`

## Design rule for ongoing work

When adding or editing marketplace agent descriptions, include the composition framing and at least one attestor checkpoint per claim that affects payment release.
