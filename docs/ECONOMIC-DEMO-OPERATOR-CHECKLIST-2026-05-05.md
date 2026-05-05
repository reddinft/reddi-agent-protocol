# Economic Demo Operator Checklist

_Date:_ 2026-05-05 AEST  
_Status:_ Phase 2 committed checklist for Issue #228  
_Demo route:_ `/economic-demo`  
_Local preflight:_ `npm run check:economic-demo:submission-prep`

## Purpose

Use this checklist to record or narrate the economic demo without relying on chat memory and without making unsupported claims.

This checklist is public-safe repo documentation. It references local ignored evidence paths only as operator pointers; it does not publish raw artifact contents or private logs.


## Quasar cutover operator note

Hackathon demos now target Quasar-deployed Solana programs, not the legacy Anchor deployment. Candidate devnet Quasar program: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW` (`config/quasar/deployments.json`). Treat any missing Quasar runtime wiring, PER/privacy-aware settlement proof, judge-packet refresh, signing, deployment, wallet mutation, devnet transfer, Coolify/env mutation, or paid/live provider call as an approval-gated blocker. Anchor CI can be cited only as historical/legacy implementation evidence, never as final Quasar submission proof.

## Before recording

1. Confirm the repo is on the intended branch or `main`.
2. Run the local prep checker:

   ```bash
   npm run check:economic-demo:submission-prep
   ```

3. Confirm the latest prep pack exists locally under `artifacts/economic-demo-submission-prep/`.
4. Open `/economic-demo`.
5. Jump to `#local-evidence-artifacts` when showing local evidence pointers.

## Five-beat narration

### 1. What Reddi is proving

Say:

> This demo shows an agentic workflow economy: a user request is routed through an orchestrator, specialist agents, attestors, x402 payment challenges, and disclosure-ledger evidence.

Point to:

- end-user request;
- orchestrator and specialist graph;
- attestor guidance;
- x402 challenge/receipt language;
- disclosure-ledger panels.

Do **not** claim production settlement unless the panel/evidence explicitly proves it.

### 2. Marketplace and disclosure before purchase

Say:

> The important moat is not just that agents can call agents. It is that consumers can inspect dependency disclosure before purchase, and paid responses must disclose downstream calls afterward.

Point to:

- public manifest/dependency disclosure language;
- `reddi.downstream-disclosure-ledger.v1` references;
- any visible distinction between complete evidence and fallback/historical evidence.

### 3. Local evidence paths, not private log dumps

Say:

> The local evidence panel gives the operator exact repo-local artifact paths for audit and recording prep. It does not publish ignored logs, call live endpoints, sign, transfer, or generate images.

Point to:

- `Latest local evidence paths`;
- picture storyboard dry-run path;
- research dry-run path;
- Surfpool local rehearsal path.

### 4. Storyboard-only image path

Say:

> The picture workflow is intentionally storyboard-only here. The adapter is blocked so we can prove prompt/storyboard planning and disclosure requirements before spending on OpenAI or Fal image generation.

Point to:

- Phase 7 picture storyboard dry-run;
- `images generated: 0` / blocked adapter state;
- provider guardrails.

### 5. Verified green chain and remaining gates

Say:

> The current local/demo-prep chain is merged and green through GitHub Actions. Future live research or real image generation is a separate explicit approval step with provider, model, and budget caps.

Cite:

- PR #225 — local evidence UI links; post-merge Anchor run `25359075289`.
- PR #229 — BDD iterative submission readiness plan; post-merge Anchor run `25360618730`.
- PR #230 — local submission-prep checker; post-merge Anchor run `25361165874`.

## What is proven now

- The demo page can explain the economic workflow without live calls on page load.
- The local evidence panel points to deterministic local artifacts.
- The picture path is storyboard-only and blocks real image generation by default.
- The submission-prep pack is locally checkable.
- The BDD plan requires retrospective and refinement before scope expansion.

## What is explicitly not claimed

- No production settlement proof.
- No Phase 6 controlled live research proof.
- No real OpenAI/Fal-generated image proof.
- No new paid provider execution.
- No new signing, wallet mutation, or devnet transfer.
- No Coolify/env mutation.

## If something looks wrong during recording

Stop and record it in the current phase retrospective before expanding scope.

Use this format:

- **What worked:**
- **What failed or surprised us:**
- **Safety/spend review:**
- **Judge clarity:**
- **Plan adjustment:**

Then update `docs/ECONOMIC-DEMO-BDD-SUBMISSION-ITERATIVE-PLAN-2026-05-05.md` before continuing.
