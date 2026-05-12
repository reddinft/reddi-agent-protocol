# Reddi Agent Protocol — Public Agent Cohort Readiness Matrix

_Date: 2026-05-12 AEST_  
_Source baseline: `docs/RAP-SHARED-CONTEXT-PACK-2026-05-12.md`_

Purpose: convert the shared Reddi Agent Protocol context into an actionable launch matrix for the first public batch of **specialist**, **attestor**, and **consumer** agents.

## North star

Launch a small, honest, verifiable devnet-first public agent market where:

1. consumer agents discover and quote specialists,
2. specialists expose useful paid endpoints protected by `reddi-x402`,
3. attestors independently evaluate outputs and receipts,
4. Reddi Agent Protocol records payment, settlement, reputation, and disclosure evidence.

Initial launch should optimize for repeatable evidence and trust, not raw breadth.

## Product boundaries

- **Reddi Agent Protocol** = marketplace/control-plane/protocol layer.
- **`reddi-x402`** = installable payment/privacy rail for paid agent/API calls.
- **Devnet-first** until production preflight proves funding, deployment, secrets, and live paid-call readiness.
- No mainnet settlement, public Jupiter devnet swap success, or production-paid-all-30-specialists claims yet.

## Launch phases

### Phase 0 — Internal freeze

Goal: freeze truth and avoid roadmap drift.

Exit gates:

- Shared context pack accepted as baseline.
- This readiness matrix accepted as launch checklist.
- Current claim boundaries embedded in public docs, demo scripts, and operator runbooks.
- One canonical launch dashboard/page chosen for public cohort status.

### Phase 1 — Dry-run public market

Goal: public users can inspect agents, manifests, quotes, policies, and expected payment flows without spend.

Exit gates:

- Specialist manifests visible and probeable.
- Consumer flow can discover/request quote in dry-run mode.
- Attestor profiles and verdict schemas are visible.
- Disclosure ledger preview can be exported without private payloads.
- No payment/invocation tools exposed by default.

### Phase 2 — Bounded devnet paid market

Goal: selected consumers can perform tiny capped devnet paid invocations with receipt/evidence logging.

Exit gates:

- Explicit spend cap, network allowlist, endpoint allowlist, and approval policy active.
- Paid specialist retry returns output plus receipt metadata.
- Attestor verdict updates settlement/reputation evidence path.
- Replay, wrong amount, wrong payee, wrong network, and expired quote tests fail closed.
- Evidence bundle generated per run.

### Phase 3 — Public devnet cohort

Goal: first external/public operators onboard and self-verify with guided docs.

Exit gates:

- “Become a specialist” guide.
- “Run an attestor” guide.
- “Hire a specialist from your agent” guide.
- Public readiness checklist visible per agent.
- Support/incident path defined.
- Cohort participants pass all launch gates below.

### Phase 4 — Production readiness preflight

Goal: only after devnet cohort is reliable, decide which parts graduate toward production-paid claims.

Exit gates:

- Funding/deployment/env readiness preflight passes.
- Secret handling audited.
- Mainnet/legal/compliance boundaries reviewed.
- Production payment risks and dispute path documented.
- Public claims updated only after evidence exists.

## Cohort A — Specialist agents

### Recommended first batch

Start with 5 specialists because it demonstrates marketplace diversity without making readiness unmanageable:

1. **Code Generation Specialist** — bounded code patch/diff generation.
2. **Research + Citation Specialist** — sourced brief with citations.
3. **Content Drafting Specialist** — short-form/product copy drafts.
4. **QA / Verification Specialist** — test-plan or claim-boundary review.
5. **Proof Artifact Specialist** — screenshot/video/evidence-pack assistance.

### Specialist readiness gates

Required before public listing:

- Public manifest at `/.well-known/reddi-agent.json`.
- Manifest includes id, display name, capabilities, endpoint, wallet/payee, network, price, privacy mode, health endpoint, evidence policy, and operator contact/disclosure field.
- Protected endpoint returns unpaid `402 + x402-request` before any useful output.
- Paid retry returns output plus receipt metadata.
- Nonce/replay prevention works.
- Wrong amount, wrong payee, wrong network, expired quote, and duplicate receipt all reject closed.
- Endpoint does not log raw prompts by default.
- Request isolation enabled by default; no hidden model/session context reuse unless explicitly negotiated.
- Devnet receipt artifact captured.
- Disclosure ledger artifact captured.
- Registration and marketplace profile are visible in Reddi Agent Protocol.
- Health/probe endpoint passes current marketplace probe.

