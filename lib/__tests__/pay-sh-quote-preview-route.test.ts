jest.mock("@/lib/integrations/source-adapter/pay-sh-catalog", () => ({
  loadPayShCandidate: jest.fn(),
}));

describe("Pay.sh quote preview route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("builds a dry-run route preview for a Pay.sh candidate", async () => {
    const { loadPayShCandidate } = await import("@/lib/integrations/source-adapter/pay-sh-catalog");
    (loadPayShCandidate as jest.Mock).mockReturnValue({
      ok: true,
      sourcePath: "artifacts/pay-sh-catalog/20260513-initial/catalog.json",
      candidate: {
        candidateId: "pay-sh:agentmail:email",
        source: "pay-sh",
        providerFqn: "agentmail/email",
        providerName: "AgentMail",
        category: "messaging",
        taskTypes: ["communications"],
        endpointCount: 83,
        pricing: {
          currency: "USDC",
          network: "solana",
          minUsd: 0,
          maxUsd: 10,
          hasFreeTier: true,
          hasMetering: true,
        },
        trustNotes: ["Imported from Pay.sh catalog as external Solana x402/MPP metadata."],
      },
    });

    const { GET } = await import("@/app/api/source-adapters/pay-sh/quote-preview/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/pay-sh/quote-preview?candidateId=pay-sh:agentmail:email&task=send%20email"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(loadPayShCandidate).toHaveBeenCalledWith("pay-sh:agentmail:email");
    expect(data.routePreview.plannerPolicy).toMatchObject({
      preferredSource: "pay-sh",
      livePaymentAllowed: false,
      solanaFirst: true,
    });
    expect(data.quotePreview).toMatchObject({ currency: "USDC", network: "solana", maxUsd: 10 });
    expect(data.requiredGates.join(" ")).toContain("top-up");
  });

  it("rejects missing candidateId", async () => {
    const { GET } = await import("@/app/api/source-adapters/pay-sh/quote-preview/route");
    const res = await GET(new Request("http://localhost/api/source-adapters/pay-sh/quote-preview"));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toContain("candidateId");
  });
});
