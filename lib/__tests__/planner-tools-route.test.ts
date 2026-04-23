jest.mock("@/lib/mcp/tools", () => ({
  MCP_TOOL_SCHEMAS: [{ name: "resolve_specialist" }],
  ELIZA_ACTION_MANIFEST: [{ name: "invoke_specialist" }],
}));

describe("planner tools manifest route", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns manifest with endpoint URLs", async () => {
    const { GET } = await import("@/app/api/planner/tools/route");
    const res = await GET(new Request("https://agent-protocol.reddi.tech/api/planner/tools"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.tools.endpoints.resolve).toBe("https://agent-protocol.reddi.tech/api/planner/tools/resolve");
    expect(body.tools.openai_function_calls).toHaveLength(1);
  });
});
