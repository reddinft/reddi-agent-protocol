# Reddi Agent Protocol Code — STATUS

**Last updated:** 2026-05-05 AEST
**State:** 🟢 PR #202 merged and post-merge Anchor CI green; PR #203 opened for disclosure-ledger evidence tooling.

## RESUME FROM HERE

1. Watch PR #203 checks and merge if green: https://github.com/nissan/reddi-agent-protocol/pull/203
2. Continue the next Phase 6.5 follow-up slice:
   - Preferred safe/local slice: update the live workflow smoke/evidence pack to assert and display `reddi.downstream-disclosure-ledger.v1` entries.
   - External-infra slice, only with explicit operator intent: redeploy/smoke all 30 hosted Coolify specialists so public `/.well-known/reddi-agent.json` endpoints expose `agenticWorkflowDisclosure`.
3. Keep the agile loop active: BDD expectation → scoped implementation → validation → evidence artifact → retrospective → plan refinement → STATUS update.

## Current Branch / Repo State

- Local branch: `main`
- Local working tree: clean at last check after PR #202 merge.
- Latest merge: `95ab928b feat: add agentic workflow disclosure contract (#202)`.
- PR #202: merged 2026-05-05 AEST.


## Current Follow-up PR — #203

**Disclosure-ledger evidence tooling**

PR #203 makes the retrospective requirement executable in future evidence:

- Guarded webpage live x402 workflow smoke now requires `reddi.downstream-disclosure-ledger.v1` in every paid response.
- Future live workflow artifacts include `disclosureContract` and per-edge ledger summaries.
- Judge evidence pack generation rejects source artifacts missing all-edge disclosure-ledger evidence.
- Historical 2026-05-04 artifacts are intentionally no longer sufficient as post-PR #202 judge evidence.

Validation before PR:

- `node --check` on both scripts — PASS
- targeted ESLint for both scripts — PASS
- `git diff --check` — PASS

## Latest Shipped Slice — PR #202

**Agentic workflow disclosure contract**

Nissan clarified the product truth: this is an agentic workflow network. Specialists and attestors are autonomous wallet-bearing agents that may act as consumer agents and hire other marketplace agents while fulfilling their role.

PR #202 implemented the corresponding protocol/runtime contract:

- `agenticWorkflowDisclosure` exposed in `/.well-known/reddi-agent.json`.
- `reddi.downstream-disclosure-ledger.v1` response contract added.
- Runtime responses include explicit no-call/planned-call/attempted-call ledgers.
- Live-delegation responses wire disclosure ledger alongside intent, audit, and executor evidence.
- `/economic-demo` explains manifest disclosure, return disclosure, and moat-protection boundaries.
- BDD + delivery plan + iterative roadmap + iteration log updated.

## Validation Evidence

Local/PR validation for #202:

- `npm run test:bdd:index` — PASS
- `npm test --prefix packages/openrouter-specialists` — PASS, 54/54
- Targeted ESLint over economic demo + OpenRouter specialist runtime/disclosure/tests — PASS
- `npm run build` — PASS
- Oli QA — APPROVE: no hidden spend/signing path, live delegation remains fail-closed, no secrets, package tests passing.
- PR checks before merge — green.

Post-merge `main` CI:

- Run `25343819366` started after merge; still in progress at last check.

## Retrospective — Phase 6.5 Slice A

### What worked

The retrospective outcome was converted into executable protocol shape before further workflow expansion. The system now distinguishes a central fan-out demo from an autonomous agent economy: a consumer agent can inspect whether a specialist/attestor may delegate downstream before purchase, and receive a disclosure ledger afterward.

### What failed or surprised us

Oli noticed this repo-local `STATUS.md` did not exist, even though project-level status existed under `projects/colosseum-frontier/STATUS.md` and an older sibling project status existed under `projects/reddi-agent-protocol/STATUS.md`. That was a continuity gap. This file now exists as the repo-local resume point.

The hosted 30 Coolify apps still need redeploy before public manifests expose the new runtime disclosure fields. Existing live workflow evidence also predates the ledger schema, so future evidence packs should assert disclosure-ledger presence.

### Plan adjustment

Do not proceed as a waterfall into research/picture live workflows until the disclosure contract is represented in evidence. Next safest step is a local/code slice that makes smoke/evidence tooling require `reddi.downstream-disclosure-ledger.v1`. Then perform hosted redeploy/smoke when external infra mutation is explicitly intended.

## Key Decisions — append only

- 2026-05-05: Repo-local `STATUS.md` created because Oli could not find one during PR #202 QA; this file is now the first resume point for repo-code work.
- 2026-05-05: Agentic workflow disclosure is a protocol/runtime requirement, not just UI copy.
- 2026-05-05: Marketplace manifests must disclose downstream delegation capability/policy before purchase.
- 2026-05-05: Return payloads must include downstream disclosure for called agent identity, wallet/endpoint, payload summary/hash, x402 state, and attestor links.
- 2026-05-05: Moat protection may obfuscate proprietary returned value-add details, but not called-agent identity, payload class, payment evidence, or attestation chain.

## Blockers / Watch Items

- PR #203 checks pending at last update.
- Hosted specialist manifests need redeploy/smoke before public endpoints expose `agenticWorkflowDisclosure`.
- External Coolify redeploy is an infra mutation; avoid doing it silently unless the current instruction clearly authorizes it.
