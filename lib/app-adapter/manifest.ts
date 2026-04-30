import { listAppAdapterAgents } from "./registry";
import type { AppAdapterAgent, AppAdapterManifestAgent } from "./types";

export function toManifestAgent(agent: AppAdapterAgent): AppAdapterManifestAgent {
  return {
    id: agent.appAgentId,
    name: agent.name,
    description: agent.description,
    capabilities: agent.capabilities,
    input_schema_url: agent.inputSchemaUrl,
    run_url: agent.runUrl,
    status: agent.enabled ? "available" : "disabled",
  };
}

export function buildAppAdapterManifest() {
  return {
    name: "ReddiAgents",
    version: "0.1.0",
    protocol: "app",
    description:
      "APP-compatible adapter for Reddi Agent Protocol specialists with x402 payments, Solana escrow, and attested evidence.",
    agents: listAppAdapterAgents().map(toManifestAgent),
  };
}

export function buildAppAdapterAgentList() {
  return listAppAdapterAgents({ includeDisabled: true }).map((agent) => ({
    ...toManifestAgent(agent),
    reddi: {
      source: agent.sourcePolicy.preferredSource ?? "openclaw",
      strict_source_match: agent.sourcePolicy.strictSourceMatch ?? false,
      specialist_endpoint: agent.reddi.specialistEndpoint,
      x402_required: agent.reddi.x402Required,
      attestation_supported: agent.reddi.attestationSupported,
      evidence_routes: agent.reddi.evidenceRoutes,
    },
  }));
}
