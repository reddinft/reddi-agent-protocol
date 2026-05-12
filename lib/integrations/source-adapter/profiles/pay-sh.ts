import { SOURCE_ADAPTER_VERSION, type SourceAdapterManifest, type SourceAdapterRole } from "@/lib/integrations/source-adapter/schema";

export const PAY_SH_SOURCE_ID = "pay-sh" as const;

export type PayShProviderCategory =
  | "ai_ml"
  | "compute"
  | "data"
  | "finance"
  | "messaging"
  | "media"
  | "shopping"
  | "solana_infrastructure"
  | string;

export type PayShCatalogProvider = {
  fqn: string;
  title: string;
  description?: string;
  use_case?: string;
  category?: PayShProviderCategory;
  service_url?: string;
  endpoint_count?: number;
  has_metering?: boolean;
  has_free_tier?: boolean;
  min_price_usd?: number;
  max_price_usd?: number;
  sha?: string;
};

export type ReddiPayShCandidate = {
  candidateId: string;
  source: typeof PAY_SH_SOURCE_ID;
  providerFqn: string;
  providerName: string;
  serviceUrl?: string;
  category: string;
  taskTypes: string[];
  endpointCount: number;
  pricing: {
    currency: "USDC";
    network: "solana";
    minUsd: number;
    maxUsd: number;
    hasFreeTier: boolean;
    hasMetering: boolean;
  };
  sourceAdapter: SourceAdapterManifest;
  attestationState: "externally_listed_unattested";
  trustNotes: string[];
};

export const PAY_SH_SOURCE_PROFILE = {
  source: PAY_SH_SOURCE_ID,
  roles: ["specialist", "consumer"] as SourceAdapterRole[],
  runtimes: ["http", "mcp", "pay-cli", "x402", "mpp", "solana-usdc"],
  defaultPaymentPolicy: "x402_required" as const,
  defaultAttestationState: "externally_listed_unattested" as const,
  capabilityHints: {
    specialist: ["pay-sh", "x402", "mpp", "paid-api", "solana-usdc", "external-service"],
    consumer: ["discover", "quote", "pay", "verify-receipt", "mcp"],
  },
};

const CATEGORY_TASK_TYPES: Record<string, string[]> = {
  ai_ml: ["ai-inference", "model-api", "media-generation"],
  compute: ["developer-tooling", "infrastructure", "rpc"],
  data: ["research", "data-enrichment"],
  finance: ["market-data", "financial-analysis"],
  messaging: ["communications", "email", "workflow-automation"],
  media: ["media-generation", "creative-generation"],
  shopping: ["shopping", "ecommerce-intelligence"],
  solana_infrastructure: ["solana-infrastructure", "rpc", "onchain-data"],
};

export function mapPayShCategoryToTaskTypes(category: PayShProviderCategory | undefined) {
  if (!category) return ["external-api"];
  return CATEGORY_TASK_TYPES[category] ?? ["external-api"];
}

function stableCandidateId(fqn: string) {
  return `${PAY_SH_SOURCE_ID}:${fqn.replace(/\//g, ":").replace(/[^a-zA-Z0-9:-]+/g, "-").replace(/^[:\-]+|[:\-]+$/g, "").toLowerCase()}`;
}

export function buildPayShSourceManifest(input: {
  role: Extract<SourceAdapterRole, "specialist" | "consumer">;
  runtime?: "http" | "mcp" | "pay-cli";
  taskTypes: string[];
  inputModes?: string[];
  outputModes?: string[];
}): SourceAdapterManifest {
  return {
    version: SOURCE_ADAPTER_VERSION,
    source: PAY_SH_SOURCE_ID,
    role: input.role,
    runtime: input.runtime ?? "http",
    capabilities: {
      taskTypes: input.taskTypes,
      inputModes: input.inputModes ?? ["json", "text"],
      outputModes: input.outputModes ?? ["json"],
    },
    paymentPolicy: PAY_SH_SOURCE_PROFILE.defaultPaymentPolicy,
    failurePolicy: {
      maxRetries: 0,
      refundOnFailure: false,
    },
  };
}

export function payShCatalogProviderToCandidate(provider: PayShCatalogProvider): ReddiPayShCandidate {
  const category = provider.category ?? "unknown";
  const taskTypes = mapPayShCategoryToTaskTypes(category);
  const minUsd = Math.max(0, provider.min_price_usd ?? 0);
  const maxUsd = Math.max(minUsd, provider.max_price_usd ?? minUsd);

  return {
    candidateId: stableCandidateId(provider.fqn),
    source: PAY_SH_SOURCE_ID,
    providerFqn: provider.fqn,
    providerName: provider.title,
    serviceUrl: provider.service_url,
    category,
    taskTypes,
    endpointCount: provider.endpoint_count ?? 0,
    pricing: {
      currency: "USDC",
      network: "solana",
      minUsd,
      maxUsd,
      hasFreeTier: provider.has_free_tier === true || minUsd === 0,
      hasMetering: provider.has_metering === true,
    },
    sourceAdapter: buildPayShSourceManifest({
      role: "specialist",
      runtime: "http",
      taskTypes,
    }),
    attestationState: PAY_SH_SOURCE_PROFILE.defaultAttestationState,
    trustNotes: [
      "Imported from Pay.sh catalog as external Solana x402/MPP metadata.",
      "Not RAP-attested until a RAP attestor verifies output, receipt, and evidence.",
      "Preview only: RAP has not created a Pay.sh wallet, top-up, or paid API call for this candidate.",
    ],
  };
}
