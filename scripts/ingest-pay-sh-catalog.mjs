#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const CATALOG_URL = process.env.PAY_SH_CATALOG_URL ?? "https://pay.sh/api/catalog";
const OUT_PATH = process.env.PAY_SH_CATALOG_OUT ?? join("artifacts", "pay-sh-catalog", "20260513-initial", "catalog.json");

function summarize(providers, raw) {
  const categories = {};
  let min = null;
  let max = null;
  for (const provider of providers) {
    const category = provider.category ?? "unknown";
    categories[category] = (categories[category] ?? 0) + 1;
    for (const value of [provider.min_price_usd, provider.max_price_usd]) {
      if (typeof value !== "number") continue;
      min = min === null ? value : Math.min(min, value);
      max = max === null ? value : Math.max(max, value);
    }
  }
  return {
    generated_at: raw.generated_at,
    provider_count: raw.provider_count ?? providers.length,
    base_url: raw.base_url,
    categories,
    pricesUsd: { min, max },
    boundary: "Metadata-only Pay.sh catalog ingest; does not create wallets, top up funds, pay, or invoke APIs.",
  };
}

async function main() {
  const res = await fetch(CATALOG_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Pay.sh catalog fetch failed: ${res.status} ${res.statusText}`);
  const raw = await res.json();
  const providers = Array.isArray(raw.providers) ? raw.providers : [];
  const payload = {
    summary: summarize(providers, raw),
    providers,
  };
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`wrote ${providers.length} Pay.sh providers to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
