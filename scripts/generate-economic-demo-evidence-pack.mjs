#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const defaultSource = join(rootDir, "artifacts", "economic-demo-webpage-live-x402-workflow", "20260504T093552Z", "summary.json");
const sourcePath = process.env.ECONOMIC_DEMO_EVIDENCE_SOURCE ?? defaultSource;
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = process.env.ECONOMIC_DEMO_EVIDENCE_OUT
  ? join(rootDir, process.env.ECONOMIC_DEMO_EVIDENCE_OUT)
  : join(rootDir, "artifacts", "economic-demo-evidence-pack", timestamp);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function preview(text, max = 520) {
  if (typeof text !== "string") return "";
  return text.replace(/```/g, "~~~").replace(/\s+$/g, "").slice(0, max);
}

function summarizeDisclosureLedger(edge) {
  const ledger = edge.downstreamDisclosureLedger;
  assert(ledger?.schemaVersion === "reddi.downstream-disclosure-ledger.v1", `${edge.profileId}: missing downstream disclosure ledger`);
  assert(Array.isArray(ledger.entries), `${edge.profileId}: disclosure ledger entries must be an array`);
  return {
    schemaVersion: ledger.schemaVersion,
    disclosureScope: ledger.disclosureScope,
    entryCount: ledger.entries.length,
    transparencyGuarantees: Array.isArray(ledger.transparencyGuarantees) ? ledger.transparencyGuarantees : [],
    entries: ledger.entries.map((entry) => ({
      calledProfileId: entry.calledProfileId ?? "none",
      walletAddress: entry.walletAddress ?? null,
      endpoint: entry.endpoint ?? null,
      payloadSummary: preview(entry.payloadSummary, 240),
      payloadHashPresent: Boolean(entry.payloadHashPresent || (typeof entry.payloadHash === "string" && entry.payloadHash.length > 0)),
      x402: {
        state: entry.x402?.state ?? entry.x402?.status ?? "not_applicable",
        amount: entry.x402?.amount ?? null,
        currency: entry.x402?.currency ?? null,
        receiptPresent: Boolean(entry.x402?.receiptPresent || entry.x402?.receipt),
        challengePresent: Boolean(entry.x402?.challengePresent || entry.x402?.challenge),
      },
      attestorLinks: Array.isArray(entry.attestorLinks) ? entry.attestorLinks : [],
      obfuscation: entry.obfuscation ?? null,
    })),
  };
}

function disclosureMarkdown(edge) {
  const ledger = edge.downstreamDisclosureLedgerSummary;
  const lines = [
    `- Disclosure ledger: \`${ledger.schemaVersion}\` · scope=${ledger.disclosureScope} · entries=${ledger.entryCount}`,
  ];

  if (ledger.entries.length === 0) {
    lines.push("  - No downstream calls were disclosed for this edge.");
  } else {
    for (const entry of ledger.entries) {
      lines.push(`  - Called: \`${entry.calledProfileId}\``);
      lines.push(`    - Wallet: \`${entry.walletAddress ?? "not_disclosed"}\``);
      lines.push(`    - Endpoint: \`${entry.endpoint ?? "not_disclosed"}\``);
      lines.push(`    - Payload: ${entry.payloadSummary || (entry.payloadHashPresent ? "hash present" : "not disclosed")}`);
      lines.push(`    - x402: ${entry.x402.state}${entry.x402.amount ? ` · ${entry.x402.amount} ${entry.x402.currency ?? ""}` : ""} · challenge=${entry.x402.challengePresent} · receipt=${entry.x402.receiptPresent}`);
      if (entry.attestorLinks.length > 0) lines.push(`    - Attestors: ${entry.attestorLinks.map((link) => `\`${link}\``).join(", ")}`);
      if (entry.obfuscation) lines.push(`    - Obfuscation: ${typeof entry.obfuscation === "string" ? entry.obfuscation : JSON.stringify(entry.obfuscation)}`);
    }
  }

  if (ledger.transparencyGuarantees.length > 0) {
    lines.push(`  - Guarantees: ${ledger.transparencyGuarantees.join(", ")}`);
  }

  return lines.join("\n");
}

function edgeMarkdown(edge) {
  return [
    `### ${edge.step}. ${edge.profileId}`,
    "",
    `- Capability: \`${edge.capability}\``,
    `- Endpoint: \`${edge.endpoint}\``,
    `- x402 challenge: HTTP 402 · ${edge.challenge.amount} ${edge.challenge.currency} · ${edge.challenge.network}`,
    `- Payee wallet: \`${edge.challenge.payTo}\``,
    `- Controlled demo-paid completion: HTTP ${edge.paidCompletion.status} · paymentSatisfied=${edge.paidCompletion.paymentSatisfied}`,
    `- Model: \`${edge.paidCompletion.model ?? "unknown"}\``,
    "",
    "> Output preview:",
    ">",
    preview(edge.paidCompletion.outputPreview)
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n"),
    "",
    disclosureMarkdown(edge),
    "",
  ].join("\n");
}

