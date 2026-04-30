import type { AppAdapterAgent } from "./types";

export const appAdapterInputSchema = {
  type: "object",
  required: ["task"],
  additionalProperties: false,
  properties: {
    task: {
      type: "string",
      minLength: 1,
      description: "The task for the selected ReddiAgent specialist.",
    },
    constraints: {
      type: "array",
      items: { type: "string" },
      description: "Optional caller constraints for the specialist run.",
    },
    evidence_preference: {
      type: "string",
      enum: ["summary", "links", "full_receipt"],
      default: "summary",
    },
  },
} as const;

export const appAdapterAgents: AppAdapterAgent[] = [
  {
    appAgentId: "reddi.qa-testing-specialist",
    name: "Reddi QA Testing Specialist",
    description: "x402-paid QA specialist exposed through the ReddiAgents APP Adapter.",
    capabilities: ["qa.review", "test.plan", "evidence.summarize"],
    enabled: true,
    inputSchemaUrl: "/app/agents/reddi.qa-testing-specialist/schema",
    runUrl: "/app/runs",
    sourcePolicy: {
      preferredSource: "openclaw",
      strictSourceMatch: true,
    },
    reddi: {
      specialistEndpoint: "https://reddi-qa.preview.reddi.tech",
      x402Required: true,
      attestationSupported: true,
      evidenceRoutes: ["/manager", "/testers"],
    },
    inputSchema: appAdapterInputSchema,
  },
  {
    appAgentId: "reddi.ux-testing-specialist",
    name: "Reddi UX Testing Specialist",
    description: "UX testing specialist prepared for APP exposure after route-level contract tests pass.",
    capabilities: ["ux.review", "flow.audit", "evidence.summarize"],
    enabled: false,
    inputSchemaUrl: "/app/agents/reddi.ux-testing-specialist/schema",
    runUrl: "/app/runs",
    sourcePolicy: {
      preferredSource: "openclaw",
      strictSourceMatch: true,
    },
    reddi: {
      specialistEndpoint: "https://reddi-ux.preview.reddi.tech",
      x402Required: true,
      attestationSupported: true,
      evidenceRoutes: ["/manager", "/testers"],
    },
    inputSchema: appAdapterInputSchema,
  },
  {
    appAgentId: "reddi.integration-testing-specialist",
    name: "Reddi Integration Testing Specialist",
    description: "Integration testing specialist prepared for APP exposure after route-level contract tests pass.",
    capabilities: ["integration.review", "api.audit", "evidence.summarize"],
    enabled: false,
    inputSchemaUrl: "/app/agents/reddi.integration-testing-specialist/schema",
    runUrl: "/app/runs",
    sourcePolicy: {
      preferredSource: "openclaw",
      strictSourceMatch: true,
    },
    reddi: {
      specialistEndpoint: "https://reddi-integration.preview.reddi.tech",
      x402Required: true,
      attestationSupported: true,
      evidenceRoutes: ["/manager", "/testers"],
    },
    inputSchema: appAdapterInputSchema,
  },
];

export function listAppAdapterAgents(options: { includeDisabled?: boolean } = {}) {
  return options.includeDisabled ? appAdapterAgents : appAdapterAgents.filter((agent) => agent.enabled);
}

export function findAppAdapterAgent(agentId: string) {
  return appAdapterAgents.find((agent) => agent.appAgentId === agentId);
}
