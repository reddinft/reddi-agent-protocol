#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has("--dry-run"),
  };
}

function normalizeBaseUrl(v) {
  if (!v) return "";
  return v.trim().replace(/\/+$/, "");
}

function classifyResult(sample) {
  if (sample.error) return "error";
  if (sample.status >= 200 && sample.status < 300) return "2xx";
  if (sample.status === 402) return "x402_challenge";
  if (sample.status >= 300 && sample.status < 400) return "3xx";
  if (sample.status >= 400 && sample.status < 500) return "4xx";
  if (sample.status >= 500) return "5xx";
  return "unknown";
}

async function runProbe(baseUrl, probe) {
  const url = `${baseUrl}${probe.path}`;
  const started = Date.now();

  try {
    const res = await fetch(url, {
      method: probe.method,
      headers: probe.headers,
      body: probe.body,
    });
    const ms = Date.now() - started;
    const body = probe.captureBody ? await res.text() : "";

    return {
      ok: res.ok,
      status: res.status,
      ms,
      classification: classifyResult({ status: res.status }),
      location: res.headers.get("location") || undefined,
      x402Header: res.headers.get("x402-request") || undefined,
      bodySnippet: body ? body.slice(0, 200) : undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      ms: Date.now() - started,
      classification: "error",
    };
  }
}

function summarizeSamples(samples) {
  const counts = {};
  let totalMs = 0;
  let maxMs = 0;

  for (const s of samples) {
    counts[s.classification] = (counts[s.classification] || 0) + 1;
    totalMs += s.ms || 0;
    maxMs = Math.max(maxMs, s.ms || 0);
  }

  const avgMs = samples.length ? Math.round(totalMs / samples.length) : 0;
  return { counts, avgMs, maxMs };
}

async function main() {
  const { dryRun } = parseArgs();

  const sampleSize = Math.max(1, Number(process.env.RCA_SAMPLE_SIZE || 30));
  const ngrokBase = normalizeBaseUrl(process.env.NGROK_BASE_URL);
  const cloudflareBase = normalizeBaseUrl(process.env.CLOUDFLARE_BASE_URL);
  const x402ProbePath = process.env.X402_PROBE_PATH || "/x402/health";

  if (!ngrokBase || !cloudflareBase) {
    console.error("Missing required env vars: NGROK_BASE_URL and CLOUDFLARE_BASE_URL");
    process.exit(1);
  }

  const probes = [
    { id: "head_root", method: "HEAD", path: "/" },
    { id: "get_healthz", method: "GET", path: "/healthz" },
    {
      id: "post_chat_completions",
      method: "POST",
      path: "/v1/chat/completions",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: process.env.RCA_MODEL || "llama3.2",
        messages: [{ role: "user", content: "heartbeat" }],
        max_tokens: 8,
      }),
      captureBody: true,
    },
    { id: "x402_probe", method: "GET", path: x402ProbePath, captureBody: true },
  ];

  const artifactDir = path.join(process.cwd(), "artifacts", "cloudflare-rca", nowStamp());

  if (dryRun) {
    console.log(JSON.stringify({ sampleSize, ngrokBase, cloudflareBase, probes, artifactDir }, null, 2));
    return;
  }

  await fs.mkdir(artifactDir, { recursive: true });

  const providers = [
    { id: "ngrok", baseUrl: ngrokBase },
    { id: "cloudflare", baseUrl: cloudflareBase },
  ];

  const results = {
    generatedAt: new Date().toISOString(),
    sampleSize,
    providers: {},
  };

  for (const provider of providers) {
    const providerOut = { baseUrl: provider.baseUrl, probes: {} };

    for (const probe of probes) {
      const samples = [];
      for (let i = 0; i < sampleSize; i += 1) {
        const sample = await runProbe(provider.baseUrl, probe);
        sample.run = i + 1;
        samples.push(sample);
      }
      providerOut.probes[probe.id] = {
        method: probe.method,
        path: probe.path,
        summary: summarizeSamples(samples),
        samples,
      };
    }

    results.providers[provider.id] = providerOut;
  }

  const jsonPath = path.join(artifactDir, "results.json");
  await fs.writeFile(jsonPath, JSON.stringify(results, null, 2));

  const lines = [];
  lines.push("# Cloudflare Tunnel RCA Matrix Summary");
  lines.push("");
  lines.push(`- Generated: ${results.generatedAt}`);
  lines.push(`- Samples per probe: ${sampleSize}`);
  lines.push(`- ngrok base: ${ngrokBase}`);
  lines.push(`- cloudflare base: ${cloudflareBase}`);
  lines.push("");

  for (const provider of providers) {
    lines.push(`## ${provider.id}`);
    const probeMap = results.providers[provider.id].probes;
    for (const probe of probes) {
      const p = probeMap[probe.id];
      lines.push(`- ${probe.id} (${p.method} ${p.path}): avg=${p.summary.avgMs}ms max=${p.summary.maxMs}ms classes=${JSON.stringify(p.summary.counts)}`);
    }
    lines.push("");
  }

  lines.push(`Results JSON: ${jsonPath}`);

  const summaryPath = path.join(artifactDir, "SUMMARY.md");
  await fs.writeFile(summaryPath, `${lines.join("\n")}\n`);

  console.log(`[cloudflare-rca] artifact: ${artifactDir}`);
  console.log(`[cloudflare-rca] summary: ${summaryPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
