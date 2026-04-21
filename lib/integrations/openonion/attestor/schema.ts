export const OPENONION_ATTESTOR_SCHEMA_VERSION = "reddi.attestation.v1";

export type OpenOnionAttestorPayload = {
  schemaVersion: string;
  runId: string;
  attestorWallet: string;
  rubric: {
    coverage: number;
    accuracy: number;
    concision: number;
  };
  verdict?: "pass" | "fail";
};

function isValidRubricScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateOpenOnionAttestorPayload(input: unknown) {
  const payload = input as Partial<OpenOnionAttestorPayload> | null;
  const issues: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { ok: false as const, issues: ["Attestor payload is required."] };
  }
  if (payload.schemaVersion !== OPENONION_ATTESTOR_SCHEMA_VERSION) {
    issues.push(`schemaVersion must be '${OPENONION_ATTESTOR_SCHEMA_VERSION}'.`);
  }
  if (!payload.runId || typeof payload.runId !== "string") {
    issues.push("runId is required.");
  }
  if (!payload.attestorWallet || typeof payload.attestorWallet !== "string") {
    issues.push("attestorWallet is required.");
  }

  const rubric = payload.rubric;
  if (!rubric || typeof rubric !== "object") {
    issues.push("rubric object is required.");
  } else {
    if (!isValidRubricScore(rubric.coverage)) issues.push("rubric.coverage must be a number between 0 and 1.");
    if (!isValidRubricScore(rubric.accuracy)) issues.push("rubric.accuracy must be a number between 0 and 1.");
    if (!isValidRubricScore(rubric.concision)) issues.push("rubric.concision must be a number between 0 and 1.");
  }

  return {
    ok: issues.length === 0,
    issues,
  } as const;
}
