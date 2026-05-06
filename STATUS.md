# Reddi Agent Protocol Code — STATUS

**Last updated:** 2026-05-06 AEST
**State:** 🟢 Full Quasar critical-success gate passed via Issue #236 and PR #244. Nissan clarified on 2026-05-06 that scoped Quasar proof was not sufficient; final readiness requires every demo-critical on-chain path to use Quasar-compiled Solana programs, with no Anchor-powered final demo path. That is now implemented: `packages/demo-agents/src/demo.ts` runs a Quasar-native A→B→C flow across Quasar Registry, Escrow, Reputation, and Attestation program IDs. MagicBlock PER/TEE is explicitly fail-closed/not claimed for the final Quasar path unless separately live-validated. New Quasar CI cutover work has begun: `docs/QUASAR-CI-CUTOVER-BDD-PLAYBOOK-2026-05-06.md` documents the phased BDD/retrospective loop, Quasar program sources are imported under `experiments/quasar-*`, vendored framework crates are under `third_party/quasar`, and local Quasar program compile/test loop passes for all four programs. Live research, real image generation, deployment, env/Coolify/Vercel mutation, and paid/live specialist work remain approval-gated.

## RESUME FROM HERE

1. Phase 7 picture storyboard artifact generator is complete through PR #221. Do not run real OpenAI/Fal image generation without explicit approval, provider choice, and budget cap.
2. GitHub Actions Node.js 20 deprecation cleanup is complete through PR #223; post-merge `main` Anchor CI has no Node.js 20 deprecation annotation.
3. Quasar cutover follows Issue #236, `docs/QUASAR-HACKATHON-CUTOVER-PLAN-2026-05-05.md`, and the refined staged playbook `docs/QUASAR-BDD-ITERATIVE-PLAYBOOK-2026-05-05.md`. Phase 1 inventory is scaffolded at `config/quasar/deployments.json` with `npm run check:quasar:deployments`. Quasar devnet programs are escrow `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`, registry `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`, reputation `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`, attestation `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`. Phase 2 guard is `npm run check:quasar:demo-readiness`; Phase 3 app/demo-agent target flag wiring merged via PR #239. Use `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar` / `HACKATHON_DEMO_TARGET=quasar` / `DEMO_PROGRAM_TARGET=quasar` for devnet Quasar target selection. Phase 5/6/7/8/9 is active in PR #244 on `feat/quasar-shared-instruction-builders-20260505`: `/register`, demo-agent registration, onboarding attestation construction, `/economic-demo` honesty UI, read/decode paths, reputation commit/reveal, and onboarding registration/confirm/dispute builders are Quasar-compatible. Phase 9 scoped the legacy full-flow/PER demo-agent script out of Quasar proof and added a fail-closed Quasar target guard. Runtime compatibility blockers reduced 6→4→1→0. Phase 10 added a Quasar CI/readiness guard. Phase 11 refreshed the judge packet/operator checklist/scoped proof doc; `submissionReady=true` now applies to the scoped Quasar proof boundary (not live PER/TEE). Phase 13 local confidence/devnet-prep is complete. Phase 14 devnet registration is complete after Nissan approval: A tx `iLudQFTyJ7c7mpzDxWMZaLEptmv1H3eM7NtfmSULLi6FTQKkaKvEJeE3hFn5Tf3YQEEvvhJcX7nvJucjyE8eghX`, B tx `2KnvFgTm3ivqis5iFAxpyX4TkH1Zbyv2sfv975MtT6Be39kTy8mabRmf9jWXJekVY22NLKaR3cAb9dVsC8oFcFMi`, C tx `46H43gGDZFvWL9oLzg1iNXTdweuihmbp9DH2fKhHdpeJKdxywUKsFdTkna8XxeyKeXhsZ53ykbPjLzQ9AotGGeS9`; readback artifact `artifacts/quasar-devnet-registration/20260505T211525Z/`. Next operational step: do not merge as final-ready. Phase 15 is complete: `packages/demo-agents/src/demo.ts` now has a Quasar-native full A→B→C flow using Quasar escrow public settlement plus Quasar reputation/attestation program-local setup. MagicBlock PER/TEE is explicitly not claimed by this Quasar final path and fails closed if requested. The hard gate `npm run check:quasar:critical-success` passes. Do not deploy, mutate env/Coolify/Vercel, or run paid/live specialist work without explicit approval.

