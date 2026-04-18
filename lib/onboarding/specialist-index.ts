import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { CapabilityInput } from "@/lib/onboarding/capabilities";

export type SpecialistIndexEntry = {
  walletAddress: string;
  updatedAt: string;
  endpointUrl?: string;
  healthcheckStatus?: "pending" | "pass" | "fail";
  attested?: boolean;
  capabilityHash?: string;
  capabilities: CapabilityInput;
  routingSignals?: {
    feedbackCount: number;
    avgFeedbackScore: number;
    attestationAgreements: number;
    attestationDisagreements: number;
    lastFeedbackAt?: string;
  };
  last_seen_at?: string;
  health_streak?: number;
  ranking_score?: number;
  reputation_score?: number;
};

const INDEX_PATH = join(process.cwd(), "data", "onboarding", "specialist-index.json");

function emptyCapabilities(): CapabilityInput {
  return {
    taskTypes: [],
    inputModes: [],
    outputModes: [],
    privacyModes: [],
    pricing: { baseUsd: 0, perCallUsd: 0 },
    tags: [],
    context_requirements: [],
    runtime_capabilities: [],
  };
}

function normalizeRecords(raw: unknown): SpecialistIndexEntry[] {
  if (Array.isArray(raw)) {
    return raw as SpecialistIndexEntry[];
  }

  if (raw && typeof raw === "object") {
    const specialists = (raw as { specialists?: unknown }).specialists;
    if (Array.isArray(specialists)) {
      return specialists as SpecialistIndexEntry[];
    }
  }

  return [];
}

function readAll(): SpecialistIndexEntry[] {
  try {
    return normalizeRecords(JSON.parse(readFileSync(INDEX_PATH, "utf8")));
  } catch {
    return [];
  }
}

function writeAll(records: SpecialistIndexEntry[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(records, null, 2));
}

export function computeSpecialistRankingScore(input: {
  reputationScore: number;
  healthStreak: number;
  attested: boolean;
  feedbackAvg: number;
}) {
  const healthStreakNormalized = Math.min(Math.max(input.healthStreak, 0) / 10, 1);
  const attestationBonus = input.attested ? 1 : 0;
  const score =
    (Number(input.reputationScore) * 0.4) +
    (healthStreakNormalized * 0.3) +
    (attestationBonus * 0.2) +
    (Number(input.feedbackAvg) * 0.1);

  return Number(score.toFixed(4));
}

function nextHealthState(existing: SpecialistIndexEntry | undefined, status?: "pending" | "pass" | "fail") {
  if (!status) {
    return {
      last_seen_at: existing?.last_seen_at,
      health_streak: existing?.health_streak ?? 0,
    };
  }

  if (status === "pass") {
    const nextStreak = existing?.healthcheckStatus === "pass"
      ? (existing?.health_streak ?? 0) + 1
      : 1;

    return {
      last_seen_at: new Date().toISOString(),
      health_streak: nextStreak,
    };
  }

  return {
    last_seen_at: new Date().toISOString(),
    health_streak: 0,
  };
}

function recomputeRankingScore(entry: SpecialistIndexEntry) {
  return computeSpecialistRankingScore({
    reputationScore: entry.reputation_score ?? 0,
    healthStreak: entry.health_streak ?? 0,
    attested: entry.attested ?? false,
    feedbackAvg: entry.routingSignals?.avgFeedbackScore ?? 0,
  });
}

