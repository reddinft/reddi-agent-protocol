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
};

const INDEX_PATH = join(process.cwd(), "data", "onboarding", "specialist-index.json");

function readAll(): SpecialistIndexEntry[] {
  try {
    return JSON.parse(readFileSync(INDEX_PATH, "utf8")) as SpecialistIndexEntry[];
  } catch {
    return [];
  }
}

function writeAll(records: SpecialistIndexEntry[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(INDEX_PATH, JSON.stringify(records, null, 2));
}

export function upsertSpecialistIndex(
  walletAddress: string,
  capabilities: CapabilityInput,
  meta?: {
    endpointUrl?: string;
    healthcheckStatus?: "pending" | "pass" | "fail";
    attested?: boolean;
    capabilityHash?: string;
  }
) {
  const records = readAll();
  const next: SpecialistIndexEntry = {
    walletAddress,
    updatedAt: new Date().toISOString(),
    endpointUrl: meta?.endpointUrl,
    healthcheckStatus: meta?.healthcheckStatus,
    attested: meta?.attested,
    capabilityHash: meta?.capabilityHash,
    capabilities,
  };

  const idx = records.findIndex((r) => r.walletAddress === walletAddress);
  if (idx >= 0) {
    records[idx] = {
      ...records[idx],
      ...next,
    };
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
  records[idx] = record;
  writeAll(records);

  return {
    ok: true,
    entry: record,
    storagePath: INDEX_PATH,
  };
}