function scanForSecrets(files) {
  const patterns = [
    { id: "openai-or-openrouter-key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
    { id: "solana-keypair-array", regex: /\[[\s\n]*(?:\d{1,3}\s*,\s*){20,}\d{1,3}[\s\n]*\]/ },
    { id: "private-key-label", regex: /(private[_ -]?key|secret[_ -]?key|signer material)/i },
    { id: "onepassword-ref", regex: /op:\/\//i },
  ];
  const findings = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const pattern of patterns) {
      if (pattern.regex.test(text)) findings.push({ file: relative(rootDir, file), pattern: pattern.id });
    }
  }
  return findings;
}

const source = readJson(sourcePath);
assert(source.schemaVersion === "reddi.economic-demo.webpage.live-x402-workflow.v1", "unsupported source artifact schema");
assert(source.conclusion === "multi_edge_paid_workflow_reached", "source artifact did not reach multi-edge workflow");
assert(Array.isArray(source.edges) && source.edges.length === 4, "expected four webpage workflow edges");
assert(source.edges.every((edge) => edge.unpaidChallenge?.status === 402), "every edge must include unpaid 402 challenge proof");
assert(source.edges.every((edge) => edge.paidCompletion?.status === 200 && edge.paidCompletion?.paymentSatisfied === true), "every edge must include controlled paid 200 proof");
assert(source.guardrails?.controlledDemoReceiptsOnly === true, "source must be controlled-demo-receipt evidence");
assert(source.disclosureContract?.allEdgesHaveDisclosureLedger === true, "source must include downstream disclosure ledger evidence for every edge");
assert(source.guardrails?.disclosureLedgerRequired === true, "source guardrails must require downstream disclosure ledgers");

mkdirSync(outDir, { recursive: true });

const edgeSummaries = source.edges.map((edge) => ({
  step: edge.step,
  profileId: edge.profileId,
  capability: edge.capability,
  endpoint: edge.endpoint,
  challenge: edge.unpaidChallenge.challenge,
  paidCompletion: {
    status: edge.paidCompletion.status,
    paymentSatisfied: edge.paidCompletion.paymentSatisfied,
    model: edge.paidCompletion.model,
    outputPreview: preview(edge.paidCompletion.outputPreview),
  },
  downstreamDisclosureLedgerSummary: summarizeDisclosureLedger(edge),
}));

const disclosureLedgerSummary = {
  schemaVersion: "reddi.economic-demo.disclosure-ledger-summary.v1",
  requiredLedgerSchemaVersion: source.disclosureContract.requiredLedgerSchemaVersion,
  allEdgesHaveDisclosureLedger: source.disclosureContract.allEdgesHaveDisclosureLedger,
  edgeCount: edgeSummaries.length,
  totalLedgerEntries: edgeSummaries.reduce((sum, edge) => sum + edge.downstreamDisclosureLedgerSummary.entryCount, 0),
  scopes: [...new Set(edgeSummaries.map((edge) => edge.downstreamDisclosureLedgerSummary.disclosureScope))].sort(),
  edges: edgeSummaries.map((edge) => ({
    step: edge.step,
    profileId: edge.profileId,
    disclosureScope: edge.downstreamDisclosureLedgerSummary.disclosureScope,
    entryCount: edge.downstreamDisclosureLedgerSummary.entryCount,
    entries: edge.downstreamDisclosureLedgerSummary.entries,
  })),
};

