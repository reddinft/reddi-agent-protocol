# Economic Demo Judge Packet

_Date:_ 2026-05-05 AEST
_Status:_ Public-safe Anchor-era packet; superseded for hackathon readiness by Quasar cutover Issue #236 until refreshed
_Demo route:_ `/economic-demo`
_Quasar cutover target:_ Quasar-deployed Solana programs; candidate devnet program `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW` from `config/quasar/deployments.json`
_Operator checklist:_ `docs/ECONOMIC-DEMO-OPERATOR-CHECKLIST-2026-05-05.md`
_Local-only rehearsal report:_ `artifacts/economic-demo-rehearsal/20260505T091725Z/REHEARSAL-REPORT.md` (ignored; not part of public packet)

## One-paragraph summary

Reddi Agent Protocol demonstrates an agentic workflow economy where a user request can be routed through an orchestrator, marketplace specialists, attestors, x402 payment challenges, and downstream-disclosure evidence. The current demo is intentionally safe and evidence-bounded: it shows the workflow, public manifest/dependency disclosure, local dry-run evidence pointers, Surfpool/local rehearsal semantics, and storyboard-only image planning without making hidden paid calls or claiming production settlement.

## What to open

- Demo page: `/economic-demo`
- Local evidence anchor: `/economic-demo#local-evidence-artifacts`
- Operator checklist: `docs/ECONOMIC-DEMO-OPERATOR-CHECKLIST-2026-05-05.md`

## Quasar cutover status

Nissan has selected Quasar-deployed Solana programs as the hackathon demo target. This packet remains useful as an Anchor-era economic-demo evidence packet, but it is **not final hackathon submission proof** until the Quasar proof chain is refreshed. The candidate Quasar devnet program is `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`; the legacy Anchor reference is recorded only for comparison in `config/quasar/deployments.json`. Current approval-gated blocker set: no signing, deployment, wallet mutation, devnet transfer, Coolify/env mutation, or paid/live provider calls without Nissan approval. Runtime wiring, PER/privacy-aware settlement proof, and final judge-packet proof chain remain known gaps.

## What is proven by the current packet

1. **Agentic workflow disclosure exists before purchase.**
   - Public marketplace and manifest work disclose tools, skills, downstream marketplace-agent calls, external MCP servers, non-marketplace services, and disclosure policy.

2. **Paid-response disclosure is part of the protocol contract.**
   - `reddi.downstream-disclosure-ledger.v1` is the expected response evidence for downstream calls.
   - Evidence tooling rejects future live artifacts that omit the required downstream-disclosure ledger.

3. **The economic demo can be presented without fresh spend.**
   - `/economic-demo` loads controlled/local evidence panels without live specialist calls on page load.
   - The local evidence panel points to ignored repo-local artifacts instead of publishing private logs.

4. **The picture path is spend-gated.**
   - The Phase 7 picture workflow is storyboard-only.
   - The image-generation adapter remains blocked unless Nissan explicitly approves provider, model, and budget cap.

5. **The submission/readiness loop is now BDD-governed.**
   - Issue #228 and the BDD plan require each phase to define expectation, scope, acceptance criteria, validation, evidence, retrospective, and plan adjustment before scope expands.

## What is local or simulated

- Surfpool transfer semantics are local/offline proof, not production settlement.
- Research workflow evidence is dry-run planning unless a future Phase 6 live run is explicitly approved.
- Picture workflow evidence is storyboard/prompt planning, not real generated image evidence.
- Local ignored evidence artifacts are operator audit pointers, not public artifact dumps.

## What is explicitly not claimed

- No production settlement proof.
- No new Phase 6 controlled live research execution.
- No OpenAI/Fal-generated image proof.
- No new paid provider execution.
- No new signing operation.
- No wallet mutation.
- No devnet transfer.
- No Coolify/env mutation.

## Public proof chain

The historical rows below prove the Anchor-era/local economic-demo readiness loop. They must not be presented as Quasar final submission proof; Anchor CI alone is insufficient for the new hackathon target.

| PR | Purpose | Merge commit | CI/evidence |
| --- | --- | --- | --- |
| #225 | Compact `/economic-demo` local evidence UI links | `f36d4bb55b7f10bbc5177b3fda189c67f17d7cd3` | PR checks passed; post-merge Anchor run `25359075289` passed |
| #229 | Phase 0 BDD iterative plan + BDD lock + retrospective | `f5499576c11b97b91dcf51d4d148b7d0a7e8302f` | PR checks passed; post-merge Anchor run `25360618730` passed |
| #230 | Phase 1 local submission-prep checker + retrospective | `ee90eafc47d4c15b3ab6ea800a5552a011d6ed59` | PR checks passed; post-merge Anchor run `25361165874` passed |
| #231 | Phase 2 public-safe operator checklist + retrospective | `ffb6cf8d10b49bf7deb5562bf15e4f3a41818a87` | PR checks passed; post-merge Anchor run `25362578258` passed |
| #232 | STATUS refresh after Phase 2 | `58c4684d485bca2c38b40b4c918845236f424fe6` | PR checks passed; post-merge Anchor run `25363200205` passed |
| #233 | Phase 3 local rehearsal retrospective | `fc818240415f33b8b91a010a4e63cd09fc025c4a` | PR checks passed; post-merge Anchor run `25368423458` started at packet creation |

## Local validation commands used during readiness

```bash
npm run check:economic-demo:submission-prep
npm run build
npm run test:bdd:index
git diff --check
```

## Recommended submission wording

**Do not use this wording as final hackathon copy until Quasar runtime wiring and proof chain are refreshed.**


> Reddi Agent Protocol demonstrates an agentic workflow marketplace where agents can disclose their dependencies before purchase and report downstream calls after execution using `reddi.downstream-disclosure-ledger.v1`. The current demo is deliberately evidence-bounded: it shows controlled/local economic workflow proof, public manifest disclosure, local evidence pointers, and storyboard-only image planning without hidden live calls, provider spend, signing, wallet mutation, or production settlement claims.

## If reviewers ask what comes next

The next stronger proof category requires explicit approval because it changes the risk/spend profile:

1. **Controlled Phase 6 live research run** — requires hosted/devnet call approval and spend cap.
2. **Real image generation** — requires provider/model choice and budget cap for OpenAI or Fal.
3. **Production settlement proof** — requires a separate settlement runbook and explicit signing/wallet/devnet or production-network authorization.

Until those are approved, the honest endpoint is this packet: local/demo proof, transparent boundaries, and green CI-backed implementation history.
