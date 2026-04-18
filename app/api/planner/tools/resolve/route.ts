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

    const maxPerCallUsd =
      policyOverride.maxPerCallUsd ?? savedPolicy.maxPerTaskUsd ?? 0;
    const requireAttestation =
      policyOverride.requireAttestation ?? savedPolicy.requireAttestation ?? false;
    const minReputation =
      policyOverride.minReputation ?? savedPolicy.minReputation ?? 0;
    const preferredPrivacyMode =
      policyOverride.preferredPrivacyMode ?? savedPolicy.preferredPrivacyMode ?? "public";

    const { listings } = await fetchSpecialistListings();

    // Filter and score candidates
    const candidates = listings
      .filter((l) => {
        if (l.health.status === "fail") return false;
        if (requireAttestation && !l.attestation.attested) return false;
        if (minReputation > 0 && l.onchain.reputationScore < minReputation) return false;
        if (maxPerCallUsd > 0 && l.capabilities && l.capabilities.perCallUsd > maxPerCallUsd) return false;
        if (requiredCapabilities.length > 0) {
          const specialistCapabilities = l.capabilities?.runtime_capabilities ?? [];
          if (!requiredCapabilities.every((cap) => specialistCapabilities.includes(cap))) return false;
        }
        if (!l.health.endpointUrl) return false;
        return true;
      })
      .map((l) => {
        const reasons: string[] = [];
        if (l.attestation.attested) reasons.push("attested");
        if (l.health.status === "pass") reasons.push("online");
        if (l.signals.feedbackCount > 0) reasons.push(`feedback:${l.signals.avgFeedbackScore.toFixed(1)}`);
        if (l.capabilities?.privacyModes.includes(preferredPrivacyMode as never)) {
          reasons.push(`supports:${preferredPrivacyMode}`);
        }
        if (requiredCapabilities.length > 0) {
          reasons.push(`requires:${requiredCapabilities.join(",")}`);
        }
        const score =
          (l.attestation.attested ? 30 : 0) +
          (l.health.status === "pass" ? 20 : 0) +
          Math.min(l.signals.avgFeedbackScore * 5, 25) +
          Math.min(l.onchain.reputationScore * 0.1, 15) +
          (l.capabilities?.privacyModes.includes(preferredPrivacyMode as never) ? 10 : 0);

        return { listing: l, score, reasons };
      })
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      const output: ResolveOutput = {
        ok: false,
        candidate: null,
        alternativeCount: 0,
        error: "No eligible specialists found matching your policy.",
      };
      return Response.json(output, { status: 400 });
    }

    const best = candidates[0];
    const l = best.listing;
    const endpointUrl = l.health.endpointUrl ?? "";

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
      },
      alternativeCount: candidates.length - 1,
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
      input: { task: "string", taskTypeHint: "string?", required_capabilities: "string[]?", policy: "PolicyOverride?" },
      output: { ok: "boolean", candidate: "SpecialistCandidate | null", alternativeCount: "number" },
    },
  });
}
