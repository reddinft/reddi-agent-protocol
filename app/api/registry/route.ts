import { fetchSpecialistListings } from "@/lib/registry/bridge";

export const runtime = "nodejs";

function parseCsv(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function asEpochMs(value: string | null): number {
  if (!value) return -1;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? -1 : parsed;
}

/**
 * GET /api/registry
 * Returns merged on-chain + off-chain specialist listings.
 * Query params:
 *   taskType   — filter by task type ID
 *   inputMode  — filter by input mode ID
 *   privacyMode — filter by privacy mode ID
 *   runtimeCap — filter by runtime capability
 *   attested   — "true" to require attestation
 *   health     — "pass" to require health pass
 *   tag       — filter by one capability tag
 *   tags      — CSV filter by one or more capability tags
 *   sortBy    — "ranking" | "reputation" | "cost" | "feedback" (default: default bridge sort)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filterTaskType = searchParams.get("taskType");
    const filterInputMode = searchParams.get("inputMode");
    const filterPrivacyMode = searchParams.get("privacyMode");
    const filterAttested = searchParams.get("attested") === "true";
    const filterHealth = searchParams.get("health");
    const filterRuntimeCap = searchParams.get("runtimeCap");
    const filterTag = searchParams.get("tag");
    const filterTags = parseCsv(searchParams.get("tags"));
    const sort = searchParams.get("sortBy") ?? searchParams.get("sort") ?? "default";

    const { ok, listings, onchainCount, indexedCount, error } =
      await fetchSpecialistListings();

    let results = listings;

    if (filterTaskType) {
      results = results.filter((l) =>
        l.capabilities?.taskTypes.includes(filterTaskType as never)
      );
    }
    if (filterInputMode) {
      results = results.filter((l) =>
        l.capabilities?.inputModes.includes(filterInputMode as never)
      );
    }
    if (filterPrivacyMode) {
      results = results.filter((l) =>
        l.capabilities?.privacyModes.includes(filterPrivacyMode as never)
      );
    }
    if (filterAttested) {
      results = results.filter((l) => l.attestation.attested);
    }
    if (filterHealth === "pass") {
      results = results.filter((l) => l.health.status === "pass");
    }
    if (filterRuntimeCap) {
      results = results.filter((l) =>
        l.capabilities?.runtime_capabilities?.includes(filterRuntimeCap as never)
      );
    }
    if (filterTag) {
      results = results.filter((l) => l.capabilities?.tags?.includes(filterTag));
    }
    if (filterTags.length > 0) {
      results = results.filter((l) =>
        filterTags.some((tag) => l.capabilities?.tags?.includes(tag))
      );
    }

    if (sort === "ranking") {
      results = [...results].sort((a, b) => {
        if (a.ranking_score !== b.ranking_score) {
          return b.ranking_score - a.ranking_score;
        }

        const aFreshness = asEpochMs(a.health.lastCheckedAt);
        const bFreshness = asEpochMs(b.health.lastCheckedAt);
        if (aFreshness !== bFreshness) {
          return bFreshness - aFreshness;
        }

        const aCost = a.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
        const bCost = b.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
        return aCost - bCost;
      });
    } else if (sort === "reputation") {
      results = [...results].sort(
        (a, b) => b.onchain.reputationScore - a.onchain.reputationScore
      );
    } else if (sort === "cost") {
      results = [...results].sort(
        (a, b) => (a.capabilities?.perCallUsd ?? 0) - (b.capabilities?.perCallUsd ?? 0)
      );
    } else if (sort === "feedback") {
      results = [...results].sort(
        (a, b) => b.signals.avgFeedbackScore - a.signals.avgFeedbackScore
      );
    }

    return Response.json({
      ok,
      listings: results,
      total: results.length,
      onchainCount,
      indexedCount,
      error: error ?? null,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : "Registry fetch failed" },
      { status: 500 }
    );
  }
}
