import { fetchSpecialistListings } from "@/lib/registry/bridge";

export const runtime = "nodejs";

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

    if (sort === "ranking") {
      results = [...results].sort((a, b) => b.ranking_score - a.ranking_score);
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
