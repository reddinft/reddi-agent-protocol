import {
  OPENONION_ADAPTER_VERSION,
  paymentRequiredSemantics,
  validateOpenOnionSpecialistProfile,
} from "@/lib/integrations/openonion/specialist/adapter";

describe("openonion specialist adapter", () => {
  it("accepts valid specialist profile", () => {
    const result = validateOpenOnionSpecialistProfile({
      adapter: "openonion",
      adapterVersion: OPENONION_ADAPTER_VERSION,
      role: "specialist",
      runtime: "connectonion",
      payment: { enforcement: "x402", required: true },
      capabilities: {
        taskTypes: ["summarize"],
        inputModes: ["text"],
        outputModes: ["text"],
      },
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects unpaid semantics contract", () => {
    const result = validateOpenOnionSpecialistProfile({
      adapter: "openonion",
      adapterVersion: OPENONION_ADAPTER_VERSION,
      role: "specialist",
      runtime: "connectonion",
      payment: { enforcement: "none", required: false },
      capabilities: {
        taskTypes: ["summarize"],
        inputModes: ["text"],
        outputModes: ["text"],
      },
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toContain("payment.enforcement");
    expect(result.issues.join(" ")).toContain("payment.required");
  });

  it("returns deterministic payment-required semantics", () => {
    expect(paymentRequiredSemantics()).toEqual({
      status: 402,
      code: "PAYMENT_REQUIRED",
      message: "Valid x402 settlement proof is required before specialist execution.",
    });
  });
});
