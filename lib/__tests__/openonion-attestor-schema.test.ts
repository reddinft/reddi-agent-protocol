import {
  OPENONION_ATTESTOR_SCHEMA_VERSION,
  validateOpenOnionAttestorPayload,
} from "@/lib/integrations/openonion/attestor/schema";

describe("openonion attestor schema", () => {
  it("accepts a pinned schema payload", () => {
    const result = validateOpenOnionAttestorPayload({
      schemaVersion: OPENONION_ATTESTOR_SCHEMA_VERSION,
      runId: "run_123",
      attestorWallet: "wallet_attestor",
      rubric: { coverage: 0.9, accuracy: 0.8, concision: 0.85 },
      verdict: "pass",
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects schema drift when rubric fields are missing", () => {
    const result = validateOpenOnionAttestorPayload({
      schemaVersion: OPENONION_ATTESTOR_SCHEMA_VERSION,
      runId: "run_123",
      attestorWallet: "wallet_attestor",
      rubric: { coverage: 0.9, accuracy: 0.8 },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toContain("rubric.concision");
  });
});
