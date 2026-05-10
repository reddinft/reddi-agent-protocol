import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getTorqueConfig, isTorqueEnabled } from "./config";
import type { TorqueEventPayload } from "./events";

export interface LeaderboardEntry {
  userPubkey: string;
  rank: number;
  value: number;
  rewards?: number;
  source?: "torque" | "protocol-simulation";
  components?: {
    completedJobs: number;
    averageRating: number;
    attestationAgreements: number;
  };
}

type SpecialistIndexRecord = {
  walletAddress?: string;
  routingSignals?: {
    feedbackCount?: number;
    avgFeedbackScore?: number;
    attestationAgreements?: number;
  };
};

function getProtocolSimulationLeaderboard(): LeaderboardEntry[] {
  const path = join(process.cwd(), "data", "onboarding", "specialist-index.json");
  if (!existsSync(path)) return [];

  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as SpecialistIndexRecord[];
    return raw
      .filter((entry) => entry.walletAddress && (entry.routingSignals?.feedbackCount ?? 0) > 0)
      .map((entry) => {
        const completedJobs = entry.routingSignals?.feedbackCount ?? 0;
        const averageRating = entry.routingSignals?.avgFeedbackScore ?? 0;
        const attestationAgreements = entry.routingSignals?.attestationAgreements ?? 0;
        return {
          userPubkey: entry.walletAddress!,
          rank: 0,
          value: completedJobs,
          rewards: 0,
          source: "protocol-simulation" as const,
          components: { completedJobs, averageRating, attestationAgreements },
        };
      })
      .sort((a, b) => b.value - a.value || (b.components?.averageRating ?? 0) - (a.components?.averageRating ?? 0))
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  } catch {
    return [];
  }
}

export async function emitTorqueEvent(payload: TorqueEventPayload): Promise<void> {
  if (!isTorqueEnabled()) return;

  const config = getTorqueConfig();
  try {
    await fetch(`${config.apiBase}/v1/events/custom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiToken}`,
      },
      body: JSON.stringify({
        projectId: config.projectId,
        userPubkey: payload.userPubkey,
        eventName: payload.eventName,
        fields: payload.fields,
      }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Torque is non-critical — never throw, never block protocol flow
  }
}

export async function getLeaderboard(campaignId?: string): Promise<LeaderboardEntry[]> {
  if (!isTorqueEnabled()) return getProtocolSimulationLeaderboard();

  const config = getTorqueConfig();
  const id = campaignId ?? config.leaderboardCampaignId;
  if (!id) return getProtocolSimulationLeaderboard();

  try {
    const res = await fetch(`${config.apiBase}/v1/campaigns/${id}/leaderboard`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return getProtocolSimulationLeaderboard();
    const data = await res.json();
    const entries = data.entries ?? [];
    if (entries.length === 0) return getProtocolSimulationLeaderboard();
    return entries.map((entry: LeaderboardEntry) => ({ ...entry, source: entry.source ?? "torque" }));
  } catch {
    return getProtocolSimulationLeaderboard();
  }
}

