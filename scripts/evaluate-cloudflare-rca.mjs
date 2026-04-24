#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--results" && args[i + 1]) out.results = args[i + 1];
    if (args[i] === "--out" && args[i + 1]) out.out = args[i + 1];
  }
  return out;
}

function modeClass(samples = []) {
  const counts = new Map();
  for (const s of samples) {
    const key = s.classification || "unknown";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let best = "unknown";
  let bestCount = -1;
  for (const [k, v] of counts.entries()) {
    if (v > bestCount) {
      best = k;
      bestCount = v;
    }
  }
  return { className: best, count: Math.max(0, bestCount) };
}

function stable(samples = []) {
  if (!samples.length) return false;
  return samples.every((s) => s.classification !== "error");
}

function x402Signal(ngrokSamples = [], cloudflareSamples = []) {
  const ngrok402 = ngrokSamples.filter((s) => s.status === 402).length;
  const cloudflare402 = cloudflareSamples.filter((s) => s.status === 402).length;
  const ngrokRuns = ngrokSamples.length || 0;

  if (ngrokRuns === 0) {
    return { ok: false, ngrok402, cloudflare402, reason: "no_ngrok_samples" };
  }

  if (ngrok402 === 0) {
    return { ok: false, ngrok402, cloudflare402, reason: "no_x402_baseline" };
  }

  return {
    ok: cloudflare402 === ngrok402,
    ngrok402,
    cloudflare402,
    reason: cloudflare402 === ngrok402 ? "matched" : "count_mismatch",
  };
}

async function main() {
  const { results: resultsArg, out } = parseArgs();
  if (!resultsArg) {
    console.error("Usage: node scripts/evaluate-cloudflare-rca.mjs --results <results.json> [--out <summary.md>]");
    process.exit(1);
  }

  const raw = await fs.readFile(resultsArg, "utf8");
  const data = JSON.parse(raw);

  const probes = ["head_root", "get_healthz", "post_chat_completions", "x402_probe"];
  const failures = [];
  const rows = [];

  for (const probe of probes) {
    const ngrok = data.providers?.ngrok?.probes?.[probe]?.samples || [];
    const cloudflare = data.providers?.cloudflare?.probes?.[probe]?.samples || [];

    const ngrokMode = modeClass(ngrok);
    const cloudflareMode = modeClass(cloudflare);
    const ngrokStable = stable(ngrok);
    const cloudflareStable = stable(cloudflare);

    const parityOk = ngrokMode.className === cloudflareMode.className;

    if (!ngrokStable) failures.push(`${probe}: ngrok samples contain errors`);
    if (!cloudflareStable) failures.push(`${probe}: cloudflare samples contain errors`);
    if (!parityOk) failures.push(`${probe}: classification mode mismatch (ngrok=${ngrokMode.className}, cloudflare=${cloudflareMode.className})`);

    rows.push({
      probe,
      ngrokMode: `${ngrokMode.className} (${ngrokMode.count}/${ngrok.length})`,
      cloudflareMode: `${cloudflareMode.className} (${cloudflareMode.count}/${cloudflare.length})`,
      ngrokStable,
      cloudflareStable,
      parityOk,
    });
  }

  const x402 = x402Signal(
    data.providers?.ngrok?.probes?.x402_probe?.samples || [],
    data.providers?.cloudflare?.probes?.x402_probe?.samples || []
  );

  if (!x402.ok) {
    if (x402.reason === "no_x402_baseline") {
      failures.push("x402 probe: ngrok baseline produced zero 402 challenges (fixture is not x402-assertive, rerun against token-gated x402 fixture)");
    } else if (x402.reason === "no_ngrok_samples") {
      failures.push("x402 probe: ngrok sample set is empty");
    } else {
      failures.push("x402 probe: cloudflare did not preserve 402-challenge count relative to ngrok baseline");
    }
  }

  const pass = failures.length === 0;

  const lines = [];
  lines.push("# Cloudflare RCA Evaluation");
  lines.push("");
  lines.push(`- Results: ${path.resolve(resultsArg)}`);
  lines.push(`- Verdict: ${pass ? "PASS" : "FAIL"}`);
  lines.push("");
  lines.push("## Probe checks");
  lines.push("");
  lines.push("| Probe | ngrok mode | cloudflare mode | ngrok stable | cloudflare stable | mode parity |");
  lines.push("|---|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    lines.push(`| ${row.probe} | ${row.ngrokMode} | ${row.cloudflareMode} | ${row.ngrokStable ? "yes" : "no"} | ${row.cloudflareStable ? "yes" : "no"} | ${row.parityOk ? "yes" : "no"} |`);
  }
  lines.push("");
  lines.push(`- x402 challenge preservation: ${x402.ok ? "yes" : "no"}`);
  lines.push(`- x402 counts (ngrok/cloudflare): ${x402.ngrok402}/${x402.cloudflare402}`);
  lines.push(`- x402 signal reason: ${x402.reason}`);
  lines.push("");

  if (!pass) {
    lines.push("## Fail reasons");
    lines.push("");
    for (const f of failures) lines.push(`- ${f}`);
  }

  const content = `${lines.join("\n")}\n`;

  if (out) {
    await fs.writeFile(out, content, "utf8");
    console.log(`Wrote: ${out}`);
  } else {
    process.stdout.write(content);
  }

  if (!pass) process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
