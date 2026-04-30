import type { AppAdapterRun } from "./types";

const runs = new Map<string, AppAdapterRun>();

export function createRunId() {
  return `app_run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function saveAppAdapterRun(run: AppAdapterRun) {
  runs.set(run.runId, run);
  return run;
}

export function getAppAdapterRun(runId: string) {
  return runs.get(runId);
}

export function clearAppAdapterRunsForTest() {
  runs.clear();
}