function mergeEntry(
  existing: SpecialistIndexEntry | undefined,
  walletAddress: string,
  capabilities: CapabilityInput,
  meta?: {
    endpointUrl?: string;
    healthcheckStatus?: "pending" | "pass" | "fail";
    attested?: boolean;
    capabilityHash?: string;
    reputationScore?: number;
  }
): SpecialistIndexEntry {
  const now = new Date().toISOString();
  const healthState = nextHealthState(existing, meta?.healthcheckStatus);
  const record: SpecialistIndexEntry = {
    walletAddress,
    updatedAt: now,
    endpointUrl: meta?.endpointUrl ?? existing?.endpointUrl,
    healthcheckStatus: meta?.healthcheckStatus ?? existing?.healthcheckStatus,
    attested: meta?.attested ?? existing?.attested,
    capabilityHash: meta?.capabilityHash ?? existing?.capabilityHash,
    capabilities,
    routingSignals: existing?.routingSignals ?? {
      feedbackCount: 0,
      avgFeedbackScore: 0,
      attestationAgreements: 0,
      attestationDisagreements: 0,
      lastFeedbackAt: undefined,
    },
    last_seen_at: healthState.last_seen_at,
    health_streak: healthState.health_streak,
    ranking_score: existing?.ranking_score ?? 0,
    reputation_score: meta?.reputationScore ?? existing?.reputation_score ?? 0,
  };

  record.ranking_score = recomputeRankingScore(record);
  return record;
}

export function upsertSpecialistIndex(
  walletAddress: string,
  capabilities: CapabilityInput,
  meta?: {
    endpointUrl?: string;
    healthcheckStatus?: "pending" | "pass" | "fail";
    attested?: boolean;
    capabilityHash?: string;
    reputationScore?: number;
  }
) {
  const records = readAll();
  const idx = records.findIndex((r) => r.walletAddress === walletAddress);
  const existing = idx >= 0 ? records[idx] : undefined;
  const next = mergeEntry(existing, walletAddress, capabilities, meta);

  if (idx >= 0) {
    records[idx] = next;
  } else {
    records.push(next);
  }

  writeAll(records);

  return {
    ok: true,
    entry: next,
    storagePath: INDEX_PATH,
  };
}

export function updateSpecialistHealthcheck(
  walletAddress: string,
  input: {
    endpointUrl?: string;
    healthcheckStatus: "pending" | "pass" | "fail";
    reputationScore?: number;
    attested?: boolean;
  }
) {
  const records = readAll();
  const idx = records.findIndex((r) => r.walletAddress === walletAddress);
  const existing = idx >= 0 ? records[idx] : undefined;
  const next = mergeEntry(existing, walletAddress, existing?.capabilities ?? emptyCapabilities(), {
    endpointUrl: input.endpointUrl,
    healthcheckStatus: input.healthcheckStatus,
    attested: input.attested,
    reputationScore: input.reputationScore,
    capabilityHash: existing?.capabilityHash,
  });

  if (idx >= 0) {
    records[idx] = next;
  } else {
    records.push(next);
  }

  writeAll(records);

  return {
    ok: true,
    entry: next,
    storagePath: INDEX_PATH,
  };
}

export function listSpecialistIndex() {
  return {
    ok: true,
    results: readAll(),
    storagePath: INDEX_PATH,
  };
}

export function applyPlannerFeedback(
  walletAddress: string,
  input: {
    score: number;
    agreesWithAttestation?: boolean;
    at?: string;
  }
) {
  const records = readAll();
  const idx = records.findIndex((r) => r.walletAddress === walletAddress);
  if (idx < 0) {
    throw new Error("Specialist not found in index.");
  }

  const record = records[idx];
  const current = record.routingSignals || {
    feedbackCount: 0,
    avgFeedbackScore: 0,
    attestationAgreements: 0,
    attestationDisagreements: 0,
    lastFeedbackAt: undefined,
  };

  const nextCount = current.feedbackCount + 1;
  const nextAvg = (current.avgFeedbackScore * current.feedbackCount + input.score) / nextCount;

  record.routingSignals = {
    feedbackCount: nextCount,
    avgFeedbackScore: Number(nextAvg.toFixed(4)),
    attestationAgreements:
      current.attestationAgreements + (input.agreesWithAttestation === true ? 1 : 0),
    attestationDisagreements:
      current.attestationDisagreements + (input.agreesWithAttestation === false ? 1 : 0),
    lastFeedbackAt: input.at || new Date().toISOString(),
  };

  record.updatedAt = new Date().toISOString();
  record.ranking_score = recomputeRankingScore(record);
  records[idx] = record;
  writeAll(records);

  return {
    ok: true,
    entry: record,
    storagePath: INDEX_PATH,
  };
}
