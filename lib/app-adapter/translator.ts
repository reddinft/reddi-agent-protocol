import type { AppAdapterRunInput } from "./types";

export function normalizeTraceId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : `trace_${Date.now().toString(36)}`;
}

export function validateRunInput(value: unknown): { ok: true; input: AppAdapterRunInput } | { ok: false; error: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "input must be an object" };
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.task !== "string" || !candidate.task.trim()) {
    return { ok: false, error: "input.task must be a non-empty string" };
  }

  if (
    candidate.constraints !== undefined &&
    (!Array.isArray(candidate.constraints) || candidate.constraints.some((item) => typeof item !== "string"))
  ) {
    return { ok: false, error: "input.constraints must be an array of strings" };
  }

  const evidencePreference = candidate.evidence_preference;
  if (
    evidencePreference !== undefined &&
    evidencePreference !== "summary" &&
    evidencePreference !== "links" &&
    evidencePreference !== "full_receipt"
  ) {
    return { ok: false, error: "input.evidence_preference must be summary, links, or full_receipt" };
  }

  return {
    ok: true,
    input: {
      task: candidate.task.trim(),
      constraints: candidate.constraints as string[] | undefined,
      evidence_preference: evidencePreference as AppAdapterRunInput["evidence_preference"],
    },
  };
}
