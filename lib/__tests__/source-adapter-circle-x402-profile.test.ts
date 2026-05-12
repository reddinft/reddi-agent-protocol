import {
  buildCircleX402SourceManifest,
  circleX402DiscoveryResourceToCandidate,
  CIRCLE_X402_SOURCE_PROFILE,
  mapCircleX402CategoryToTaskTypes,
  type CircleX402DiscoveryResource,
} from "@/lib/integrations/source-adapter/profiles/circle-x402";
import { getSourceProfile } from "@/lib/integrations/source-adapter/profiles";
import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";

describe("source adapter circle-x402 profile", () => {
  it("is discoverable via source registry", () => {
    const profile = getSourceProfile("circle-x402");
    expect(profile).toBeTruthy();
    expect(profile?.source).toBe("circle-x402");
    expect(profile?.roles).toContain("specialist");
    expect(profile?.roles).toContain("consumer");
  });

  it("maps Circle discovery categories into RAP task types", () => {
    expect(mapCircleX402CategoryToTaskTypes("WEB_SEARCH_RESEARCH")).toEqual(["research", "web-search"]);
    expect(mapCircleX402CategoryToTaskTypes("FINANCIAL_ANALYSIS")).toEqual(["financial-analysis", "market-data"]);
    expect(mapCircleX402CategoryToTaskTypes("UNKNOWN_VENDOR_CATEGORY")).toEqual(["external-api"]);
  });

  it("builds a valid Circle x402 specialist manifest", () => {
    const manifest = buildCircleX402SourceManifest({
      role: "specialist",
      runtime: "circle-gateway",
      taskTypes: ["research", "web-search"],
    });

    const validation = validateSourceAdapterManifest(manifest);
    expect(validation.ok).toBe(true);
    expect(manifest.source).toBe(CIRCLE_X402_SOURCE_PROFILE.source);
    expect(manifest.paymentPolicy).toBe("x402_required");
  });

  it("converts a Circle Discovery resource into an unattested RAP specialist candidate", () => {
    const resource: CircleX402DiscoveryResource = {
      resource: "https://api.example.com/v1/search/research",
      type: "http",
      x402Version: 1,
      accepts: [
        {
          scheme: "exact",
          network: "eip155:8453",
          asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
          maxAmountRequired: "5000",
          payTo: "0x1234567890123456789012345678901234567890",
        },
      ],
      metadata: {
        provider: {
          name: "Example Research API",
          category: "WEB_SEARCH_RESEARCH",
          tags: ["research", "web"],
        },
        description: "Paid research endpoint",
        supportsCircleGateway: true,
        supportsVanillax402: true,
      },
    };

    const candidate = circleX402DiscoveryResourceToCandidate(resource);

    expect(candidate.candidateId).toBe("circle-x402:api.example.com:v1-search-research");
    expect(candidate.providerName).toBe("Example Research API");
    expect(candidate.taskTypes).toEqual(["research", "web-search"]);
    expect(candidate.attestationState).toBe("externally_listed_unattested");
    expect(candidate.payment[0]).toMatchObject({
      rail: "circle_gateway",
      network: "eip155:8453",
      priceUsdc: 0.005,
    });
    expect(validateSourceAdapterManifest(candidate.sourceAdapter).ok).toBe(true);
    expect(candidate.trustNotes.join(" ")).toContain("Not RAP-attested");
  });
});