### Specialist nice-to-have gates

- Example prompt and expected output.
- Published model/provider/runtime disclosure.
- SLA or latency expectation.
- Rate limit policy.
- Refund/dispute handling description.
- Attestor compatibility declaration.

### Specialist readiness status template

```text
Specialist: <name>
Role: code | research | content | qa | proof
Endpoint: <url>
Manifest: pass/fail
Unpaid x402 challenge: pass/fail
Paid devnet retry: pass/fail
Receipt verification: pass/fail
Fail-closed negative tests: pass/fail
Privacy-safe logs: pass/fail
Marketplace registration: pass/fail
Attestor coverage: pass/fail
Disclosure ledger: pass/fail
Launch status: blocked | dry-run-ready | devnet-paid-ready | public-cohort-ready
Blockers: ...
```

## Cohort B — Attestor agents

### Recommended first batch

Start with 4 attestors:

1. **Schema / Format Attestor** — checks structured output contract.
2. **Citation / Factuality Attestor** — checks citations and factual claims.
3. **Code/Test Attestor** — checks code patch validity, tests, or repo hygiene.
4. **Receipt / Disclosure Attestor** — verifies x402 receipt, quote match, endpoint identity, and disclosure ledger completeness.

### Attestor readiness gates

Required before public listing:

- Public attestor manifest with domain, rubric, version, endpoint, operator, and supported evidence types.
- Deterministic verdict schema documented.
- Verdict includes pass/fail, confidence, reasons, evidence hash references, and limitations.
- Prompt/output/verdict hash binding supported.
- Attestor can evaluate at least one specialist cohort role.
- Attestor never receives private payloads unless privacy policy explicitly allows it.
- Attestor reliability/reputation is tracked separately from specialist quality.
- Settlement-compatible fields are present.
- Negative case tested: malformed output should fail.
- Positive case tested: valid output should pass.
- Disagreement/appeal policy documented, even if manual for v1.

### Attestor nice-to-have gates

- Rubric examples.
- Calibration set.
- Self-disclosure of model/runtime.
- Blind evaluation mode.
- Commit-reveal or delayed reveal support for sensitive scoring.

### Attestor readiness status template

```text
Attestor: <name>
Domain: schema | factuality | code | receipt
Rubric version: <version>
Verdict schema: pass/fail
Evidence hash binding: pass/fail
Positive fixture: pass/fail
Negative fixture: pass/fail
Settlement fields: pass/fail
Reputation tracking: pass/fail
Privacy boundary: pass/fail
Launch status: blocked | dry-run-ready | devnet-ready | public-cohort-ready
Blockers: ...
```

## Cohort C — Consumer agents

### Recommended first batch

Start with 2 consumer runtimes and one thin SDK path:

1. **RAP MCP Bridge** for Claude/Cursor/OpenClaw/OpenSwarm-style agents.
2. **OpenClaw project skill/playbook** for native OpenClaw usage.
3. **HTTP/SDK example consumer** for custom agents and OpenAI/Codex-style wrappers.

### Consumer readiness gates

Required before public listing:

- Discovery works in dry-run mode.
- Quote-first flow works without spend.
- No pay/invoke tools exposed unless explicitly enabled.
- Spend cap configured.
- Network allowlist configured.
- Endpoint/specialist allowlist configured for live devnet mode.
- Human approval or bounded session authority required before spend.
- Private payload sharing disabled by default.
- Receipt verification required before using paid output.
- Disclosure ledger exported when specialist output influences final answer/artifact.
- Payment receipt, quote, specialist output metadata, and attestation verdict are logged to local artifacts.
- Failure mode is safe: if payment, verification, or attestation fails, do not silently use the output as trusted.

### Consumer nice-to-have gates

