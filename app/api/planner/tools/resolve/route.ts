/**
 * POST /api/planner/tools/resolve
 *
 * MCP tool: resolve_specialist
 * Find the best specialist candidate for a task without executing it.
 * Returns candidate details, pricing, and selection reasons.
 */
import { fetchSpecialistListings } from "@/lib/registry/bridge";
import { readPolicy } from "@/lib/orchestrator/policy";
import type { ResolveInput, ResolveOutput } from "@/lib/mcp/tools";
import { isValidRuntimeCapability } from "@/lib/capabilities/taxonomy";
import { evaluateSourceRoutingDecision } from "@/lib/integrations/source-adapter/routing-policy";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body: ResolveInput = await req.json();
    if (!body.task?.trim()) {
      return Response.json({ ok: false, error: "task is required" }, { status: 400 });
    }

    const savedPolicy = readPolicy();
    const policyOverride = body.policy ?? {};
    const requiredCapabilities = Array.isArray(body.required_capabilities)
      ? body.required_capabilities.filter(isValidRuntimeCapability)
      : [];
    const requiredAttestorCheckpoints = Array.isArray(body.required_attestor_checkpoints)
      ? body.required_attestor_checkpoints.map(String).map((value) => value.trim()).filter(Boolean)
      : [];
    const requiredQualityClaims = Array.isArray(body.required_quality_claims)
      ? body.required_quality_claims.map(String).map((value) => value.trim()).filter(Boolean)
      : [];

    const maxPerCallUsd =
      policyOverride.maxPerCallUsd ?? savedPolicy.maxPerTaskUsd ?? 0;
    const requireAttestation =
      policyOverride.requireAttestation ?? savedPolicy.requireAttestation ?? false;
    const minReputation =
      policyOverride.minReputation ?? savedPolicy.minReputation ?? 0;
    const preferredPrivacyMode =
      policyOverride.preferredPrivacyMode ?? savedPolicy.preferredPrivacyMode ?? "public";
    const preferredSource = policyOverride.preferredSource;
    const strictSourceMatch = policyOverride.strictSourceMatch === true;

    const sortBy = body.sortBy ?? "ranking";
    const filterTaskType = body.taskType;
    const filterInputMode = body.inputMode;
    const filterPrivacyMode = body.privacyMode;
    const filterRuntimeCap = body.runtimeCap;
    const filterAttested = body.attested === true;
    const filterHealth = body.health;
    const filterTag = body.tag;
    const filterTags = Array.isArray(body.tags)
      ? body.tags.map((t) => t.trim()).filter(Boolean)
      : [];

    const appliedFilters = {
      sortBy,
      taskType: filterTaskType,
      inputMode: filterInputMode,
      privacyMode: filterPrivacyMode,
      runtimeCap: filterRuntimeCap,
      attested: filterAttested || requireAttestation ? true : undefined,
      health: filterHealth,
      tag: filterTag,
      tags: filterTags.length > 0 ? filterTags : undefined,
    };

    const { listings } = await fetchSpecialistListings();
    const rejectionSummary = {
      sourcePolicy: 0,
      health: 0,
      attestation: 0,
      reputation: 0,
      cost: 0,
      capabilities: 0,
      endpoint: 0,
      disclosure: 0,
    };
    const rejectedWalletSamples: Record<keyof typeof rejectionSummary, string[]> = {
      sourcePolicy: [],
      health: [],
      attestation: [],
      reputation: [],
      cost: [],
      capabilities: [],
      endpoint: [],
      disclosure: [],
    };
    const rejectionSampleLimit = 3;

    const recordRejection = (reason: keyof typeof rejectionSummary, walletAddress: string) => {
      rejectionSummary[reason] += 1;
      const samples = rejectedWalletSamples[reason];
      if (samples.length < rejectionSampleLimit) {
        samples.push(walletAddress);
      }
    };

    // Filter and score candidates
    const eligibleListings = listings
      .map((l) => ({
        listing: l,
        sourceDecision: evaluateSourceRoutingDecision(l, {
          preferredSource,
          strictSourceMatch,
        }),
      }))
      .filter(({ listing: l, sourceDecision }) => {
        if (sourceDecision.reject) {
          recordRejection("sourcePolicy", l.walletAddress);
          return false;
        }
        if (l.health.status === "fail") {
          recordRejection("health", l.walletAddress);
          return false;
        }
        if (filterHealth && l.health.status !== filterHealth) {
          recordRejection("health", l.walletAddress);
          return false;
        }

        if (filterTaskType && !l.capabilities?.taskTypes.includes(filterTaskType as never)) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }
        if (filterInputMode && !l.capabilities?.inputModes.includes(filterInputMode as never)) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }
        if (filterPrivacyMode && !l.capabilities?.privacyModes.includes(filterPrivacyMode as never)) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }
        if (filterRuntimeCap && !l.capabilities?.runtime_capabilities?.includes(filterRuntimeCap as never)) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }
        if (filterTag && !l.capabilities?.tags?.includes(filterTag)) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }
        if (filterTags.length > 0 && !filterTags.some((tag) => l.capabilities?.tags?.includes(tag))) {
          recordRejection("capabilities", l.walletAddress);
          return false;
        }

        if ((filterAttested || requireAttestation) && !l.attestation.attested) {
          recordRejection("attestation", l.walletAddress);
          return false;
        }
        if (minReputation > 0 && l.onchain.reputationScore < minReputation) {
          recordRejection("reputation", l.walletAddress);
          return false;
        }
        if (maxPerCallUsd > 0 && l.capabilities && l.capabilities.perCallUsd > maxPerCallUsd) {
          recordRejection("cost", l.walletAddress);
          return false;
        }
        if (requiredCapabilities.length > 0) {
          const specialistCapabilities = l.capabilities?.runtime_capabilities ?? [];
          if (!requiredCapabilities.every((cap) => specialistCapabilities.includes(cap))) {
            recordRejection("capabilities", l.walletAddress);
            return false;
          }
        }
        if (!l.health.endpointUrl) {
          recordRejection("endpoint", l.walletAddress);
          return false;
        }
        if (requiredAttestorCheckpoints.length > 0) {
          const checkpoints = l.capabilities?.attestor_checkpoints ?? [];
          if (!requiredAttestorCheckpoints.every((checkpoint) => checkpoints.includes(checkpoint))) {
            recordRejection("disclosure", l.walletAddress);
            return false;
          }
        }
        if (requiredQualityClaims.length > 0) {
          const qualityClaims = l.capabilities?.quality_claims ?? [];
          if (!requiredQualityClaims.every((claim) => qualityClaims.includes(claim))) {
            recordRejection("disclosure", l.walletAddress);
            return false;
          }
        }
        return true;
      });

    const candidates = eligibleListings
      .map(({ listing: l, sourceDecision }) => {
        const reasons: string[] = [];
        const sourceDecisionTrace = [
          `source:requested=${sourceDecision.requestedSource ?? "none"}`,
          `source:candidate=${sourceDecision.listingSource ?? "unknown"}`,
          `source:strict=${strictSourceMatch}`,
          `source:score_delta=${sourceDecision.scoreDelta}`,
          ...sourceDecision.reasons,
        ];
        if (l.attestation.attested) reasons.push("attested");
        if (l.health.status === "pass") reasons.push("online");
        if (l.signals.feedbackCount > 0) reasons.push(`feedback:${l.signals.avgFeedbackScore.toFixed(1)}`);
        if (l.capabilities?.privacyModes.includes(preferredPrivacyMode as never)) {
          reasons.push(`supports:${preferredPrivacyMode}`);
        }
        if (requiredCapabilities.length > 0) {
          reasons.push(`requires:${requiredCapabilities.join(",")}`);
        }
        if (requiredAttestorCheckpoints.length > 0) {
          reasons.push(`requires:attestor_checkpoints=${requiredAttestorCheckpoints.join(",")}`);
        }
        if (requiredQualityClaims.length > 0) {
          reasons.push(`requires:quality_claims=${requiredQualityClaims.join(",")}`);
        }
        reasons.push(...sourceDecision.reasons);
        const score =
          (l.attestation.attested ? 30 : 0) +
          (l.health.status === "pass" ? 20 : 0) +
          Math.min(l.signals.avgFeedbackScore * 5, 25) +
          Math.min(l.onchain.reputationScore * 0.1, 15) +
          (l.capabilities?.privacyModes.includes(preferredPrivacyMode as never) ? 10 : 0) +
          sourceDecision.scoreDelta;

        return { listing: l, score, reasons, sourceDecision, sourceDecisionTrace };
      })
      .sort((a, b) => {
        if (sortBy === "reputation") {
          return b.listing.onchain.reputationScore - a.listing.onchain.reputationScore;
        }
        if (sortBy === "cost") {
          const aCost = a.listing.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
          const bCost = b.listing.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
          return aCost - bCost;
        }
        if (sortBy === "feedback") {
          return b.listing.signals.avgFeedbackScore - a.listing.signals.avgFeedbackScore;
        }

        if (a.score !== b.score) return b.score - a.score;
        if (a.listing.ranking_score !== b.listing.ranking_score) {
          return b.listing.ranking_score - a.listing.ranking_score;
        }
        const aFreshness = Date.parse(a.listing.health.lastCheckedAt ?? "");
        const bFreshness = Date.parse(b.listing.health.lastCheckedAt ?? "");
        const safeA = Number.isFinite(aFreshness) ? aFreshness : -1;
        const safeB = Number.isFinite(bFreshness) ? bFreshness : -1;
        if (safeA !== safeB) return safeB - safeA;
        const aCost = a.listing.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
        const bCost = b.listing.capabilities?.perCallUsd ?? Number.POSITIVE_INFINITY;
        return aCost - bCost;
      });

    const resolveDiagnostics = {
      totalListings: listings.length,
      acceptedCount: candidates.length,
      rejectedBy: rejectionSummary,
      rejectedWalletSamples,
    };

    if (candidates.length === 0) {
      const output: ResolveOutput = {
        ok: false,
        candidate: null,
        alternativeCount: 0,
        appliedFilters,
        resolveDiagnostics,
        error: "No eligible specialists found matching your policy.",
      };
      return Response.json(output, { status: 400 });
    }

    const best = candidates[0];
    const l = best.listing;
    const endpointUrl = l.health.endpointUrl ?? "";
    const alternatives = candidates.slice(1, 4).map((candidate) => ({
      walletAddress: candidate.listing.walletAddress,
      endpointUrl: candidate.listing.health.endpointUrl ?? "",
      score: candidate.score,
      selectionReasons: candidate.reasons,
      sourceRouting: {
        requestedSource: candidate.sourceDecision.requestedSource,
        candidateSource: candidate.sourceDecision.listingSource,
        strictSourceMatch,
        scoreDelta: candidate.sourceDecision.scoreDelta,
        decisionTrace: candidate.sourceDecisionTrace,
      },
    }));

    const output: ResolveOutput = {
      ok: true,
      candidate: {
        walletAddress: l.walletAddress,
        endpointUrl: endpointUrl as string,
        taskTypes: l.capabilities?.taskTypes ?? [],
        privacyModes: l.capabilities?.privacyModes ?? [],
        perCallUsd: l.capabilities?.perCallUsd ?? 0,
        attested: l.attestation.attested,
        healthStatus: l.health.status,
        reputationScore: l.onchain.reputationScore,
        avgFeedbackScore: l.signals.avgFeedbackScore,
        selectionReasons: best.reasons,
        sourceRouting: {
          requestedSource: best.sourceDecision.requestedSource,
          candidateSource: best.sourceDecision.listingSource,
          strictSourceMatch,
          scoreDelta: best.sourceDecision.scoreDelta,
          decisionTrace: best.sourceDecisionTrace,
        },
      },
      alternativeCount: candidates.length - 1,
      alternatives,
      appliedFilters,
      resolveDiagnostics,
    };

    return Response.json(output);
  } catch (error) {
    return Response.json(
      { ok: false, candidate: null, alternativeCount: 0, error: error instanceof Error ? error.message : "Resolve failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    tool: "resolve_specialist",
    description: "Find the best specialist candidate for a task.",
    schema: {
      input: {
        task: "string",
        taskTypeHint: "string?",
        required_capabilities: "string[]?",
        required_attestor_checkpoints: "string[]?",
        required_quality_claims: "string[]?",
        sortBy: "ranking|reputation|cost|feedback?",
        taskType: "string?",
        inputMode: "string?",
        privacyMode: "string?",
        runtimeCap: "string?",
        attested: "boolean?",
        health: "pass|fail|pending?",
        tag: "string?",
        tags: "string[]?",
        policy: "PolicyOverride?",
      },
      output: {
        ok: "boolean",
        candidate: "SpecialistCandidate | null",
        alternativeCount: "number",
        appliedFilters: "AppliedFilters?",
        alternatives: "SpecialistAlternative[]",
        resolveDiagnostics: "ResolveDiagnostics",
      },
    },
  });
}
