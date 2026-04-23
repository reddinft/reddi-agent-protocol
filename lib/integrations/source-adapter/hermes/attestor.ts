export const HERMES_ATTESTOR_SCHEMA_VERSION = "reddi.attestation.v1";

export type HermesAttestorInput = {
  runId: string;
  attestorWallet: string;
  rubric: {
    coverage: number;
    accuracy: number;
    concision: number;
  };
  verdict?: "pass" | "fail";
};

export type HermesAttestorPayload = HermesAttestorInput & {
  schemaVersion: typeof HERMES_ATTESTOR_SCHEMA_VERSION;
};

function isScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

export function validateHermesAttestorInput(input: unknown) {
  const issues: string[] = [];
  const payload = input as Partial<HermesAttestorInput> | null;

  if (!payload || typeof payload !== "object") {
    return { ok: false as const, issues: ["attestor input is required"] };
  }

  if (!payload.runId || typeof payload.runId !== "string") {
    issues.push("runId is required.");
  }

  if (!payload.attestorWallet || typeof payload.attestorWallet !== "string") {
    issues.push("attestorWallet is required.");
  }

  if (!payload.rubric || typeof payload.rubric !== "object") {
    issues.push("rubric is required.");
  } else {
    if (!isScore(payload.rubric.coverage)) issues.push("rubric.coverage must be 0..1");
    if (!isScore(payload.rubric.accuracy)) issues.push("rubric.accuracy must be 0..1");
    if (!isScore(payload.rubric.concision)) issues.push("rubric.concision must be 0..1");
  }

  return { ok: issues.length === 0, issues } as const;
}

export function formatHermesAttestorPayload(input: HermesAttestorInput): HermesAttestorPayload {
  const validation = validateHermesAttestorInput(input);
  if (!validation.ok) {
    throw new Error(`Hermes attestor payload mismatch: ${validation.issues.join(" ")}`);
  }

  return {
    schemaVersion: HERMES_ATTESTOR_SCHEMA_VERSION,
    runId: input.runId,
    attestorWallet: input.attestorWallet,
    rubric: {
      coverage: input.rubric.coverage,
      accuracy: input.rubric.accuracy,
      concision: input.rubric.concision,
    },
    verdict: input.verdict ?? "pass",
  };
}
