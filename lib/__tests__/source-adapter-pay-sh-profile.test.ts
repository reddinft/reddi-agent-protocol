import {
  buildPayShSourceManifest,
  mapPayShCategoryToTaskTypes,
  payShCatalogProviderToCandidate,
  PAY_SH_SOURCE_PROFILE,
  type PayShCatalogProvider,
} from "@/lib/integrations/source-adapter/profiles/pay-sh";
import { getSourceProfile } from "@/lib/integrations/source-adapter/profiles";
import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";

describe("source adapter pay-sh profile", () => {
  it("is discoverable via source registry", () => {
    const profile = getSourceProfile("pay-sh");
    expect(profile).toBeTruthy();
    expect(profile?.source).toBe("pay-sh");
    expect(profile?.roles).toContain("specialist");
    expect(profile?.roles).toContain("consumer");
  });

  it("maps Pay.sh categories into RAP task types", () => {
    expect(mapPayShCategoryToTaskTypes("finance")).toEqual(["market-data", "financial-analysis"]);
    expect(mapPayShCategoryToTaskTypes("messaging")).toEqual(["communications", "email", "workflow-automation"]);
    expect(mapPayShCategoryToTaskTypes("UNKNOWN_VENDOR_CATEGORY")).toEqual(["external-api"]);
  });

  it("builds a valid Pay.sh specialist manifest", () => {
    const manifest = buildPayShSourceManifest({
      role: "specialist",
      runtime: "mcp",
      taskTypes: ["market-data"],
    });

    const validation = validateSourceAdapterManifest(manifest);
    expect(validation.ok).toBe(true);
    expect(manifest.source).toBe(PAY_SH_SOURCE_PROFILE.source);
    expect(manifest.paymentPolicy).toBe("x402_required");
  });

  it("converts a Pay.sh catalog provider into an unattested RAP specialist candidate", () => {
    const provider: PayShCatalogProvider = {
      fqn: "merit-systems/stablecrypto/market-data",
      title: "StableCrypto",
      description: "Market data APIs",
      category: "finance",
      service_url: "https://stablecrypto.dev",
      endpoint_count: 105,
      has_metering: true,
      has_free_tier: false,
      min_price_usd: 0.01,
      max_price_usd: 0.01,
      sha: "2858c649a49c995a",
    };

    const candidate = payShCatalogProviderToCandidate(provider);

    expect(candidate.candidateId).toBe("pay-sh:merit-systems:stablecrypto:market-data");
    expect(candidate.providerName).toBe("StableCrypto");
    expect(candidate.taskTypes).toEqual(["market-data", "financial-analysis"]);
    expect(candidate.pricing).toMatchObject({
      currency: "USDC",
      network: "solana",
      minUsd: 0.01,
      maxUsd: 0.01,
      hasMetering: true,
    });
    expect(candidate.attestationState).toBe("externally_listed_unattested");
    expect(validateSourceAdapterManifest(candidate.sourceAdapter).ok).toBe(true);
    expect(candidate.trustNotes.join(" ")).toContain("Not RAP-attested");
  });
});
