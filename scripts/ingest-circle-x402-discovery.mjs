#!/usr/bin/env node
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API = "https://api.circle.com/v1/x402/discovery/resources";
const limit = Number(process.env.CIRCLE_X402_DISCOVERY_LIMIT ?? 200);
const outDir = process.argv.includes("--out-dir")
  ? process.argv[process.argv.indexOf("--out-dir") + 1]
  : path.join("artifacts", "circle-x402-discovery", new Date().toISOString().replace(/[:.]/g, "-"));

async function fetchJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json", "user-agent": "reddi-agent-protocol-ingest/1.0" } });
  if (!response.ok) {
    throw new Error(`Circle Discovery fetch failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function minPriceUsdc(item) {
  const prices = (item.accepts ?? [])
    .map((accept) => accept.maxAmountRequired)
    .filter((value) => typeof value === "string" && /^\d+$/.test(value))
    .map((value) => Number(value) / 1_000_000);
  if (!prices.length) return undefined;
  return Math.min(...prices);
}

function increment(counter, key) {
  counter[key || "unknown"] = (counter[key || "unknown"] ?? 0) + 1;
}

const items = [];
let total = Infinity;
let offset = 0;

while (offset < total) {
  const url = `${API}?limit=${limit}&offset=${offset}`;
  const page = await fetchJson(url);
  items.push(...(page.items ?? []));
  total = page.pagination?.total ?? items.length;
  offset += limit;
}

const categories = {};
const providers = {};
const networks = {};
const prices = [];

for (const item of items) {
  increment(categories, item.metadata?.provider?.category);
  increment(providers, item.metadata?.provider?.name);
  for (const accept of item.accepts ?? []) increment(networks, accept.network);
  const price = minPriceUsdc(item);
  if (price !== undefined) prices.push(price);
}

prices.sort((a, b) => a - b);
const percentile = (p) => (prices.length ? prices[Math.min(prices.length - 1, Math.floor((prices.length - 1) * p))] : null);
const mean = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : null;

const summary = {
  crawledAt: new Date().toISOString(),
  source: API,
  totalResources: items.length,
  categories,
  providers,
  networks,
  pricesUsdc: {
    count: prices.length,
    min: prices[0] ?? null,
    median: percentile(0.5),
    p90: percentile(0.9),
    max: prices[prices.length - 1] ?? null,
    mean,
  },
  boundary: "Metadata-only ingest. Live pay/invoke requires explicit approval and spend caps.",
};

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "resources.json"), JSON.stringify({ summary, items }, null, 2));
await writeFile(path.join(outDir, "SUMMARY.md"), `# Circle x402 Discovery Ingest\n\n- Source: ${API}\n- Crawled at: ${summary.crawledAt}\n- Total resources: ${summary.totalResources}\n- Priced resources: ${summary.pricesUsdc.count}\n- Median price USDC: ${summary.pricesUsdc.median}\n- Boundary: ${summary.boundary}\n\n## Categories\n\n${Object.entries(categories).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n`);

console.log(JSON.stringify({ ok: true, outDir, totalResources: items.length, pricesUsdc: summary.pricesUsdc }, null, 2));