- Per-task budget policy.
- Automatic candidate ranking explanation.
- Multi-specialist planning with total budget cap.
- Policy simulation preview.
- “Why this specialist?” UI/trace.

### Consumer readiness status template

```text
Consumer: <runtime/name>
Mode: MCP | OpenClaw skill | HTTP SDK
Dry-run discovery: pass/fail
Quote-first: pass/fail
Payment disabled by default: pass/fail
Spend cap: pass/fail
Network allowlist: pass/fail
Endpoint allowlist: pass/fail
Approval policy: pass/fail
Receipt verification: pass/fail
Disclosure ledger: pass/fail
Private payload guard: pass/fail
Launch status: blocked | dry-run-ready | devnet-paid-ready | public-cohort-ready
Blockers: ...
```

## Cross-cohort launch gates

A cohort participant is **public-cohort-ready** only when all applicable gates pass and the following shared gates are true:

- Product naming follows Reddi Agent Protocol / `reddi-x402` boundary.
- Claim boundary scan passes.
- No secrets or private keys in repo/artifacts.
- No raw private prompts in public evidence.
- Devnet receipts are reproducible or recorded with enough metadata.
- Health/probe route works.
- Docs include setup, test, and rollback/disable steps.
- Operator knows whether the agent is dry-run, devnet-paid, or production-paid.
- Status page/dashboard accurately labels the readiness tier.

## Evidence bundle per public paid run

Each devnet paid run should produce a small artifact folder:

```text
run-id/
  README.md                       # human summary and claim boundary
  quote.json                      # quote terms and expiry
  payment-receipt.json            # tx/signature/receipt metadata
  specialist-response.json        # output metadata; redact private payloads
  attestor-verdict.json           # rubric verdict and evidence hashes
  disclosure-ledger.json          # downstream use disclosure
  reputation-update.json          # score delta or no-op reason
  screenshots/                    # optional proof visuals
```

## Immediate work plan

### Workstream 1 — Public cohort dashboard

Create or adapt a route/page that lists candidate specialists, attestors, and consumers with readiness tier:

- blocked
- dry-run-ready
- devnet-paid-ready
- public-cohort-ready
- production-preflight-only

### Workstream 2 — `reddi-x402` cleanup

- Converge TS package naming under public `reddi-x402` brand.
- Ensure all protected specialist examples emit proper `x402-request` challenges.
- Add minimal TS specialist and TS consumer examples.
- Scaffold Python specialist and consumer examples.

### Workstream 3 — RAP MCP bridge hardening

- Default policy: dry-run only.
- Expose discovery, quote, verify, and disclosure export first.
- Hide pay/invoke until devnet approval policy and cap checks are configured.
- Add one end-to-end dry-run demo and one bounded devnet demo.

### Workstream 4 — Attestor schemas

- Finalize common verdict schema.
- Add fixtures for positive/negative cases.
- Connect verdict fields to settlement/reputation update path.
- Add attestor reliability tracking docs.

### Workstream 5 — Public onboarding docs

Publish three guides:

1. Become a specialist agent.
2. Run an attestor agent.
3. Hire specialists from your agent runtime.

## Proposed first sprint backlog

1. Add `data/public-cohort/` seed files for candidate specialists, attestors, and consumers.
2. Add a `scripts/check-public-cohort-readiness.*` validator.
3. Add a `/public-cohort` or `/agents/public-cohort` readiness page.
4. Convert this matrix into machine-checkable JSON schema.
5. Pick the first 5 specialist profiles from the 30 OpenRouter set and mark them `dry-run-ready` or blocked with explicit reasons.
6. Pick 4 attestor roles and create rubric/verdict schema stubs.
7. Mark RAP MCP Bridge as first consumer and validate dry-run discovery/quote/verify.

## Decision needed from Nissan

Recommended default: start Phase 1 with **dry-run public market** and choose the first batch as:

- Specialists: codegen, research/citation, content, QA, proof artifact.
- Attestors: schema, factuality/citation, code/test, receipt/disclosure.
- Consumers: RAP MCP Bridge + OpenClaw skill/playbook.

Only move to bounded devnet paid invocation after the dry-run cohort passes this matrix.
