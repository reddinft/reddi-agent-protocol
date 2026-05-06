#!/usr/bin/env node
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const prepParent = join(rootDir, "artifacts", "economic-demo-submission-prep");
const outDir = join(prepParent, timestamp);
const latestLink = join(prepParent, "latest");

function latestArtifact(root, filename) {
  const base = join(rootDir, root);
  if (!existsSync(base)) return null;
  const candidates = readdirSync(base, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name, filename))
    .filter((path) => existsSync(join(rootDir, path)))
    .sort();
  return candidates.at(-1) ?? null;
}

function required(path, label) {
  if (!path) throw new Error(`missing_${label}`);
  return path;
}

const evidence = {
  playwright: process.env.ECONOMIC_DEMO_PLAYWRIGHT_EVIDENCE || "artifacts/playwright-economic-demo",
  surfpool: required(latestArtifact("artifacts/economic-demo-surfpool-rehearsal", "summary.json"), "surfpool_summary"),
  jupiterQuote: required(latestArtifact("artifacts/economic-demo-jupiter-quote-proof", "quote-proof.json"), "jupiter_quote_proof"),
  upfrontPack: required(latestArtifact("artifacts/economic-demo-upfront-payment-evidence", "upfront-payment-evidence.json"), "upfront_payment_pack"),
  livePaymentGate: required(latestArtifact("artifacts/economic-demo-live-payment-gate", "gate.json"), "live_payment_gate"),
  devnetUsdcReceipt: required(latestArtifact("artifacts/economic-demo-devnet-usdc-receipt", "receipt-verification.json"), "devnet_usdc_receipt_verification"),
  senderPlan: required(latestArtifact("artifacts/economic-demo-devnet-usdc-sender-plan", "sender-plan.json"), "sender_plan"),
  proofHierarchy: "docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md",
  bdd: "docs/bdd/features/bucket-j-end-user-economic-demo.feature",
};

if (!existsSync(join(rootDir, evidence.proofHierarchy))) throw new Error("missing_proof_hierarchy_doc");
if (!existsSync(join(rootDir, evidence.bdd))) throw new Error("missing_bdd_feature");

mkdirSync(outDir, { recursive: true });
const prepPath = join(outDir, "SUBMISSION-PREP.md");
const content = `# Economic Demo Submission Prep

Scope: safe local/demo prep only. Generated: ${new Date().toISOString()}.

## Demo entrypoint

- Route: \`/economic-demo\`
- PR: \`https://github.com/nissan/reddi-agent-protocol/pull/244\`
- BDD: \`${evidence.bdd}\`
- Proof hierarchy: \`${evidence.proofHierarchy}\`

## Current green evidence

- BDD index guard: \`npm run test:bdd:index\`
- Economic demo Playwright: \`npx playwright test e2e/economic-demo.spec.ts\`
- App build: \`npm run build\`
- Upfront evidence pack: \`npm run evidence:economic-demo:upfront-payment\`
- Jupiter quote proof: \`npm run smoke:economic-demo:jupiter-quote\`
- Live payment gate: \`npm run check:economic-demo:live-payment-gate\` (blocked by default, safe)
- Devnet USDC receipt verifier: \`npm run verify:economic-demo:devnet-usdc-receipt\` (blocked by default, safe)
- Devnet USDC sender plan: \`npm run plan:economic-demo:devnet-usdc-sender\` (blocked by default, safe)

## Local evidence paths to mention/demo

- Playwright evidence directory: \`${evidence.playwright}\`
- Surfpool/local payment semantics: \`${evidence.surfpool}\`
- Live Jupiter quote-only proof: \`${evidence.jupiterQuote}\`
- Upfront payment evidence pack: \`${evidence.upfrontPack}\`
- Live payment gate artifact: \`${evidence.livePaymentGate}\`
- Devnet USDC receipt verification artifact: \`${evidence.devnetUsdcReceipt}\`
- Devnet USDC sender plan artifact: \`${evidence.senderPlan}\`
- Proof hierarchy doc: \`${evidence.proofHierarchy}\`

## Five-beat recording outline

1. Open \`/economic-demo\` and state the end-user asks an orchestrator to buy downstream agent work.
2. Show the upfront quote, user payment edge, downstream specialist/attestor fees, and retained markup.
3. Show communication graph and payment graph together: user → orchestrator → specialists/attestors → final output.
4. Show evidence hierarchy: deterministic UI, Surfpool local payment semantics, live Jupiter quote-only proof, devnet USDC receipt verifier, live payment gate/sender plan.
5. Close with the hard boundary: quote-only is not executed swap, blocked verifier/gate artifacts are safety evidence, and live signing/spend requires explicit approval.

## Hard no-go list unless Nissan explicitly approves

- No Phase 6 controlled live research
- No OpenAI/Fal image generation
- No paid provider requests
- No signing operations
- No wallet mutation
- No devnet transfer
- No mainnet transfer
- No Jupiter swap execution
- No Coolify/env mutation

## Proof hierarchy claims

Safe to say:

- The UI demonstrates upfront-funded consumer-agent orchestration.
- Surfpool/local evidence proves payment ordering, budget reconciliation, and blocked-edge zero-delta behavior.
- Jupiter quote proof proves live route availability only.
- Devnet USDC receipt verification is ready and fail-closed, but default artifacts are blocked until a real signature is supplied.
- Sender/swap execution is planned and gated, not claimed.

Not safe to say yet:

- The app executed a live Jupiter swap.
- The app transferred devnet or mainnet USDC by itself.
- A judge wallet was charged.
- Mainnet settlement is supported.
`;
writeFileSync(prepPath, content);

try {
  if (existsSync(latestLink)) rmSync(latestLink, { recursive: true, force: true });
  symlinkSync(relative(prepParent, outDir), latestLink, "dir");
} catch {
  // Symlink creation is best-effort; checker can still discover newest timestamped prep dir.
}

console.log(JSON.stringify({ ok: true, prepPath, latestLink }, null, 2));
