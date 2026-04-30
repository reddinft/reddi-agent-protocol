export type AppAdapterStatus = "available" | "disabled";

export type AppAdapterAgent = {
  appAgentId: string;
  name: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
  inputSchemaUrl: string;
  runUrl: string;
  sourcePolicy: {
    preferredSource?: "openclaw" | "external";
    strictSourceMatch?: boolean;
  };
  reddi: {
    specialistEndpoint?: string;
    specialistWallet?: string;
    x402Required: boolean;
    attestationSupported: boolean;
    evidenceRoutes: string[];
  };
  inputSchema: Record<string, unknown>;
};

export type AppAdapterManifestAgent = {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  input_schema_url: string;
  run_url: string;
  status: AppAdapterStatus;
};

export type AppAdapterRunStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";

export type AppAdapterRunInput = {
  task: string;
  constraints?: string[];
  evidence_preference?: "summary" | "links" | "full_receipt";
};

export type AppAdapterRun = {
  runId: string;
  agentId: string;
  status: AppAdapterRunStatus;
  input: AppAdapterRunInput;
  context: {
    conversationId?: string;
    userId?: string;
    traceId: string;
  };
  createdAt: string;
  updatedAt: string;
  output?: {
    content: string;
    evidence: Array<{ label: string; url: string }>;
  };
  usage?: {
    input_tokens: number | null;
    output_tokens: number | null;
    cost_usd: number | null;
  };
  receipt?: {
    adapter: "reddiagents-app-adapter";
    adapter_version: "0.1.0";
    trace_id: string;
    agent_id: string;
    x402_required: boolean;
    x402_satisfied: boolean;
    attestation_status: "not_requested" | "pending" | "passed" | "failed";
    escrow_status: "not_used" | "locked" | "released" | "refunded" | "failed";
    safe_public_evidence_only: true;
  };
  safeError?: {
    code: string;
    message: string;
  };
};