const pack = {
  schemaVersion: "reddi.economic-demo.judge-evidence-pack.v1",
  generatedAt: new Date().toISOString(),
  sourceArtifactPath: relative(rootDir, sourcePath),
  scenarioId: source.scenarioId,
  userRequest: source.userRequest,
  conclusion: source.conclusion,
  edgeCount: source.edges.length,
  downstreamCallsExecuted: source.downstreamCallsExecuted,
  receiptMode: "controlled_demo_receipts",
  disclosureContract: source.disclosureContract,
  disclosureLedgerSummary,
  limitation: "Controlled demo receipts prove x402 challenge/receipt-gated specialist execution for the judge demo, not production USDC settlement verification.",
  edges: edgeSummaries,
  guardrails: source.guardrails,
  nextRecommendedPhase: "Phase 7C ledger reconciliation, then research workflow planning.",
};

const jsonPath = join(outDir, "evidence-pack.json");
const mdPath = join(outDir, "EVIDENCE.md");
const scanPath = join(outDir, "SECRET-SCAN.json");

writeFileSync(jsonPath, `${JSON.stringify(pack, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Reddi Agent Protocol — Multi-Edge Economic Workflow Evidence Pack",
    "",
    `Generated: ${pack.generatedAt}`,
    `Source artifact: \`${pack.sourceArtifactPath}\``,
    "",
    "## Verdict",
    "",
    `- Conclusion: **${pack.conclusion}**`,
    `- Scenario: **${pack.scenarioId}**`,
    `- Specialist edges: **${pack.edgeCount}**`,
    `- Bounded downstream calls: **${pack.downstreamCallsExecuted}** (4 unpaid challenges + 4 controlled demo-paid completions)`,
    "- Receipt mode: **controlled demo receipts**",
    `- Disclosure ledger contract: **${pack.disclosureContract.requiredLedgerSchemaVersion}** on all edges = **${pack.disclosureContract.allEdgesHaveDisclosureLedger}**`,
    `- Disclosure ledger entries summarized: **${pack.disclosureLedgerSummary.totalLedgerEntries}** across ${pack.disclosureLedgerSummary.edgeCount} edges`,
    "",
    "## User request",
    "",
    `> ${pack.userRequest}`,
    "",
    "## What this proves",
    "",
    "- A single end-user request was decomposed into specialist work.",
    "- Each specialist endpoint enforced x402 first by returning HTTP 402 and a challenge.",
    "- Each controlled demo receipt unlocked an HTTP 200 specialist completion.",
    "- The final verification edge received prior workflow outputs and returned an assessment/release recommendation.",
    "- Every edge returned a downstream-disclosure ledger, making downstream agent identity, payload/payment state, and attestor linkage transparent to the consumer agent.",
    "- The harness used exact hosted HTTPS endpoints and bounded call counts.",
    "",
    "## Important limitation",
    "",
    pack.limitation,
    "",
    "## Specialist edges",
    "",
    ...pack.edges.map(edgeMarkdown),
    "## Compact downstream disclosure ledger",
    "",
    ...pack.disclosureLedgerSummary.edges.flatMap((edge) => [
      `### ${edge.step}. ${edge.profileId}`,
      "",
      `- Scope: ${edge.disclosureScope}`,
      `- Entries: ${edge.entryCount}`,
      ...edge.entries.flatMap((entry) => [
        `  - Called: \`${entry.calledProfileId}\``,
        `    - Wallet: \`${entry.walletAddress ?? "not_disclosed"}\``,
        `    - Endpoint: \`${entry.endpoint ?? "not_disclosed"}\``,
        `    - Payload: ${entry.payloadSummary || (entry.payloadHashPresent ? "hash present" : "not disclosed")}`,
        `    - x402: ${entry.x402.state}${entry.x402.amount ? ` · ${entry.x402.amount} ${entry.x402.currency ?? ""}` : ""} · challenge=${entry.x402.challengePresent} · receipt=${entry.x402.receiptPresent}`,
      ]),
      "",
    ]),
    "## Guardrails",
    "",
    ...Object.entries(source.guardrails).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Next phase",
    "",
    pack.nextRecommendedPhase,
    "",
  ].join("\n"),
);

const findings = scanForSecrets([jsonPath, mdPath]);
writeFileSync(scanPath, `${JSON.stringify({ ok: findings.length === 0, findings }, null, 2)}\n`);
assert(findings.length === 0, `secret scan failed: ${JSON.stringify(findings)}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      outDir,
      jsonPath,
      mdPath,
      scanPath,
      conclusion: pack.conclusion,
      edgeCount: pack.edgeCount,
      downstreamCallsExecuted: pack.downstreamCallsExecuted,
    },
    null,
    2,
  ),
);
