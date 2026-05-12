import {
  classifyPayShMcpTool,
  inspectPayShMcpServerCard,
  type PayShMcpServerCard,
} from "@/lib/integrations/source-adapter/pay-sh-mcp-inspection";

describe("Pay.sh MCP inspection", () => {
  const serverCard: PayShMcpServerCard = {
    version: "1.0",
    protocolVersion: "2025-06-18",
    serverInfo: {
      name: "pay",
      title: "pay MCP server",
      version: "0.10.0",
    },
    transport: {
      type: "stdio",
      command: "pay",
      args: ["mcp"],
    },
    authentication: { required: false },
    documentation: "https://pay.sh/docs/pay-for-apis/mcp/index.md",
    tools: [
      { name: "search_skills", title: "Search pay-skills providers" },
      { name: "get_skill_endpoints", title: "Get provider endpoints" },
      { name: "curl", title: "Paid HTTP request" },
      { name: "get_balance", title: "Check Pay balance" },
      { name: "create_skill", title: "Create provider file" },
    ],
  };

  it("classifies Pay.sh MCP tools by dry-run risk", () => {
    expect(classifyPayShMcpTool("search_skills")).toBe("read_only");
    expect(classifyPayShMcpTool("get_skill_endpoints")).toBe("read_only");
    expect(classifyPayShMcpTool("curl")).toBe("paid_invocation");
    expect(classifyPayShMcpTool("get_balance")).toBe("balance_read");
    expect(classifyPayShMcpTool("create_skill")).toBe("provider_authoring");
  });

  it("builds a metadata-only inspection plan with live tools blocked", () => {
    const inspection = inspectPayShMcpServerCard(serverCard);

    expect(inspection.ok).toBe(true);
    expect(inspection.mode).toBe("metadata-only-mcp-inspection");
    expect(inspection.transport).toMatchObject({ type: "stdio", command: "pay", args: ["mcp"], localOnly: true });
    expect(inspection.tools.find((tool) => tool.name === "search_skills")?.allowedInDryRun).toBe(true);
    expect(inspection.tools.find((tool) => tool.name === "curl")?.allowedInDryRun).toBe(false);
    expect(inspection.blockedLiveTools).toEqual(["curl", "get_balance", "create_skill"]);
    expect(inspection.policy).toMatchObject({
      noWalletSetup: true,
      noTopUp: true,
      noPaidInvocation: true,
      requireAllowlistForPaidCurl: true,
      requireReceiptCapture: true,
    });
  });

  it("flags unexpected server-card shape", () => {
    const inspection = inspectPayShMcpServerCard({
      serverInfo: { name: "not-pay" },
      transport: { type: "http", command: "node", args: [] },
    });

    expect(inspection.ok).toBe(false);
    expect(inspection.error).toContain("Unexpected");
  });
});
