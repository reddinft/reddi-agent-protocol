#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.APP_ADAPTER_BASE_URL || process.argv[2] || "http://127.0.0.1:3000").replace(/\/$/, "");
const outRoot = process.env.ARTIFACT_DIR || path.join("artifacts", "app-adapter-smoke", new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"));
fs.mkdirSync(outRoot, { recursive: true });

function writeJson(name, payload) {
  fs.writeFileSync(path.join(outRoot, name), JSON.stringify(payload, null, 2));
}

async function fetchJson(route, options = {}) {
  const res = await fetch(`${baseUrl}${route}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  const body = await res.json().catch(() => null);
  return { route, status: res.status, ok: res.ok, body };
}

function requireCheck(summary, name, result, predicate) {
  const ok = Boolean(predicate(result));
  summary.checks.push({ name, route: result.route, status: result.status, ok });
  if (!ok) summary.ok = false;
}

async function main() {
  const summary = { baseUrl, ok: true, checks: [] };

  const manifest = await fetchJson("/.well-known/app-agent.json");
  writeJson("01-manifest.json", manifest);
  requireCheck(summary, "manifest exposes ReddiAgents APP adapter", manifest, (r) =>
    r.status === 200 && r.body?.name === "ReddiAgents" && r.body?.agents?.[0]?.id === "reddi.qa-testing-specialist"
  );

  const agents = await fetchJson("/app/agents");
  writeJson("02-agents.json", agents);
  requireCheck(summary, "agent list includes enabled QA specialist", agents, (r) =>
    r.status === 200 && r.body?.ok === true && r.body?.agents?.some((agent) => agent.id === "reddi.qa-testing-specialist" && agent.status === "available")
  );

  const schema = await fetchJson("/app/agents/reddi.qa-testing-specialist/schema");
  writeJson("03-schema.json", schema);
  requireCheck(summary, "schema requires normalized task input", schema, (r) =>
    r.status === 200 && r.body?.schema?.required?.includes("task")
  );

  const createRun = await fetchJson("/app/runs", {
    method: "POST",
    body: JSON.stringify({
      agent_id: "reddi.qa-testing-specialist",
      input: {
        task: "Smoke-test the ReddiAgents APP Adapter route surface.",
        constraints: ["Return a safe receipt envelope"],
        evidence_preference: "full_receipt",
      },
      context: { trace_id: "app-adapter-smoke" },
    }),
  });
  writeJson("04-create-run.json", createRun);
  requireCheck(summary, "mock run creation succeeds", createRun, (r) =>
    r.status === 200 && r.body?.status === "succeeded" && typeof r.body?.run_id === "string"
  );

  if (createRun.body?.run_id) {
    const run = await fetchJson(`/app/runs/${createRun.body.run_id}`);
    writeJson("05-run-status.json", run);
    requireCheck(summary, "run status returns safe receipt", run, (r) =>
      r.status === 200 &&
      r.body?.status === "succeeded" &&
      r.body?.receipt?.adapter === "reddiagents-app-adapter" &&
      r.body?.receipt?.safe_public_evidence_only === true
    );
  }

  fs.writeFileSync(path.join(outRoot, "SUMMARY.md"), [
    "# ReddiAgents APP Adapter Smoke",
    "",
    `Base URL: ${baseUrl}`,
    `Result: ${summary.ok ? "PASS" : "FAIL"}`,
    "",
    ...summary.checks.map((check) => `- ${check.ok ? "✅" : "❌"} ${check.name}: ${check.route} HTTP ${check.status}`),
    "",
    "Note: v0.1 run storage is in-memory, so `/app/runs/:runId` is intended for local/single-process smoke until a durable store is added.",
    "",
  ].join("\n"));
  writeJson("summary.json", summary);
  console.log(`${summary.ok ? "PASS" : "FAIL"} ${outRoot}`);
  if (!summary.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
