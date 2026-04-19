import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type ConsumerProfile = {
  walletAddress: string;
  createdAt: string;
  updatedAt: string;
  preferredIntegration?: "mcp" | "tools" | "skills";
  metadata?: {
    agentName?: string;
    framework?: string;
  };
  reputation: {
    score5: number;
    baseline5: number;
    totalRatings: number;
    lastRatingAt?: string;
  };
};

const CONSUMER_REGISTRY_PATH = join(process.cwd(), "data", "onboarding", "consumer-index.json");

function readAll(): ConsumerProfile[] {
  try {
    return JSON.parse(readFileSync(CONSUMER_REGISTRY_PATH, "utf8")) as ConsumerProfile[];
  } catch {
    return [];
  }
}

function writeAll(records: ConsumerProfile[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(CONSUMER_REGISTRY_PATH, JSON.stringify(records, null, 2));
}

export function registerConsumer(input: {
  walletAddress: string;
  preferredIntegration?: "mcp" | "tools" | "skills";
  metadata?: { agentName?: string; framework?: string };
}) {
  const wallet = input.walletAddress?.trim();
  if (!wallet || wallet.length < 32) {
    throw new Error("Valid consumer wallet address is required.");
  }

  const now = new Date().toISOString();
  const records = readAll();
  const existingIdx = records.findIndex((r) => r.walletAddress === wallet);

  if (existingIdx >= 0) {
    const updated: ConsumerProfile = {
      ...records[existingIdx],
      preferredIntegration: input.preferredIntegration ?? records[existingIdx].preferredIntegration,
      metadata: {
        ...records[existingIdx].metadata,
        ...input.metadata,
      },
      updatedAt: now,
      reputation: records[existingIdx].reputation ?? {
        score5: 3,
        baseline5: 3,
        totalRatings: 0,
      },
    };
    records[existingIdx] = updated;
    writeAll(records);
    return {
      ok: true,
      alreadyRegistered: true,
      profile: updated,
      storagePath: CONSUMER_REGISTRY_PATH,
    };
  }

  const profile: ConsumerProfile = {
    walletAddress: wallet,
    createdAt: now,
    updatedAt: now,
    preferredIntegration: input.preferredIntegration,
    metadata: input.metadata,
    reputation: {
      score5: 3,
      baseline5: 3,
      totalRatings: 0,
    },
  };

  records.push(profile);
  writeAll(records);

  return {
    ok: true,
    alreadyRegistered: false,
    profile,
    storagePath: CONSUMER_REGISTRY_PATH,
  };
}

export function applyConsumerRating(input: {
  walletAddress: string;
  score10: number;
  ratedAt?: string;
}) {
  const wallet = input.walletAddress?.trim();
  if (!wallet || wallet.length < 32) {
    throw new Error("Valid consumer wallet address is required for rating update.");
  }
  if (!Number.isFinite(input.score10) || input.score10 < 1 || input.score10 > 10) {
    throw new Error("score10 must be between 1 and 10.");
  }

  const now = input.ratedAt ?? new Date().toISOString();
  const score5 = input.score10 / 2;
  const records = readAll();
  const idx = records.findIndex((r) => r.walletAddress === wallet);

  if (idx < 0) {
    const created: ConsumerProfile = {
      walletAddress: wallet,
      createdAt: now,
      updatedAt: now,
      reputation: {
        score5: 3,
        baseline5: 3,
        totalRatings: 0,
      },
    };
    records.push(created);
  }

  const current = records.find((r) => r.walletAddress === wallet)!;
  const currentReputation = current.reputation ?? {
    score5: 3,
    baseline5: 3,
    totalRatings: 0,
  };

  const nextTotal = currentReputation.totalRatings + 1;
  const nextScore = ((currentReputation.score5 * currentReputation.totalRatings) + score5) / nextTotal;

  const updated: ConsumerProfile = {
    ...current,
    updatedAt: now,
    reputation: {
      score5: Number(nextScore.toFixed(3)),
      baseline5: 3,
      totalRatings: nextTotal,
      lastRatingAt: now,
    },
  };

  const updatedIdx = records.findIndex((r) => r.walletAddress === wallet);
  records[updatedIdx] = updated;
  writeAll(records);

  return {
    ok: true,
    profile: updated,
    storagePath: CONSUMER_REGISTRY_PATH,
  };
}

export function listConsumers() {
  return {
    ok: true,
    results: readAll(),
    storagePath: CONSUMER_REGISTRY_PATH,
  };
}