4. Quasar CI cutover is now documented in `docs/QUASAR-CI-CUTOVER-BDD-PLAYBOOK-2026-05-06.md`. Phase 0 retrospective is complete. Phase 1 imported Quasar program sources into `experiments/quasar-escrow`, `experiments/quasar-registry`, `experiments/quasar-reputation`, and `experiments/quasar-attestation`, with `quasar-lang` normalized to repo-local `third_party/quasar`. Phase 2 added `scripts/run-quasar-program-tests.sh` and `.github/workflows/quasar-program-tests.yml`. Local validation: `PATH="$HOME/.cargo/bin:$PATH" bash scripts/run-quasar-program-tests.sh` passed all four program compile/test loops: escrow 7/7, registry 10/10, reputation 11/11, attestation 13/13. First GitHub run failed because vendored `third_party/quasar/Cargo.toml` still listed upstream workspace members not copied into the repo (`idl`, `profile`, examples, tests, CLI); fixed by narrowing workspace members to `lang`, `derive`, `pod`, `spl`. Second GitHub run then exposed Solana `cargo build-sbf` using older Cargo 1.79, which cannot parse workspace resolver 3; downgraded vendored Quasar workspace resolver to 2 while preserving edition 2021. Revalidated `cargo metadata` + full local compile/test loop. Third GitHub run then exposed transitive lockfile incompatibility: `proc-macro-crate 3.5.0` pulled edition-2024 `toml_datetime 1.1.x`; pinned experiment lockfiles to `proc-macro-crate 3.3.0` so Solana Cargo 1.79 resolves `toml_edit 0.22.27` / `toml_datetime 0.6.11`. Full local compile/test loop passes again. Fourth GitHub run then exposed another edition-2024 crate (`wincode-derive 0.4.4`), proving the deeper issue is workflow toolchain drift: local uses `cargo-build-sbf 4.0.0`/`solana-cli 3.1.13`, workflow used Anza `v2.2.0`/Cargo 1.79. Updated Quasar workflow to install Anza `v3.1.13`. Next: push the fix to PR #244, observe GitHub `Quasar Program Tests (QuasarSVM / LiteSVM)`, then Phase 3 can de-scope legacy Anchor CI from final proof after branch-protection check-name risk is resolved.

## Current Branch / Repo State

