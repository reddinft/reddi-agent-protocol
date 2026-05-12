jest.mock("@/lib/integrations/source-adapter/circle-x402-catalog", () => ({
  loadCircleX402Catalog: jest.fn(),
}));

describe("Circle x402 catalog route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns a dry-run catalog and forwards category/limit filters", async () => {
    const { loadCircleX402Catalog } = await import("@/lib/integrations/source-adapter/circle-x402-catalog");
    (loadCircleX402Catalog as jest.Mock).mockReturnValue({
      ok: true,
      sourcePath: "artifacts/circle-x402-discovery/20260513-iteration1/resources.json",
      summary: { totalResources: 509 },
      candidates: [{ candidateId: "circle-x402:example:resource" }],
      total: 12,
      returned: 1,
    });

    const { GET } = await import("@/app/api/source-adapters/circle-x402/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/circle-x402?limit=1&category=FINANCIAL_ANALYSIS"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(loadCircleX402Catalog).toHaveBeenCalledWith({ limit: 1, category: "FINANCIAL_ANALYSIS" });
    expect(data.mode).toBe("dry-run-catalog");
    expect(data.boundary).toContain("never pays or invokes");
    expect(data.candidates).toHaveLength(1);
  });

  it("returns 404 with setup guidance when the ingest artifact is missing", async () => {
    const { loadCircleX402Catalog } = await import("@/lib/integrations/source-adapter/circle-x402-catalog");
    (loadCircleX402Catalog as jest.Mock).mockReturnValue({
      ok: false,
      sourcePath: "missing/resources.json",
      summary: null,
      candidates: [],
      total: 0,
      returned: 0,
      error: "Circle x402 ingest artifact not found at missing/resources.json. Run npm run ingest:circle-x402 first.",
    });

    const { GET } = await import("@/app/api/source-adapters/circle-x402/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/circle-x402"));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toContain("ingest:circle-x402");
  });
});
