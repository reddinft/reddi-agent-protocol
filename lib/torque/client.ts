import { getTorqueConfig, isTorqueEnabled } from "./config";
import type { TorqueEventPayload } from "./events";

export interface LeaderboardEntry {
  userPubkey: string;
  rank: number;
  value: number;
  rewards?: number;
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
  if (!isTorqueEnabled()) return [];

  const config = getTorqueConfig();
  const id = campaignId ?? config.leaderboardCampaignId;
  if (!id) return [];

  try {
    const res = await fetch(`${config.apiBase}/v1/campaigns/${id}/leaderboard`, {
      headers: { Authorization: `Bearer ${config.apiToken}` },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.entries ?? [];
  } catch {
    return [];
  }
}

