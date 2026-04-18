export function getTorqueConfig() {
  return {
    apiToken: process.env.TORQUE_API_TOKEN ?? null,
    projectId: process.env.TORQUE_PROJECT_ID ?? null,
    leaderboardCampaignId: process.env.TORQUE_LEADERBOARD_CAMPAIGN_ID ?? null,
    rebateCampaignId: process.env.TORQUE_REBATE_CAMPAIGN_ID ?? null,
    apiBase: process.env.TORQUE_API_BASE ?? "https://api.torque.so",
  };
}

export function isTorqueEnabled(): boolean {
  return !!process.env.TORQUE_API_TOKEN;
}

