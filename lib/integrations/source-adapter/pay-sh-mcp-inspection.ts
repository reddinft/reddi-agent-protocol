export type PayShMcpServerCardTool = {
  name: string;
  title?: string;
  description?: string;
};

export type PayShMcpServerCard = {
  $schema?: string;
  version?: string;
  protocolVersion?: string;
  serverInfo?: {
    name?: string;
    title?: string;
    version?: string;
  };
  description?: string;
  transport?: {
    type?: string;
    command?: string;
    args?: string[];
  };
  authentication?: {
    required?: boolean;
  };
  documentation?: string;
  tools?: PayShMcpServerCardTool[];
};

export type PayShMcpInspection = {
  ok: boolean;
  mode: "metadata-only-mcp-inspection";
  server: {
    name: string;
    title: string;
    version: string;
    protocolVersion: string;
    documentation?: string;
  };
  transport: {
    type: string;
    command: string;
    args: string[];
    localOnly: boolean;
  };
  tools: Array<PayShMcpServerCardTool & {
    riskClass: "read_only" | "balance_read" | "paid_invocation" | "provider_authoring" | "unknown";
    allowedInDryRun: boolean;
  }>;
  policy: {
    noWalletSetup: true;
    noTopUp: true;
    noPaidInvocation: true;
    noSecretStorage: true;
    requireUserApprovalForLivePayment: true;
    requireAllowlistForPaidCurl: true;
    requireReceiptCapture: true;
  };
  blockedLiveTools: string[];
  notes: string[];
  error?: string;
};

const READ_ONLY_TOOLS = new Set(["search_skills", "list_skills", "get_skill_endpoints"]);
const PROVIDER_AUTHORING_TOOLS = new Set(["create_skill"]);

export function classifyPayShMcpTool(name: string): PayShMcpInspection["tools"][number]["riskClass"] {
  if (READ_ONLY_TOOLS.has(name)) return "read_only";
  if (name === "get_balance") return "balance_read";
  if (name === "curl") return "paid_invocation";
  if (PROVIDER_AUTHORING_TOOLS.has(name)) return "provider_authoring";
  return "unknown";
}

export function inspectPayShMcpServerCard(card: PayShMcpServerCard): PayShMcpInspection {
  const serverName = card.serverInfo?.name ?? "unknown";
  const command = card.transport?.command ?? "";
  const args = card.transport?.args ?? [];
  const tools = (card.tools ?? []).map((tool) => {
    const riskClass = classifyPayShMcpTool(tool.name);
    return {
      ...tool,
      riskClass,
      allowedInDryRun: riskClass === "read_only",
    };
  });

  const blockedLiveTools = tools
    .filter((tool) => !tool.allowedInDryRun)
    .map((tool) => tool.name);

  return {
    ok: serverName === "pay" && command === "pay" && args.includes("mcp"),
    mode: "metadata-only-mcp-inspection",
    server: {
      name: serverName,
      title: card.serverInfo?.title ?? "pay MCP server",
      version: card.serverInfo?.version ?? "unknown",
      protocolVersion: card.protocolVersion ?? "unknown",
      documentation: card.documentation,
    },
    transport: {
      type: card.transport?.type ?? "unknown",
      command,
      args,
      localOnly: card.transport?.type === "stdio" && command === "pay",
    },
    tools,
    policy: {
      noWalletSetup: true,
      noTopUp: true,
      noPaidInvocation: true,
      noSecretStorage: true,
      requireUserApprovalForLivePayment: true,
      requireAllowlistForPaidCurl: true,
      requireReceiptCapture: true,
    },
    blockedLiveTools,
    notes: [
      "Inspection uses public Pay.sh MCP server-card metadata only.",
      "Dry-run mode may plan around read-only discovery tools but must not execute paid curl or wallet-affecting commands.",
      "Any live Pay.sh invocation requires explicit user approval, allowlisted provider/endpoint, tiny spend cap, and receipt capture.",
    ],
    error: serverName === "pay" && command === "pay" && args.includes("mcp") ? undefined : "Unexpected Pay.sh MCP server card shape.",
  };
}
