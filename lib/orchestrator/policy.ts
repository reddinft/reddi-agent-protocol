import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { TaskTypeId, PrivacyModeId } from "@/lib/capabilities/taxonomy";

export type OrchestratorPolicy = {
  /** Whether the specialist marketplace is enabled for planning */
  enabled: boolean;
  /** Max spend per individual task call in USD */
  maxPerTaskUsd: number;
  /** Max total spend per day in USD (0 = unlimited) */
  dailyBudgetUsd: number;
  /** Only dispatch to specialists offering these task types (empty = all) */
  allowedTaskTypes: TaskTypeId[];
  /** Minimum reputation score (0 = any) */
  minReputation: number;
  /** Whether attestation is required */
  requireAttestation: boolean;
  /** Preferred privacy mode */
  preferredPrivacyMode: PrivacyModeId;
  /** Fallback behaviour when no candidate passes policy */
  fallbackMode: "skip" | "error" | "local";
  /** Last updated timestamp */
  updatedAt: string;
};

export const DEFAULT_POLICY: OrchestratorPolicy = {
  enabled: false,
  maxPerTaskUsd: 0.10,
  dailyBudgetUsd: 1.00,
  allowedTaskTypes: [],
  minReputation: 0,
  requireAttestation: false,
  preferredPrivacyMode: "public",
  fallbackMode: "skip",
  updatedAt: new Date().toISOString(),
};

const POLICY_PATH = join(process.cwd(), "data", "orchestrator", "policy.json");

function ensureDir() {
  mkdirSync(join(process.cwd(), "data", "orchestrator"), { recursive: true });
}

export function readPolicy(): OrchestratorPolicy {
  try {
    return JSON.parse(readFileSync(POLICY_PATH, "utf8")) as OrchestratorPolicy;
  } catch {
    return { ...DEFAULT_POLICY };
  }
}

export function writePolicy(policy: OrchestratorPolicy) {
  ensureDir();
  writeFileSync(POLICY_PATH, JSON.stringify(policy, null, 2));
}

export function updatePolicy(patch: Partial<OrchestratorPolicy>): OrchestratorPolicy {
  const current = readPolicy();
  const updated: OrchestratorPolicy = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writePolicy(updated);
  return updated;
}

// ── Spend tracker ─────────────────────────────────────────────────────────────

type SpendRecord = {
  date: string; // YYYY-MM-DD
  totalUsd: number;
  runCount: number;
};

const SPEND_PATH = join(process.cwd(), "data", "orchestrator", "spend.json");

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function readTodaySpend(): SpendRecord {
  try {
    const all = JSON.parse(readFileSync(SPEND_PATH, "utf8")) as SpendRecord[];
    return all.find((r) => r.date === todayKey()) ?? { date: todayKey(), totalUsd: 0, runCount: 0 };
  } catch {
    return { date: todayKey(), totalUsd: 0, runCount: 0 };
  }
}

export function recordSpend(amountUsd: number) {
  ensureDir();
  let all: SpendRecord[] = [];
  try {
    all = JSON.parse(readFileSync(SPEND_PATH, "utf8")) as SpendRecord[];
  } catch { /* first write */ }

  const key = todayKey();
  const idx = all.findIndex((r) => r.date === key);
  if (idx >= 0) {
    all[idx].totalUsd += amountUsd;
    all[idx].runCount += 1;
  } else {
    all.push({ date: key, totalUsd: amountUsd, runCount: 1 });
  }
  // Keep last 30 days
  all = all.slice(-30);
  writeFileSync(SPEND_PATH, JSON.stringify(all, null, 2));
}

export function readSpendHistory(): SpendRecord[] {
  try {
    return JSON.parse(readFileSync(SPEND_PATH, "utf8")) as SpendRecord[];
  } catch { return []; }
}
