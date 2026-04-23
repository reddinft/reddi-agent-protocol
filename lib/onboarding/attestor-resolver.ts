import "server-only";

import { fetchSpecialistListings } from "@/lib/registry/bridge";

export type ResolveAttestorInput = {
  taskTypeHint?: string;
  minAttestationAccuracy?: number;
  maxPerCallUsd?: number;
};

export async function resolveAttestor(input: ResolveAttestorInput) {
  const { listings } = await fetchSpecialistListings();

  const filtered = listings
    .filter((l) => l.health.status !== "fail")
    .filter((l) => l.attestation.attested)
    .filter((l) => {
      if (typeof input.minAttestationAccuracy !== "number") return true;
      return l.onchain.attestationAccuracy >= input.minAttestationAccuracy;
    })
    .filter((l) => {
      if (typeof input.maxPerCallUsd !== "number") return true;
      const cost = l.capabilities?.perCallUsd;
      return typeof cost === "number" && cost <= input.maxPerCallUsd;
    })
    .map((l) => {
      const reasons: string[] = ["attested", `accuracy:${l.onchain.attestationAccuracy}`];
      if (l.health.status === "pass") reasons.push("health:pass");
      if (typeof l.capabilities?.perCallUsd === "number") reasons.push(`cost:${l.capabilities.perCallUsd}`);
      if (input.taskTypeHint && l.capabilities?.taskTypes.includes(input.taskTypeHint as never)) {
        reasons.push(`task-fit:${input.taskTypeHint}`);
      }

      const score =
        (l.health.status === "pass" ? 30 : 10) +
        l.onchain.attestationAccuracy * 2 +
        Math.min(l.signals.avgFeedbackScore * 5, 20) +
        (input.taskTypeHint && l.capabilities?.taskTypes.includes(input.taskTypeHint as never) ? 20 : 0);

      return {
        walletAddress: l.walletAddress,
        endpointUrl: l.health.endpointUrl,
        attestationAccuracy: l.onchain.attestationAccuracy,
        avgFeedbackScore: l.signals.avgFeedbackScore,
        perCallUsd: l.capabilities?.perCallUsd,
        reasons,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    ok: filtered.length > 0,
    candidate: filtered[0] ?? null,
    alternatives: filtered.slice(1),
    count: filtered.length,
    error: filtered.length > 0 ? undefined : "No eligible attestors found.",
  };
}
