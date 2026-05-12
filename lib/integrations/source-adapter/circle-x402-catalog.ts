import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import {
  circleX402DiscoveryResourceToCandidate,
  type CircleX402DiscoveryResource,
  type ReddiCircleX402Candidate,
} from "@/lib/integrations/source-adapter/profiles/circle-x402";

export const DEFAULT_CIRCLE_X402_INGEST_PATH = "artifacts/circle-x402-discovery/20260513-iteration1/resources.json";
const DEFAULT_CIRCLE_X402_INGEST_ABSOLUTE_PATH = join(
  process.cwd(),
  "artifacts",
  "circle-x402-discovery",
  "20260513-iteration1",
  "resources.json"
);

export type CircleX402IngestSummary = {
  crawledAt?: string;
  source?: string;
  totalResources?: number;
  categories?: Record<string, number>;
  providers?: Record<string, number>;
  networks?: Record<string, number>;
  pricesUsdc?: {
    count?: number;
    min?: number | null;
    median?: number | null;
    p90?: number | null;
    max?: number | null;
    mean?: number | null;
  };
  boundary?: string;
};

export type CircleX402Catalog = {
  ok: boolean;
  sourcePath: string;
  summary: CircleX402IngestSummary | null;
  candidates: ReddiCircleX402Candidate[];
  total: number;
  returned: number;
  error?: string;
};

export type CircleX402CandidateLookup = Pick<CircleX402Catalog, "ok" | "sourcePath" | "error"> & {
  candidate: ReddiCircleX402Candidate | null;
};

function readCircleX402Resources():
  | { ok: true; sourcePath: string; summary: CircleX402IngestSummary | null; resources: CircleX402DiscoveryResource[] }
  | { ok: false; sourcePath: string; error: string } {
  const sourcePath = DEFAULT_CIRCLE_X402_INGEST_PATH;
  const absolutePath = DEFAULT_CIRCLE_X402_INGEST_ABSOLUTE_PATH;

  if (!existsSync(absolutePath)) {
    return {
      ok: false,
      sourcePath,
      error: `Circle x402 ingest artifact not found at ${sourcePath}. Run npm run ingest:circle-x402 first.`,
    };
  }

  const parsed = JSON.parse(readFileSync(absolutePath, "utf8")) as {
    summary?: CircleX402IngestSummary;
    items?: CircleX402DiscoveryResource[];
  };

  return {
    ok: true,
    sourcePath,
    summary: parsed.summary ?? null,
    resources: parsed.items ?? [],
  };
}

export function loadCircleX402Catalog(options: { limit?: number; category?: string } = {}): CircleX402Catalog {
  const loaded = readCircleX402Resources();
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
  let resources = loaded.resources;
  if (options.category) {
    resources = resources.filter((resource) => resource.metadata?.provider?.category === options.category);
  }

  const candidates = resources.slice(0, limit).map(circleX402DiscoveryResourceToCandidate);

  return {
    ok: true,
    sourcePath: loaded.sourcePath,
    summary: loaded.summary,
    candidates,
    total: resources.length,
    returned: candidates.length,
  };
}

export function loadCircleX402Candidate(candidateId: string): CircleX402CandidateLookup {
  const loaded = readCircleX402Resources();
  if (!loaded.ok) {
    return {
      ok: false,
      sourcePath: loaded.sourcePath,
      candidate: null,
      error: loaded.error,
    };
  }

  const candidate = loaded.resources
    .map(circleX402DiscoveryResourceToCandidate)
    .find((item) => item.candidateId === candidateId) ?? null;

  return {
    ok: candidate !== null,
    sourcePath: loaded.sourcePath,
    candidate,
    error: candidate ? undefined : `Circle x402 candidate not found: ${candidateId}`,
  };
}