- Local branch: `feat/quasar-shared-instruction-builders-20260505` (PR #244, shared Quasar instruction builders + register/demo/onboarding construction + register honesty UI + refined staged BDD plan).
- Local working tree: contains follow-up Quasar CI parity fix: `.github/workflows/quasar-program-tests.yml` updated from Anza `v2.2.0` to `v3.1.13` to match local `cargo-build-sbf 4.0.0`/Rust 1.89 stack after repeated Cargo 1.79 edition-2024 failures. Experiment lockfiles are also pinned to `proc-macro-crate 3.3.0`. PR #244 checks are now green and mergeStateStatus is CLEAN. Next step: Phase 3 retrospective/branch-protection decision before renaming or de-scoping branch-protection-sensitive legacy Anchor check names, then add the corrected goal-alignment loop: a bounty/product coverage matrix for MagicBlock, x402, Jupiter, OpenRouter, and Surfpool across every final demo/evidence surface.
- Latest observed `origin/main`: `1f1de7d2 chore: add Quasar runtime compatibility boundary (#242)`; check `git fetch && git log origin/main -1` before merging.
- Current PR: #244 `feat: add shared Quasar instruction builders` — open, but no longer final-ready after Nissan critical-success correction. Latest branch state adds refined Phase 6.2–12 plan, BDD retrospective-gate scenario, Phase 6.2 `/economic-demo` Quasar status card, Phase 7 target-aware Quasar AgentAccount read/decode compatibility, Phase 8 Quasar reputation/onboarding tx wrapper routing, Phase 9 demo-agent/PER scoped-proof guard, Phase 10 Quasar CI/readiness guard, Phase 11 scoped judge packet refresh, and Phase 12 final validation boundary. Local validation passed (`npm run build`, focused Quasar Jest, `npm run check:quasar:submission` now submissionReady=true, BDD index, `git diff --check`). Latest PR #244 head `f158acb5`; GitHub/Vercel checks are all green as of 2026-05-06 AEST.
- PR #204: closed as superseded after Nissan accepted recommendation.
- PR #214: merged 2026-05-05 AEST as `a290db7093458f45ca1b3dbc2a047b404c856a29`; post-merge Anchor run `25353582949`, job `74338163008` passed in 7m26s.
- PR #215: merged 2026-05-05 AEST as `cd202ebd6360d29f0a896e852fe9f63c339fc4dc`; post-merge Anchor run `25353973718`, job `74339305929` passed in 7m23s.


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

Validation for Phase 2 PR #209:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/209
- Merge commit: `b12a3c875e291562e7ec35e2c50231f2902df495`
- PR checks passed: Vercel Preview Comments, Vercel deployment, Anchor runs `25347986266` / `25347987599`.
- Post-merge `main` Anchor run `25348267647`, job `74322061553` — PASS, 6m15s.

Validation for Phase 2.5 latest evidence-pack UI wiring:

- `npx jest --runTestsByPath lib/__tests__/economic-demo-webpage-live-workflow-evidence.test.ts --runInBand` — PASS, 3/3.
- Targeted ESLint for economic-demo page/API/evidence helper/server/test — PASS.
- `npm run build` — PASS.
- `npm run test:bdd:index` — PASS.
- `git diff --check` — PASS.
- Note: build retains existing workspace-root warning due multiple lockfiles; no build failure.


Validation for Phase 2.5 PR #211:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/211
- Merge commit: `0a6999a1e16b6a036e4dd31796533d5d3a092bc4`
- PR checks passed: Vercel Preview Comments, Vercel deployment, Anchor runs `25350902818` / `25350904030`.
- Post-merge `main` Anchor run `25351170348`, job `74330869241` — PASS.

Validation for Phase 3 local manifest parity:

- `npm test --prefix packages/openrouter-specialists` — PASS, 54/54.
- `npm run manifest:parity --prefix packages/openrouter-specialists` — PASS, 30/30 profiles checked.
- Targeted ESLint for OpenRouter specialist runtime/disclosure/test files — PASS.
- `npm run test:bdd:index` — PASS.
- `npm run build` — PASS (existing multiple-lockfile workspace-root warning; existing Turbopack NFT trace warning from server-side evidence-pack fs loader).
- `git diff --check` — PASS.


Validation for Phase 3 PR #212:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/212
- Merge commit: `fee12f3ab42d99a29c90dcb68c9daa8ca5bf1ae4`
- PR checks passed: Vercel Preview Comments, Vercel deployment, Anchor runs `25351399981` / `25351401488`.
- Post-merge `main` Anchor run `25351648417`, job `74332350244` — PASS, 7m23s.
- GitHub Actions warning persists: Node.js 20 actions deprecation for `actions/cache@v4` and `actions/checkout@v4`.

Validation for Phase 3 status PR #213:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/213
- Merge commit: `95e1489e92efdc4b99de8ae49eb33e921742da82`
- PR checks passed: Vercel Preview Comments, Vercel deployment, Anchor run `25351900034`.
- Post-merge `main` Anchor run `25352130407`, job `74333836069` — PASS.

Validation for Phase 4 hosted manifest redeploy/smoke:

- Operator approval: Nissan confirmed authority to approve hosted Phase 4.
- Baseline smoke before redeploy: `artifacts/manifest-parity-phase4/before-redeploy-smoke.json` — 0/30 hosted manifests current, proving redeploy was necessary.
- Coolify redeploy trigger: `artifacts/manifest-parity-phase4/coolify-redeploy.json` queued 27/30; first retry `coolify-redeploy-retry.json` queued remaining 3/3 after queue backpressure; `coolify-redeploy-collective-retry.json` retried the one failed deployment.
- Progressive public smoke: `after-redeploy-smoke-attempt-*.json`; final sanitized evidence: `artifacts/manifest-parity-phase4/final-hosted-manifest-smoke.json` — 30/30 hosted `/.well-known/reddi-agent.json` endpoints current.
- Final manifest parity assertion: each hosted manifest exposes `agenticWorkflowDisclosure`, `dependencyDisclosure`, `tools`, `skills`, `marketplaceAgentCalls`, `externalMcpServers`, `nonMarketplaceAgentCalls`, and `disclosurePolicy` with `dependencyDisclosure.schemaVersion = reddi.agent-dependency-manifest.v1`.
- Secret grep over Phase 4 artifact JSON for API/token/secret patterns — PASS (no matches).

Validation for Phase 5 research dry-run planning:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/215
- Merge commit: `cd202ebd6360d29f0a896e852fe9f63c339fc4dc`
- Local validation before PR: `npm run test:bdd:index` — PASS; `git diff --check` — PASS.
- PR checks passed before merge: Vercel, `bdd-index-guard`, `source-conformance-matrix`, Anchor run `25353751238`.
- Post-merge `main` Anchor run `25353973718`, job `74339305929` — PASS, 7m23s.

Validation for Phase 5 Surfpool local-validator live tests:

- Approval scope: Nissan explicitly approved live tests in Surfpool local validator because they do not risk real or devnet tokens.
- `npm run smoke:economic-demo:surfpool` — PASS; artifact `artifacts/economic-demo-surfpool-rehearsal/20260505T021309Z/summary.json`.
  - Offline Surfpool RPC `http://127.0.0.1:19101`.
  - Executed 4 local SOL transfers from `agentic-workflow-system` to webpage specialists.
  - Positive proof: planned transfer amount `3,500,000` lamports; total credited `3,500,000`; total debited `3,520,000` including fees; credited matches transfers = true; debit covers transfers and fees = true.
  - Negative proof: not-allowlisted and over-budget blocked transfers were not executed; blocked delta `0`.
- `npm run test:surfpool:critical` — PASS; artifact `artifacts/surfpool-smoke/20260505-121331/SUMMARY.md`.
  - Surfpool local RPC `http://127.0.0.1:18999`.
  - Program deployed to local Surfpool; public settlement path passed; PER-unreachable fallback to L1 local path passed.
- Secret grep over Surfpool evidence artifacts for API/token/private-key patterns — PASS (no matches).

Validation for Phase 5 research dry-run disclosure implementation:

- PR: https://github.com/nissan/reddi-agent-protocol/pull/217
- Merge commit: `ecdcdbd1381e8526a3118ac9496853f74fb4367e`
- Implemented `reddi.economic-demo.research-workflow-design.v2`: agentic-workflow-system orchestrates, scientific-research-agent remains synthesis specialist, every planned edge declares payload class, citation/evidence caveat, attestor criteria, refund/dispute behavior, and planned downstream-disclosure ledger expectations.
- Local validation before PR: targeted Jest (4/4) — PASS; targeted ESLint — PASS; `npm run test:bdd:index` — PASS; `npm run build` — PASS; `git diff --check` — PASS.
- PR checks passed before merge: Vercel Preview Comments, Vercel deployment, Anchor run `25354771446`, job `74341647480` — PASS, 7m15s.
- Post-merge `main` Anchor run `25354979566`, job `74342253225` — PASS, 7m30s.

Validation for Phase 5 research dry-run artifact generator slice:

- `npm run evidence:economic-demo:research-dry-run` — PASS; artifact `artifacts/economic-demo-research-dry-run/20260505T025224Z/research-dry-run.json`.
- Artifact summary: scenario `research`, mode `dry_run_no_live_calls`, orchestrator `agentic-workflow-system`, 5 planned edges, downstream calls executed `0`, x402 state `planned` for every edge, live calls/provider requests/signing/wallet mutation/devnet transfers all `0`.
- Targeted Jest for dry-run + research design — PASS, 5/5.
- `node --check scripts/generate-economic-demo-research-dry-run.mjs` — PASS.
- Targeted ESLint + `npm run test:bdd:index` + `npm run build` + `git diff --check` — PASS.
- Secret grep over generated dry-run artifact produced only policy-text false positives (`secrets`, `Coolify` guardrail wording); no credential material present.
- PR: https://github.com/nissan/reddi-agent-protocol/pull/218
- Merge commit: `5da85ccdd78661b3ea29a3c69ce2bcf9885f7de0`
- PR checks passed before merge: Vercel Preview Comments, Vercel deployment, `bdd-index-guard`, `source-conformance-matrix`, Anchor run `25355281318`, job `74343109526` — PASS, 7m30s.
- Post-merge `main` Anchor run `25355508196`, job `74343778434` — PASS, 7m35s.

Validation for Phase 7 picture storyboard dry-run slice:

- Added `reddi.economic-demo.picture-storyboard-design.v1` design/API/UI path for storyboard-only picture proof.
- The image-generation adapter is explicitly represented as `blocked` with `x402State = blocked_disabled_adapter` and `reddi.downstream-disclosure-ledger.v1` expectations.
- Storyboard frames include positive prompts, negative prompts, and evidence caveats; `imageGenerationExecuted = 0`, `downstreamCallsExecuted = 0`.
- Targeted Jest for picture storyboard + dry-run — PASS, 7/7.
- Targeted ESLint for picture storyboard design/test/API/page — PASS.
- `npm run test:bdd:index` — PASS.
- `npm run build` — PASS; existing workspace-root/NFT trace warnings only.
- `git diff --check` — PASS.
- PR: https://github.com/nissan/reddi-agent-protocol/pull/219
- Merge commit: `2fdf97068f6c40f61b840aa7c0914f4bb324f3aa`
- PR checks passed before merge: Vercel Preview Comments, Vercel deployment, `bdd-index-guard`, `source-conformance-matrix`, Anchor run `25355869246`, job `74344891406` — PASS, 6m2s.
- Post-merge `main` Anchor run `25356047688`, job `74345428981` — PASS, 7m13s.

Validation for Phase 7 picture storyboard artifact generator slice:

- Added `scripts/generate-economic-demo-picture-storyboard.mjs` and `npm run evidence:economic-demo:picture-storyboard`.
- Generated artifact `artifacts/economic-demo-picture-storyboard/20260505T034749Z/picture-storyboard.json` with schema `reddi.economic-demo.picture-storyboard-artifact.v1`.
- Artifact summary: scenario `picture`, mode `storyboard_no_image_generation`, orchestrator `tool-using-agent`, 4 edges, 4 storyboard frames, blocked adapter x402 state `blocked_disabled_adapter`, `imageGenerationExecuted = 0`, `downstreamCallsExecuted = 0`.
- Safety review counters: OpenAI image requests `0`, Fal.ai image requests `0`, paid provider requests `0`, signing operations `0`, wallet mutations `0`, devnet transfers `0`.
- Secret grep over generated artifact produced only policy-text false positive `ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION`; no credential material present.
- Local validation: `npm run evidence:economic-demo:picture-storyboard`, targeted Jest, `node --check`, targeted ESLint, `npm run test:bdd:index`, `npm run build`, `git diff --check` — PASS.
- PR: https://github.com/nissan/reddi-agent-protocol/pull/221
- Merge commit: `a48478cb69416a039ad4b9851cb328751b5e47d4`
- PR checks passed before merge: Vercel Preview Comments, Vercel deployment, `bdd-index-guard`, `source-conformance-matrix`, Anchor run `25356793595`, job `74347616865` — PASS, 7m43s.
- Post-merge `main` Anchor run `25357010731`, job `74348248057` — PASS, 7m29s.

Validation for Phase 7 picture storyboard artifact generator + Node 24 CI cleanup:

- PR #221: https://github.com/nissan/reddi-agent-protocol/pull/221
- PR #221 merge commit: `a48478cb69416a039ad4b9851cb328751b5e47d4`
- PR #221 validation: `npm run evidence:economic-demo:picture-storyboard`, targeted Jest, `node --check`, targeted ESLint, `npm run test:bdd:index`, `npm run build`, `git diff --check` — PASS.
- PR #221 post-merge `main` Anchor run `25357010731`, job `74348248057` — PASS, 7m29s.
- PR #222: https://github.com/nissan/reddi-agent-protocol/pull/222
- PR #222 merge commit: `b3db8b1e87472f6ecc26e8409be89009e4cb98bb`
- PR #222 post-merge `main` Anchor run `25357441743`, job `74349566708` — PASS, 7m13s.
- PR #223: https://github.com/nissan/reddi-agent-protocol/pull/223
- PR #223 merge commit: `c9ba5835844733f8096d5b580d3191addf53fa47`
- PR #223 validation: Ruby YAML parse over `.github/workflows/*.yml`, `git diff --check`, PR checks — PASS.
- PR #223 changed `actions/checkout@v4` → `actions/checkout@v5` across workflows and `actions/cache@v4` → `actions/cache@v5` in Anchor CI.
- PR #223 post-merge `main` Anchor run `25358109765`, job `74351504389` — PASS, 7m30s.
- Post-merge log grep for `Node.js 20`, forced runtime warnings, and old `actions/*@v4` usage produced no matches.

- PR #224: https://github.com/nissan/reddi-agent-protocol/pull/224
- PR #224 merge commit: `17a401645aaf528b26d81783b0e2ab31ffc46706`
- PR #224 post-merge `main` Anchor run `25358560125`, job `74352818548` — PASS, 7m15s.
- PR #225: https://github.com/nissan/reddi-agent-protocol/pull/225
- PR #225 merge commit: `f36d4bb55b7f10bbc5177b3fda189c67f17d7cd3`
- PR #225 validation: `npx eslint app/economic-demo/page.tsx`, `npm run build`, `git diff --check`, PR checks — PASS.
- PR #225 post-merge `main` Anchor run `25359075289`, job `74354425576` — PASS, 7m24s.
- `/economic-demo` now links to latest local/ignored dry-run artifact paths without loading or publishing private logs and without triggering live calls.

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

- 2026-05-05: `/economic-demo` should prefer the latest generated judge evidence-pack `disclosureLedgerSummary` when present, with fallback to the truthful historical pre-ledger summary.
- 2026-05-05: `/.well-known/reddi-agent.json` must expose programmatic dependency disclosure parity with public marketplace cards/details before any purchase: tools, skills, marketplace-agent calls, external MCP servers, non-marketplace service calls, and downstream ledger disclosure policy.
- 2026-05-05: Hosted Phase 4 redeploy/smoke is approved and complete; public hosted OpenRouter specialist manifests now expose dependency disclosure parity across 30/30 endpoints.
- 2026-05-05: Surfpool local-validator live tests are approved as a safe validation lane because they use only offline/local SOL and do not risk real or devnet tokens.
- 2026-05-05: Research workflow orchestration should be owned by `agentic-workflow-system`; `scientific-research-agent` stays a synthesis specialist so paid-edge coordination and evidence synthesis remain separate.
- 2026-05-05: Phase 6 controlled live research remains approval-gated; next safe progress is Phase 7 storyboard dry-run with image generation disabled.
- 2026-05-05: Phase 7 storyboard dry-run is merged; real image generation needs a separate approval with provider and budget cap.
- 2026-05-05: Picture storyboard artifact generation should remain local/ignored and assert the disabled adapter as evidence, not omit it.
- 2026-05-05: GitHub Actions Node.js 20 deprecation cleanup uses Node 24-capable action major versions (`actions/checkout@v5`, `actions/cache@v5`) rather than the temporary forced-runtime env workaround.
- 2026-05-05: `/economic-demo` may surface local/ignored evidence artifact paths as operator pointers, but must not publish private logs or trigger live calls from that panel.

## Blockers / Watch Items

- Live hosted/devnet economic workflow evidence still predates Phase 4 hosted manifest parity; regenerate only under an explicit hosted/devnet live-run approval gate.
- Phase 6 controlled live research is blocked pending explicit approval for hosted/devnet live downstream specialist calls and spend.
- Phase 7 picture/storyboard work must remain dry-run/local-only first: no OpenAI/Fal image generation, paid provider spend, hosted downstream calls, real/devnet signing, wallet mutation, or devnet transfer without specific approval.
- Existing demo-agent CLI copy still labels some local Surfpool transactions as `devnet`/Explorer links even when RPC is local; keep evidence/status wording explicit that the executed lane used local Surfpool RPC.


## Update — 2026-05-06 10:31 AEST

PR #244 checks green after Quasar CI parity fixes. Evidence: `Build & Test (Anchor 1.0.0 / LiteSVM)`, both `Quasar Program Tests (QuasarSVM / LiteSVM)` runs, `bdd-index-guard`, `quasar-readiness`, `source-conformance-matrix`, Vercel Preview Comments, and `Vercel – reddi-agent-protocol` all passed. `gh pr view 244` reports `mergeStateStatus: CLEAN` at head `64088501c1bbb0c15f5ff2d65545a6722d656f0f`.

RESUME FROM HERE: start Phase 3 by writing the CI cutover retrospective and deciding how to handle branch-protection-sensitive legacy Anchor workflow/check names. Do not rename/remove Anchor checks until branch protection is confirmed safe.


## Goal alignment correction — 2026-05-06

Nissan clarified the plan must optimize for the full Colosseum Frontier submission goal, not just scoped Quasar CI success: all final demo-critical on-chain paths must use Quasar-compiled Solana programs, and the demos must visibly use the identified bounty protocols/products (MagicBlock, x402, Jupiter, OpenRouter, Surfpool). Updated `docs/QUASAR-BDD-ITERATIVE-PLAYBOOK-2026-05-05.md` and `docs/QUASAR-HACKATHON-CUTOVER-PLAN-2026-05-05.md` with a corrected north-star, demo/bounty coverage matrix, and next loops: CI proof boundary → bounty coverage guard → evidence refresh → MagicBlock decision gate → final rehearsal.

## Surfpool Quasar localnet gate — 2026-05-06

Nissan asked whether Surfpool localnet should be the confidence gate before devnet/testnet. Yes. The old `npm run test:surfpool:critical` still exercised legacy Anchor (`Target: legacy-anchor`), so it is not sufficient final-demo proof. Added `scripts/run-surfpool-quasar-critical-smoke.sh` and `npm run test:surfpool:quasar-critical`, which starts local Surfpool, deploys Quasar escrow/registry/reputation/attestation programs locally, registers A/B/C under the local Quasar Registry, and runs the Quasar-native A→B→C flow.

Latest local evidence:
- `npm run test:surfpool:quasar-critical` PASS → artifact `artifacts/surfpool-quasar-smoke/20260506-113324/SUMMARY.md`
- `npm run check:quasar:submission` PASS
- `npm run test:bdd:index` PASS
- `NEXT_PUBLIC_DEMO_PROGRAM_TARGET=quasar npm run build` PASS
- Read-only devnet PDA check confirms both legacy Anchor A/B/C and Quasar Registry A/B/C accounts exist; Quasar Registry A/B/C data length is 153. No deregistration is needed for the Quasar path; legacy cleanup is optional and approval-gated.

## Devnet Quasar rehearsal — 2026-05-06

After Nissan approved rerunning the failed/approval-gated commands, ran the Quasar-native devnet A→B→C rehearsal without deregistering legacy Anchor accounts. Result: PASS.

Command:

```bash
DEMO_PROGRAM_TARGET=quasar HACKATHON_DEMO_TARGET=quasar DEMO_SETTLEMENT_MODE=public DEMO_STOP_AFTER_SETTLEMENT=true npm run demo
```

Evidence:
- Target: `quasar`
- Escrow: `VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW`
- Registry: `Xk7jczJZ1HHJZuE1ZUWDqFmowxYhnom7mWzrNSGf9FU`
- Reputation: `nb9rLVjoHMibsgfRGgKuPqm6M8GVcH9r6bYNfg7Yiy6`
- Attestation: `CRGsWWkptdxsH6N6aWAyahLbuMsT58yM624EopEsv1Ex`
- Escrow lock tx: `5E7u1LkzezkVTm815o75uKPt6wN7U63EcDk7sjNmv7HvUquqLWUBaBNCkfvtGkME5HQVK6xrZkEknZTt3Pq4dnny`
- Quasar public settlement tx: `9yDRZ9MGW7DuoQj8w6HQapzQSHsuumFY58NUueBR6TVsK4N1D4b8hn6Kv39VNd3AVozJq2bKaZX22yXSupqcTzb`
- Escrow PDA: `A8Lsq7aiDQ1pb8SZLgFyn2HWCRhbpFG2RvcJGpXbR9ZW`
- Rating PDA: `E6pFbn5xMKTXEssBxMY8Na3aW23sLTEqnmG5MyWqQANe`
- Attestation PDA: `FTa8U3Gg1eGnMGb2J5y88pfqqqtnjCy7995JEPoxmZLB`
- Runtime: 6805ms (<10s target)

MagicBlock PER/TEE was not claimed; the command used Quasar public settlement. Jupiter integration remains wired/verified but live swap requires `JUPITER_API_KEY`.

## Pitch reference ingested — SPAN XFRA / home mini data centers

Ingested CNBC/SPAN reference on NVIDIA + PulteGroup helping SPAN put mini data-center / XFRA nodes on homes. Research note: `docs/research/SPAN-XFRA-MINI-DATA-CENTERS-2026-05-06.md`. Pitch relevance: external proof point that AI compute is moving to distributed residential/grid-edge infrastructure; Reddi can be positioned as the protocol layer for agent identity, x402-style payment intent, Solana/Quasar settlement, reputation, attestation, and disclosure across that edge-compute economy.

## Pitch deck update — SPAN XFRA reference

Updated internal hackathon screen deck with a new market-proof slide after the home slide: `public/_internal/hackathon-slides/index.html` now includes “Market Proof: compute is moving to the edge,” citing CNBC’s NVIDIA + PulteGroup + SPAN residential mini data-center story. Updated `SLIDES.md` and `slide_manifest.csv`. The slide frames the thesis: “The data center is moving into the neighborhood. The coordination layer is missing,” then maps Reddi to identity, x402 payment intent, Quasar/Solana settlement, reputation, attestation, and disclosure.

## Quasar security audit ingestion — 2026-05-06

Ingested `docs/QUASAR-PROGRAMS-SECURITY-AUDIT-2026-05-06.md` and added remediation log `docs/QUASAR-PROGRAMS-SECURITY-REMEDIATION-2026-05-06.md`. Immediate hardening is applied on the current PR branch: escrow cancel window restored, escrow timestamp/slot restored, checked lamport arithmetic, overflow-check profiles, canonical devnet `declare_id!` values, pinned `quasar-svm` rev, zero-commit rejection, domain-separated reputation commitments, participant-only expiry, self-confirmation guard, and `third_party/quasar/VERSION.md`. Local validation passed: `PATH="$HOME/.cargo/bin:$PATH" bash scripts/run-quasar-program-tests.sh` (7/7 escrow, 10/10 registry, 11/11 reputation, 13/13 attestation), `npm run check:quasar:critical-success`, `npm run test:bdd:index`, `git diff --check`.

**Important:** full architectural findings remain open and are not mainnet-ready: job-binding for rating/attestation PDAs, payee dispute/claim path, reputation laundering policy, and canonical agent registry unification. Do not claim mainnet-ready Quasar programs until those are designed, implemented, and re-reviewed.
