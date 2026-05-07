#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "artifacts/final-recording-packet-20260507.md",
      "docs/ECONOMIC-DEMO-JUDGE-PACKET-2026-05-05.md",
      "docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md",
      "docs/HACKATHON-BOUNTY-SHOWCASE-AUDIT-2026-05-07.md",
      "artifacts/economic-demo-submission-prep/latest/SUBMISSION-PREP.md",
    ];

const failures = [];

const requiredByFile = {
  "artifacts/final-recording-packet-20260507.md": [
    "Pay.sh / `reddi-x402` proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility",
    "Pay.sh capped-session or split-payment settlement completed",
    "Pay.sh evidence proving Umbra private settlement or MagicBlock PER settlement",
  ],
  "docs/ECONOMIC-DEMO-JUDGE-PACKET-2026-05-05.md": [
    "Pay.sh / `reddi-x402` sandbox compatibility is proven for the single-recipient charge flow",
    "No Pay.sh capped-session or split-payment settlement claim",
    "Pay.sh capped sessions/splits remain probe-only",
  ],
  "docs/ECONOMIC-DEMO-PROOF-HIERARCHY-2026-05-07.md": [
    "Pay.sh / `reddi-x402` sandbox charge compatibility",
    "Pay.sh capped-session and split-payment probes",
    "Does not prove: mainnet payment, Umbra private settlement, MagicBlock PER settlement",
  ],
  "docs/HACKATHON-BOUNTY-SHOWCASE-AUDIT-2026-05-07.md": [
    "x402 + Pay.sh / `reddi-x402`",
    "sessions/splits are probe-only",
    "not a successful PER settlement proof",
  ],
  "artifacts/economic-demo-submission-prep/latest/SUBMISSION-PREP.md": [
    "Pay.sh / reddi-x402 proves sandbox HTTP 402 → payment → HTTP 200 receipt compatibility",
    "Pay.sh capped sessions and split payments are probe-only extension evidence",
    "Pay.sh evidence proves Umbra private settlement or MagicBlock PER settlement",
  ],
};

const forbiddenSafeClaimPatterns = [
  /successful public Jupiter devnet swap(?![\s\S]{0,120}(?:not|No|without))/i,
  /live\/mainnet Jupiter swap(?![\s\S]{0,120}(?:not|No|without))/i,
  /judge wallet (?:was )?charged/i,
  /mainnet settlement (?:is )?supported/i,
  /Pay\.sh[^\n]*(?:capped-session|capped session|split-payment|split payment)[^\n]*(?:settlement completed|completed settlement|settled)/i,
  /Pay\.sh[^\n]*(?:Umbra private settlement|MagicBlock PER settlement)[^\n]*(?:proves|proved|settled|completed)/i,
];

for (const file of files) {
  if (!existsSync(file)) {
    failures.push(`${file}: missing file`);
    continue;
  }
  const text = readFileSync(file, "utf8");
  for (const phrase of requiredByFile[file] ?? []) {
    if (!text.includes(phrase)) failures.push(`${file}: missing required boundary phrase: ${phrase}`);
  }
  const safeSection = text.split(/(?:Do not claim|Not safe to say yet|What is explicitly not claimed|Hard no-go list unless Nissan explicitly approves)/i)[0] ?? text;
  for (const pattern of forbiddenSafeClaimPatterns) {
    if (pattern.test(safeSection)) failures.push(`${file}: forbidden overclaim in safe/proven section: ${pattern}`);
  }
  for (const [index, line] of safeSection.split(/\r?\n/).entries()) {
    if (/MagicBlock/i.test(line) && /(?:successful PER settlement|settled PER|PER settlement proof)/i.test(line) && !/(?:not|No|without|blocked|weak)/i.test(line)) {
      failures.push(`${file}:${index + 1}: forbidden MagicBlock PER settlement overclaim: ${line.trim()}`);
    }
  }
}

if (failures.length) {
  console.error("[submission-claim-boundaries] FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[submission-claim-boundaries] OK: checked ${files.length} file(s)`);
