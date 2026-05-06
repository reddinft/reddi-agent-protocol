#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "economic-demo-jupiter-quote-proof", timestamp);
mkdirSync(outDir, { recursive: true });

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const quoteApiBase = process.env.JUPITER_QUOTE_API_BASE?.trim() || "https://lite-api.jup.ag/swap/v1";
const inputLamports = Number(process.env.ECONOMIC_DEMO_JUPITER_INPUT_LAMPORTS ?? "42000000");
const slippageBps = Number(process.env.ECONOMIC_DEMO_JUPITER_SLIPPAGE_BPS ?? "75");

if (!Number.isInteger(inputLamports) || inputLamports <= 0) throw new Error("invalid_input_lamports");
if (!Number.isInteger(slippageBps) || slippageBps < 0 || slippageBps > 1000) throw new Error("invalid_slippage_bps");

const url = new URL(`${quoteApiBase.replace(/\/$/, "")}/quote`);
url.searchParams.set("inputMint", SOL_MINT);
url.searchParams.set("outputMint", USDC_MINT);
url.searchParams.set("amount", String(inputLamports));
url.searchParams.set("slippageBps", String(slippageBps));
url.searchParams.set("restrictIntermediateTokens", "true");

const startedAt = new Date().toISOString();
const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
const body = await response.json().catch(() => ({}));
const completedAt = new Date().toISOString();

const outAmountRaw = typeof body.outAmount === "string" ? Number(body.outAmount) : null;
const otherAmountThresholdRaw = typeof body.otherAmountThreshold === "string" ? Number(body.otherAmountThreshold) : null;
const routePlan = Array.isArray(body.routePlan) ? body.routePlan : [];

const artifact = {
  schemaVersion: "reddi.economic-demo.jupiter-quote-proof.v1",
  generatedAt: completedAt,
  request: {
    quoteApiBase,
    inputMint: SOL_MINT,
    outputMint: USDC_MINT,
    inputLamports,
    inputSol: inputLamports / 1_000_000_000,
    slippageBps,
    restrictIntermediateTokens: true,
  },
  response: {
    httpStatus: response.status,
    ok: response.ok,
    startedAt,
    completedAt,
    outAmountRaw,
    outUsdc: outAmountRaw === null ? null : outAmountRaw / 1_000_000,
    otherAmountThresholdRaw,
    otherAmountThresholdUsdc: otherAmountThresholdRaw === null ? null : otherAmountThresholdRaw / 1_000_000,
    priceImpactPct: body.priceImpactPct ?? null,
    routePlanLength: routePlan.length,
    swapMode: body.swapMode ?? null,
  },
  routePlan: routePlan.map((leg) => ({
    percent: leg.percent ?? null,
    bps: leg.bps ?? null,
    label: leg.swapInfo?.label ?? null,
    ammKey: leg.swapInfo?.ammKey ?? null,
    inputMint: leg.swapInfo?.inputMint ?? null,
    outputMint: leg.swapInfo?.outputMint ?? null,
    feeMint: leg.swapInfo?.feeMint ?? null,
  })),
  guardrails: [
    "Quote-only proof: no wallet connected, no swap transaction requested, no signing, no transfer.",
    "Uses public Jupiter quote API only; no API key or private key material is included.",
    "Live swap receipt is not claimed by this artifact.",
  ],
  blockers: response.ok ? [] : [body.error ?? body.message ?? `jupiter_quote_http_${response.status}`],
};

const artifactPath = join(outDir, "quote-proof.json");
const summaryPath = join(outDir, "SUMMARY.md");
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`);
writeFileSync(
  summaryPath,
  [
    "# Economic Demo Jupiter Quote Proof",
    "",
    `- Status: ${response.ok ? "ok" : "blocked"}`,
    `- Input: ${artifact.request.inputSol} SOL`,
    `- Output estimate: ${artifact.response.outUsdc ?? "unavailable"} USDC`,
    `- Slippage: ${slippageBps} bps`,
    `- Route legs: ${artifact.response.routePlanLength}`,
    "- Guardrail: quote only; no swap/sign/transfer.",
    `- JSON: ${artifactPath}`,
    "",
  ].join("\n"),
);

if (!response.ok) {
  console.error(JSON.stringify({ ok: false, artifactPath, summaryPath, blockers: artifact.blockers }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, artifactPath, summaryPath, outUsdc: artifact.response.outUsdc, routePlanLength: artifact.response.routePlanLength }, null, 2));
