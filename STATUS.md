# Reddi Agent Protocol Code — STATUS

**Last updated:** 2026-05-05 AEST
**State:** 🟢 Phase 2 `/economic-demo` disclosure-ledger UI implemented locally; ready for PR.

## RESUME FROM HERE

1. Open/merge Phase 2 branch `feature/economic-demo-disclosure-ledger-ui-20260505`: `/economic-demo` consumes and displays `disclosureLedgerSummary`.
2. After Phase 2 lands, choose the next safe loop: wire latest generated evidence-pack summaries into UI data, or continue Phase 3 local manifest parity.
3. External Coolify redeploy remains explicit-operator-only.

## Current Branch / Repo State

- Local branch: `feature/economic-demo-disclosure-ledger-ui-20260505`
- Local working tree: Phase 2 UI changes in progress.
- Latest merge on main: `93d146e6 docs: update status after phase 1 merge (#208)`.
- PR #208: merged 2026-05-05 AEST; post-merge Anchor run `25347593058` passed.


## Current Follow-up PR — #203

**Disclosure-ledger evidence tooling**

PR #203 merged to `main` as `ca20e898` and makes the retrospective requirement executable in future evidence:

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

- Run `25344663797` for merge commit `ca20e898` — PASS, 7m20s.

Validation for public manifest marketplace slice / PR #205:

- `npx jest --runTestsByPath lib/__tests__/openrouter-registry-enrichment.test.ts lib/__tests__/capabilities-disclosure.test.ts --runInBand` — PASS, 6/6.
- Targeted `npx eslint` over changed marketplace/registry/capability files — PASS.
- `npm run build` — PASS.
- PR #205 checks before merge — PASS: two Anchor runs + Vercel.
- PR #205 post-merge `main` Anchor run `25345416486` — PASS, 7m11s.

Validation for Phase 1 disclosure-ledger evidence summary:

- Synthetic evidence-pack smoke via `ECONOMIC_DEMO_EVIDENCE_SOURCE=/tmp/reddi-ledger-source.json ECONOMIC_DEMO_EVIDENCE_OUT=artifacts/tmp-phase1-ledger-smoke node scripts/generate-economic-demo-evidence-pack.mjs` — PASS.
- JSON assertions for `reddi.economic-demo.disclosure-ledger-summary.v1`, total ledger entries, and payload hash presence — PASS.
- `node --check scripts/generate-economic-demo-evidence-pack.mjs` — PASS.
- Targeted ESLint for `scripts/generate-economic-demo-evidence-pack.mjs` — PASS.
- `git diff --check` — PASS.

Validation for Phase 1 PR #207:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/207
- Merge commit: `aefe728628f832f5acf167c209a5eea08f596d53`
- PR checks passed: Vercel Preview Comments, Vercel deployment, Anchor runs `25346592595` / `25346594990`.
- Post-merge `main` Anchor run `25346911473`, job `74317799175` — PASS, 7m46s.

Validation for Phase 2 disclosure-ledger UI:

- `npx jest --runTestsByPath lib/__tests__/economic-demo-webpage-live-workflow-evidence.test.ts --runInBand` — PASS, 2/2.
- Targeted ESLint for `app/economic-demo/page.tsx`, `lib/economic-demo/webpage-live-workflow-evidence.ts`, and the focused test — PASS.
- `npm run build` — PASS.
- `git diff --check` — PASS.

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

- 2026-05-05: Public marketplace pages must expose agent manifest fields: tools, skills, marketplace-agent calls, external MCP servers, and non-marketplace agent/service calls, not just task capability tags.

- 2026-05-05: BDD iterative plan for the agentic marketplace work must use explicit phase retrospectives before expanding scope: plan/BDD lock → artifact ledger summary → UI ledger display → manifest parity → hosted redeploy smoke → research → picture.

- 2026-05-05: Evidence packs should expose a compact disclosure-ledger summary for judges/UI consumers instead of requiring raw edge JSON archaeology.

- 2026-05-05: `/economic-demo` must render the normalized `disclosureLedgerSummary` and visibly mark historical pre-ledger artifacts as not evidence-complete.

## Blockers / Watch Items

- Hosted specialist manifests need redeploy/smoke before public endpoints expose `agenticWorkflowDisclosure`.
- External Coolify redeploy is an infra mutation; avoid doing it silently unless the current instruction clearly authorizes it.
