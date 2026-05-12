#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SERVER_CARD_URL = process.env.PAY_SH_MCP_SERVER_CARD_URL ?? "https://pay.sh/.well-known/mcp/server-card.json";
const OUT_PATH = process.env.PAY_SH_MCP_INSPECTION_OUT ?? join("artifacts", "pay-sh-mcp", "20260513-initial", "inspection.json");

const READ_ONLY_TOOLS = new Set(["search_skills", "list_skills", "get_skill_endpoints"]);
const PROVIDER_AUTHORING_TOOLS = new Set(["create_skill"]);

function classifyTool(name) {
  if (READ_ONLY_TOOLS.has(name)) return "read_only";
  if (name === "get_balance") return "balance_read";
  if (name === "curl") return "paid_invocation";
  if (PROVIDER_AUTHORING_TOOLS.has(name)) return "provider_authoring";
  return "unknown";
}

function inspect(card) {
  const tools = (card.tools ?? []).map((tool) => {
    const riskClass = classifyTool(tool.name);
    return { ...tool, riskClass, allowedInDryRun: riskClass === "read_only" };
  });
  return {
    inspected_at: new Date().toISOString(),
    source_url: SERVER_CARD_URL,
    mode: "metadata-only-mcp-inspection",
    server: {
      name: card.serverInfo?.name ?? "unknown",
      title: card.serverInfo?.title ?? "pay MCP server",
      version: card.serverInfo?.version ?? "unknown",
      protocolVersion: card.protocolVersion ?? "unknown",
      documentation: card.documentation,
    },
    transport: {
      type: card.transport?.type ?? "unknown",
      command: card.transport?.command ?? "",
      args: card.transport?.args ?? [],
      localOnly: card.transport?.type === "stdio" && card.transport?.command === "pay",
    },
    tools,
    blockedLiveTools: tools.filter((tool) => !tool.allowedInDryRun).map((tool) => tool.name),
    boundary: "Public metadata only. Does not run pay mcp, create wallets, top up funds, make paid calls, or store secrets.",
  };
}

async function main() {
  const res = await fetch(SERVER_CARD_URL, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Pay.sh MCP server-card fetch failed: ${res.status} ${res.statusText}`);
  const card = await res.json();
  const payload = inspect(card);
  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 2));
  console.log(`wrote Pay.sh MCP inspection to ${OUT_PATH}`);
  console.log(`tools=${payload.tools.length} blocked=${payload.blockedLiveTools.join(",") || "none"}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
