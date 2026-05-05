#!/usr/bin/env node
import { marketplaceMetadata } from "../dist/src/runtime.js";
import { specialistProfiles } from "../dist/src/profiles/index.js";

const config = {
  profileId: "planning-agent",
  endpointBaseUrl: "http://localhost:8787",
  openRouterBaseUrl: "https://openrouter.ai/api/v1",
  mockOpenRouter: true,
  requirePayment: true,
  enableAgentToAgentCalls: false,
  maxDownstreamCalls: 0,
  maxDownstreamLamports: 0,
};

const requiredArrayFields = [
  "tools",
  "skills",
  "marketplaceAgentCalls",
  "externalMcpServers",
  "nonMarketplaceAgentCalls",
];

const failures = [];
const summaries = [];

for (const profile of specialistProfiles) {
  const metadata = marketplaceMetadata(profile, {
    ...config,
    profileId: profile.id,
  });
  const dependencyDisclosure = metadata.dependencyDisclosure;
  if (!dependencyDisclosure || typeof dependencyDisclosure !== "object") {
    failures.push(`${profile.id}: missing dependencyDisclosure`);
    continue;
  }
  if (dependencyDisclosure.schemaVersion !== "reddi.agent-dependency-manifest.v1") {
    failures.push(`${profile.id}: invalid dependencyDisclosure schemaVersion`);
  }
  for (const field of requiredArrayFields) {
    if (!Array.isArray(metadata[field])) failures.push(`${profile.id}: top-level ${field} is not an array`);
    if (!Array.isArray(dependencyDisclosure[field])) failures.push(`${profile.id}: dependencyDisclosure.${field} is not an array`);
    if (JSON.stringify(metadata[field] ?? null) !== JSON.stringify(dependencyDisclosure[field] ?? null)) {
      failures.push(`${profile.id}: top-level ${field} does not match dependencyDisclosure.${field}`);
    }
  }
  if (typeof metadata.disclosurePolicy !== "string" || !metadata.disclosurePolicy.includes("downstream-disclosure-ledger")) {
    failures.push(`${profile.id}: missing downstream disclosure policy`);
  }
  if (metadata.disclosurePolicy !== dependencyDisclosure.disclosurePolicy) {
    failures.push(`${profile.id}: top-level disclosurePolicy does not match dependencyDisclosure.disclosurePolicy`);
  }
  if (!metadata.agenticWorkflowDisclosure || metadata.agenticWorkflowDisclosure.schemaVersion !== "reddi.agentic-workflow-disclosure.v1") {
    failures.push(`${profile.id}: missing agentic workflow disclosure`);
  }
  if (profile.roles.includes("consumer")) {
    if (!metadata.tools.includes("marketplace_discovery")) failures.push(`${profile.id}: consumer missing marketplace_discovery tool`);
    if (!metadata.tools.includes("x402_specialist_call")) failures.push(`${profile.id}: consumer missing x402_specialist_call tool`);
  }
  summaries.push({
    profileId: profile.id,
    tools: metadata.tools.length,
    skills: metadata.skills.length,
    marketplaceAgentCalls: metadata.marketplaceAgentCalls.length,
    externalMcpServers: metadata.externalMcpServers.length,
    nonMarketplaceAgentCalls: metadata.nonMarketplaceAgentCalls.length,
  });
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, checkedProfiles: summaries.length, summaries }, null, 2));
