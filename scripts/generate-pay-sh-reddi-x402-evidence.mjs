#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const artifactDir = process.argv[2];
if (!artifactDir) {
  console.error("Usage: node scripts/generate-pay-sh-reddi-x402-evidence.mjs <artifact-dir>");
  process.exit(1);
}

function read(rel) {
  return readFileSync(join(artifactDir, rel), "utf8");
}

function decodeReceipt(raw) {
  if (!raw) return null;
  const padded = raw + "=".repeat((4 - (raw.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

const providerSpec = "config/pay-sh/reddi-x402-economic-demo-provider.yml";
const providerSpecBytes = readFileSync(providerSpec);
const plain = read("plain-curl.txt");
const pay = read("pay-sandbox-curl-retry.txt");
const url = read("url.txt").trim();
const receiptRaw = pay.match(/payment-receipt:\s*([^\r\n]+)/i)?.[1]?.trim() ?? null;
const receipt = decodeReceipt(receiptRaw);
const challengeCount = [...plain.matchAll(/^www-authenticate:\s*Payment\b/gim)].length;
const priceMatch = plain.match(/"price_usd"\s*:\s*([0-9.]+)/);

const summary = {
  schema: "reddi-x402.pay-sh.compatibility-evidence.v1",
  product: "Reddi Agent Protocol",
  package: "reddi-x402",
  mode: "pay-sh-sandbox",
  artifactDir,
  providerSpec,
  providerSpecSha256: createHash("sha256").update(providerSpecBytes).digest("hex"),
  url,
  plainCurl: {
    status: plain.includes("HTTP/1.1 402 Payment Required") ? "402 Payment Required" : "unknown",
    paymentProtocol: plain.includes('"protocol":"mpp"') || plain.includes('realm="MPP Payment"') ? "mpp" : null,
    challengeCount,
    priceUsd: priceMatch ? Number(priceMatch[1]) : null,
  },
  paySandboxCurl: {
    status: pay.includes("HTTP/1.1 200 OK") ? "200 OK" : "unknown",
    hasPaymentReceipt: Boolean(receiptRaw),
    receipt,
    bodyOk: pay.includes('"status":"ok"'),
  },
  claimBoundary:
    "Sandbox Pay.sh gateway compatibility evidence only; no mainnet funds, no Umbra private settlement, and no MagicBlock PER settlement claimed.",
};

writeFileSync(join(artifactDir, "SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(
  join(artifactDir, "SUMMARY.md"),
  `# Pay.sh / reddi-x402 sandbox compatibility evidence\n\n` +
    `- Product: Reddi Agent Protocol\n` +
    `- Package: \`reddi-x402\`\n` +
    `- Mode: Pay.sh sandbox\n` +
    `- Provider spec: \`${summary.providerSpec}\`\n` +
    `- Provider spec SHA-256: \`${summary.providerSpecSha256}\`\n` +
    `- URL: \`${summary.url}\`\n\n` +
    `## Result\n\n` +
    `- Plain curl returned: ${summary.plainCurl.status}\n` +
    `- Challenge protocol: ${summary.plainCurl.paymentProtocol}\n` +
    `- Challenge count: ${summary.plainCurl.challengeCount}\n` +
    `- Price: $${summary.plainCurl.priceUsd} USD/request\n` +
    `- \`pay --sandbox curl\` returned: ${summary.paySandboxCurl.status}\n` +
    `- Payment receipt present: ${summary.paySandboxCurl.hasPaymentReceipt}\n` +
    `- Receipt status: ${receipt?.status ?? "none"}\n` +
    `- Receipt method: ${receipt?.method ?? "none"}\n` +
    `- Receipt reference: \`${receipt?.reference ?? "none"}\`\n\n` +
    `## Claim boundary\n\n${summary.claimBoundary}\n`,
);

if (summary.plainCurl.status !== "402 Payment Required") {
  console.error("[pay-sh-evidence] expected plain curl to return HTTP 402");
  process.exit(1);
}
if (summary.paySandboxCurl.status !== "200 OK" || !summary.paySandboxCurl.hasPaymentReceipt) {
  console.error("[pay-sh-evidence] expected pay sandbox curl to return HTTP 200 with payment receipt");
  process.exit(1);
}

console.log(`[pay-sh-evidence] OK: ${artifactDir}`);
