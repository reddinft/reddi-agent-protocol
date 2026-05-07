#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = process.argv[2] ? join(rootDir, process.argv[2]) : join(rootDir, "artifacts", "umbra-private-x402", timestamp);

const modulePath = join(rootDir, "lib", "privacy", "umbra", "private-payment.ts");
const mod = await import(pathToFileURL(modulePath).href);
const receipt = await mod.runUmbraPrivatePaymentAdapterContract();

const summary = {
  ok: true,
  generatedAt: new Date().toISOString(),
  artifactType: "reddi.umbra-private-x402.adapter-contract.v1",
  package: "reddi-x402",
  receipt,
  claimBoundary: receipt.claimBoundary,
  liveSettlementClaimed: false,
  devnetTransactionsSubmitted: false,
  nextGate: "approval-gated Umbra devnet SDK smoke: register, create receiver-claimable UTXO, scan, claim via relayer",
};

mkdirSync(outDir, { recursive: true });
const jsonPath = join(outDir, "SUMMARY.json");
const mdPath = join(outDir, "SUMMARY.md");
writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(
  mdPath,
  [
    "# Umbra Private x402 Evidence",
    "",
    `Generated: ${summary.generatedAt}`,
    "",
    "## Verdict",
    "",
    "Reddi Agent Protocol now has an executable Umbra private x402 adapter contract for the hackathon submission. This artifact proves the dependency-injected SDK call path and receipt shape for a receiver-claimable Umbra UTXO lane.",
    "",
    "## Flow",
    "",
    `- Package surface: ${summary.package}`,
    `- Rail: ${receipt.rail}`,
    `- Network target: ${receipt.network}`,
    `- Operation: ${receipt.operation}`,
    `- Umbra program: ${receipt.protocolProgramId}`,
    `- Indexer: ${receipt.indexerApiEndpoint}`,
    `- Relayer: ${receipt.relayerApiEndpoint}`,
    `- Registration signatures: ${receipt.registrationSignatures.join(", ")}`,
    `- Create UTXO signatures: ${receipt.createUtxoSignatures.join(", ")}`,
    `- Claim signatures: ${receipt.claimSignatures.join(", ")}`,
    "",
    "## Selective disclosure",
    "",
    `- Reveals: ${receipt.selectiveDisclosure.reveals.join(", ")}`,
    `- Hides: ${receipt.selectiveDisclosure.hides.join(", ")}`,
    "",
    "## Claim boundary",
    "",
    summary.claimBoundary,
    "",
    "This is not a live Umbra settlement claim. It does not claim devnet transaction submission, live private settlement, or Quasar-native Umbra execution.",
    "",
    "## Next gate",
    "",
    summary.nextGate,
    "",
  ].join("\n"),
);

console.log(JSON.stringify({ ok: true, outDir: relative(rootDir, outDir), jsonPath: relative(rootDir, jsonPath), mdPath: relative(rootDir, mdPath) }, null, 2));
