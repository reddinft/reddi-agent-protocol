jest.mock("@/lib/integrations/source-adapter/pay-sh-catalog", () => ({
  loadPayShCatalog: jest.fn(),
}));

describe("Pay.sh catalog route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns a dry-run catalog and forwards filters", async () => {
    const { loadPayShCatalog } = await import("@/lib/integrations/source-adapter/pay-sh-catalog");
    (loadPayShCatalog as jest.Mock).mockReturnValue({
      ok: true,
      sourcePath: "artifacts/pay-sh-catalog/20260513-initial/catalog.json",
      summary: { provider_count: 72 },
      candidates: [{ candidateId: "pay-sh:merit-systems:stablecrypto:market-data" }],
      total: 12,
      returned: 1,
    });

    const { GET } = await import("@/app/api/source-adapters/pay-sh/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/pay-sh?limit=1&category=finance&q=market"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(loadPayShCatalog).toHaveBeenCalledWith({ limit: 1, category: "finance", q: "market" });
    expect(data.mode).toBe("dry-run-catalog");
    expect(data.boundary).toContain("never creates a wallet");
    expect(data.candidates).toHaveLength(1);
  });

  it("returns 404 with setup guidance when the catalog artifact is missing", async () => {
    const { loadPayShCatalog } = await import("@/lib/integrations/source-adapter/pay-sh-catalog");
    (loadPayShCatalog as jest.Mock).mockReturnValue({
      ok: false,
      sourcePath: "missing/catalog.json",
      summary: null,
      candidates: [],
      total: 0,
      returned: 0,
      error: "Pay.sh catalog artifact not found at missing/catalog.json. Run npm run ingest:pay-sh first.",
    });

    const { GET } = await import("@/app/api/source-adapters/pay-sh/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/pay-sh"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("ingest:pay-sh");
  });
});
