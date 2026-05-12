import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  payShCatalogProviderToCandidate,
  type PayShCatalogProvider,
  type ReddiPayShCandidate,
} from "@/lib/integrations/source-adapter/profiles/pay-sh";

export const DEFAULT_PAY_SH_CATALOG_PATH = "artifacts/pay-sh-catalog/20260513-initial/catalog.json";
const DEFAULT_PAY_SH_CATALOG_ABSOLUTE_PATH = join(
  process.cwd(),
  "artifacts",
  "pay-sh-catalog",
  "20260513-initial",
  "catalog.json"
);

export type PayShCatalogSummary = {
  generated_at?: string;
  provider_count?: number;
  base_url?: string;
  categories?: Record<string, number>;
  pricesUsd?: {
    min?: number | null;
    max?: number | null;
  };
  boundary?: string;
};

export type PayShCatalog = {
  ok: boolean;
  sourcePath: string;
  summary: PayShCatalogSummary | null;
  candidates: ReddiPayShCandidate[];
  total: number;
  returned: number;
  error?: string;
};

export type PayShCandidateLookup = Pick<PayShCatalog, "ok" | "sourcePath" | "error"> & {
  candidate: ReddiPayShCandidate | null;
};

function readPayShProviders():
  | { ok: true; sourcePath: string; summary: PayShCatalogSummary | null; providers: PayShCatalogProvider[] }
  | { ok: false; sourcePath: string; error: string } {
  const sourcePath = DEFAULT_PAY_SH_CATALOG_PATH;
  const absolutePath = DEFAULT_PAY_SH_CATALOG_ABSOLUTE_PATH;

  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      sourcePath,
      error: `Pay.sh catalog artifact not found at ${sourcePath}. Run npm run ingest:pay-sh first.`,
    };
  }

  const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as {
    summary?: PayShCatalogSummary;
    providers?: PayShCatalogProvider[];
  };

  return {
    ok: true,
    sourcePath,
    summary: parsed.summary ?? null,
    providers: parsed.providers ?? [],
  };
}

export function loadPayShCatalog(options: { limit?: number; category?: string; q?: string } = {}): PayShCatalog {
  const loaded = readPayShProviders();
  if (!loaded.ok) {
    return {
      ok: false,
      sourcePath: loaded.sourcePath,
      summary: null,
      candidates: [],
      total: 0,
      returned: 0,
      error: loaded.error,
    };
  }

  const limit = Math.max(1, Math.min(options.limit ?? 50, 200));
  let providers = loaded.providers;
  if (options.category) {
    providers = providers.filter((provider) => provider.category === options.category);
  }
  if (options.q) {
    const q = options.q.toLowerCase();
    providers = providers.filter((provider) =>
      [provider.fqn, provider.title, provider.description, provider.use_case, provider.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }

  const candidates = providers.slice(0, limit).map(payShCatalogProviderToCandidate);

  return {
    ok: true,
    sourcePath: loaded.sourcePath,
    summary: loaded.summary,
    candidates,
    total: providers.length,
    returned: candidates.length,
  };
}

export function loadPayShCandidate(candidateId: string): PayShCandidateLookup {
  const loaded = readPayShProviders();
  if (!loaded.ok) {
    return {
      ok: false,
      sourcePath: loaded.sourcePath,
      candidate: null,
      error: loaded.error,
    };
  }

  const candidate = loaded.providers
    .map(payShCatalogProviderToCandidate)
    .find((item) => item.candidateId === candidateId) ?? null;

  return {
    ok: candidate !== null,
    sourcePath: loaded.sourcePath,
    candidate,
    error: candidate ? undefined : `Pay.sh candidate not found: ${candidateId}`,
  };
}
