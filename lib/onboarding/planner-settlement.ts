import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

type PlannerRunSettlementState =
  | "pending_evaluation"
  | "released"
  | "disputed"
  | "not_required";

type PlannerRunRecordLike = {
  runId: string;
  paymentSatisfied?: boolean;
  settlementState?: PlannerRunSettlementState;
  settlementDecisionAt?: string;
  settlementNotes?: string;
  settlementDecisionBy?: string;
  [k: string]: unknown;
};

const RUNS_PATH = join(process.cwd(), "data", "onboarding", "planner-runs.json");

function readRuns(): PlannerRunRecordLike[] {
  try {
    return JSON.parse(readFileSync(RUNS_PATH, "utf8")) as PlannerRunRecordLike[];
  } catch {
    return [];
  }
}

function writeRuns(records: PlannerRunRecordLike[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(RUNS_PATH, JSON.stringify(records, null, 2));
}

export function decidePlannerSettlement(input: {
  runId: string;
  decision: "release" | "dispute";
  notes?: string;
  consumerWallet?: string;
}) {
  if (!input.runId?.trim()) {
    throw new Error("runId is required");
  }

  const runs = readRuns();
  const idx = runs.findIndex((r) => r.runId === input.runId);
  if (idx < 0) {
    throw new Error("Run not found");
  }

  const run = runs[idx];

  if (run.paymentSatisfied !== true) {
    throw new Error("Settlement decision requires a payment-satisfied run");
  }

  const now = new Date().toISOString();
  const settlementState: PlannerRunSettlementState =
    input.decision === "release" ? "released" : "disputed";

  const updated: PlannerRunRecordLike = {
    ...run,
    settlementState,
    settlementDecisionAt: now,
    settlementNotes: input.notes,
    settlementDecisionBy: input.consumerWallet,
  };

  runs[idx] = updated;
  writeRuns(runs);

  return {
    ok: true,
    run: updated,
    storagePath: RUNS_PATH,
  };
}
