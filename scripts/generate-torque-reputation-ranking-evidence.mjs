#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const explicitOutDir = process.argv[2];
const stamp = process.env.TORQUE_EVIDENCE_STAMP
  ?? (explicitOutDir ? explicitOutDir.split(/[\\/]/).filter(Boolean).at(-1) : null)
  ?? new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = explicitOutDir ?? join("artifacts", "torque-reputation-ranking", stamp);

const specialists = [
  {
    profileId: "verification-validation-agent",
    displayName: "Verification & Validation Agent",
    wallet: "2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq",
    completedJobs: 7,
    averageRating: 4.86,
    onboardingMilestones: 1,
  },
  {
    profileId: "code-generation-agent",
    displayName: "Code Generation Agent",
    wallet: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
    completedJobs: 5,
    averageRating: 4.72,
    onboardingMilestones: 1,
  },
  {
    profileId: "document-intelligence-agent",
    displayName: "Document Intelligence Agent",
    wallet: "13CgDqa8K3Mw8iaoUVahbJUmKyQRrUmCRM259NC8Dmy",
    completedJobs: 4,
    averageRating: 4.65,
    onboardingMilestones: 1,
  },
];

function scoreFor(specialist) {
  return Number((specialist.completedJobs * 100 + specialist.averageRating * 20 + specialist.onboardingMilestones * 10).toFixed(2));
}

const eventLedger = specialists.flatMap((specialist) => [
  {
    userPubkey: specialist.wallet,
    eventName: "specialist_job_completed",
    fields: {
      profileId: specialist.profileId,
      completedJobs: specialist.completedJobs,
      settlementMode: "direct",
      source: "lib/onboarding/x402-settlement.ts",
    },
  },
  {
    userPubkey: specialist.wallet,
    eventName: "rating_submitted",
    fields: {
      profileId: specialist.profileId,
      averageRating: specialist.averageRating,
      source: "lib/onboarding/reputation-signal.ts",
    },
  },
  {
    userPubkey: specialist.wallet,
    eventName: "onboarding_completed",
    fields: {
      profileId: specialist.profileId,
      source: "lib/onboarding/torque-onboarding.ts",
    },
  },
]);

const leaderboard = specialists
  .map((specialist) => ({
    profileId: specialist.profileId,
    displayName: specialist.displayName,
    userPubkey: specialist.wallet,
    value: scoreFor(specialist),
    components: {
      completedJobs: specialist.completedJobs,
      averageRating: specialist.averageRating,
      onboardingMilestones: specialist.onboardingMilestones,
    },
  }))
  .sort((a, b) => b.value - a.value)
  .map((entry, index) => ({ ...entry, rank: index + 1 }));

const summary = {
  schemaVersion: "reddi.torque.reputation-ranking-evidence.v1",
  generatedAt: new Date().toISOString(),
  proofStatus: "deterministic-sandbox-evidence",
  claimBoundary: {
    safeClaim:
      "Reddi Agent Protocol converts protocol activity into Torque-compatible reputation and retention signals: specialist completions, submitted ratings, and onboarding milestones feed leaderboard/ranking evidence.",
    notClaimed: [
      "live production Torque rewards campaign",
      "paid incentives distributed through Torque",
      "sponsor-side campaign launch or mainnet reward settlement",
    ],
  },
  implementationEvidence: [
    "lib/torque/events.ts",
    "lib/torque/client.ts",
    "lib/onboarding/x402-settlement.ts",
    "lib/onboarding/reputation-signal.ts",
    "lib/onboarding/torque-onboarding.ts",
    "app/leaderboard/page.tsx",
    "app/api/torque/event/route.ts",
    "app/api/torque/leaderboard/route.ts",
    "docs/TORQUE-BDD-FEATURE-MAP.md",
  ],
  validationCommands: [
    "npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand",
    "npx playwright test e2e/leaderboard.spec.ts",
  ],
  eventLedger,
  leaderboard,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "SUMMARY.json"), `${JSON.stringify(summary, null, 2)}\n`);

const md = `# Torque Reputation Ranking Evidence — ${stamp}

## Verdict

Deterministic sandbox evidence is generated for the Torque reputation-ranking story.

Safe claim:

> ${summary.claimBoundary.safeClaim}

Do not claim:

${summary.claimBoundary.notClaimed.map((item) => `- ${item}`).join("\n")}

## Ranking formula used for this evidence

\`score = completedJobs * 100 + averageRating * 20 + onboardingMilestones * 10\`

This is a deterministic recording artifact that mirrors the product story; it is not a live rewards-campaign receipt.

## Leaderboard

${leaderboard
  .map(
    (entry) =>
      `${entry.rank}. ${entry.displayName} (${entry.profileId}) — score ${entry.value}; jobs ${entry.components.completedJobs}; avg rating ${entry.components.averageRating}; wallet ${entry.userPubkey}`,
  )
  .join("\n")}

## Torque-compatible event evidence

${eventLedger
  .map(
    (event) =>
      `- ${event.eventName} → ${event.userPubkey} (${event.fields.profileId}); source ${event.fields.source}`,
  )
  .join("\n")}

## Implementation evidence

${summary.implementationEvidence.map((path) => `- ${path}`).join("\n")}

## Validation

Run:

\`npx jest lib/__tests__/torque-client.test.ts lib/__tests__/torque-event-route.test.ts lib/__tests__/torque-leaderboard-route.test.ts lib/__tests__/torque-onboarding-event.test.ts --runInBand\`

Optional UI check:

\`npx playwright test e2e/leaderboard.spec.ts\`
`;

writeFileSync(join(outDir, "SUMMARY.md"), md);
console.log(JSON.stringify({ ok: true, outDir, leaderboardEntries: leaderboard.length, events: eventLedger.length }, null, 2));
