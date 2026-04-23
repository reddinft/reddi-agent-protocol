import { formatHermesAttestorPayload, HERMES_ATTESTOR_SCHEMA_VERSION } from "@/lib/integrations/source-adapter/hermes/attestor";

describe("source adapter hermes attestor formatter", () => {
  it("formats valid rubric payloads with deterministic schema version", () => {
    const payload = formatHermesAttestorPayload({
      runId: "run_123",
      attestorWallet: "wallet_abc",
      rubric: { coverage: 0.9, accuracy: 0.8, concision: 0.7 },
    });

    expect(payload.schemaVersion).toBe(HERMES_ATTESTOR_SCHEMA_VERSION);
    expect(payload.verdict).toBe("pass");
    expect(payload.rubric.coverage).toBe(0.9);
  });

  it("rejects schema-drifted rubric payloads", () => {
    expect(() =>
      formatHermesAttestorPayload({
        runId: "run_123",
        attestorWallet: "wallet_abc",
        rubric: { coverage: 0.9, accuracy: 1.2, concision: 0.7 },
      })
    ).toThrow("Hermes attestor payload mismatch");
  });
});
