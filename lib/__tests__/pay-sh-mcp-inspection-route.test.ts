describe("Pay.sh MCP inspection route", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns metadata-only server-card inspection", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        protocolVersion: "2025-06-18",
        serverInfo: { name: "pay", title: "pay MCP server", version: "0.10.0" },
        transport: { type: "stdio", command: "pay", args: ["mcp"] },
        tools: [
          { name: "search_skills" },
          { name: "curl" },
          { name: "get_balance" },
        ],
      }),
    }) as jest.Mock;

    const { GET } = await import("@/app/api/source-adapters/pay-sh/mcp-inspection/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith("https://pay.sh/.well-known/mcp/server-card.json", expect.any(Object));
    expect(data.mode).toBe("metadata-only-mcp-inspection");
    expect(data.blockedLiveTools).toEqual(["curl", "get_balance"]);
    expect(data.boundary).toContain("does not run pay mcp");
  });

  it("returns 502 when public metadata fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, statusText: "Unavailable" }) as jest.Mock;

    const { GET } = await import("@/app/api/source-adapters/pay-sh/mcp-inspection/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("503");
  });
});
