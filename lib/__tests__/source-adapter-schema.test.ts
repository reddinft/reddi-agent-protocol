import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";

describe("source adapter schema", () => {
  it("accepts a valid consumer manifest", () => {
    const result = validateSourceAdapterManifest({
      version: "source-adapter.v1",
      source: "openclaw",
      role: "consumer",
      runtime: "ollama",
      capabilities: {
        taskTypes: ["resolve", "invoke"],
        inputModes: ["text"],
        outputModes: ["text"],
      },
      paymentPolicy: "x402_required",
      failurePolicy: {
        maxRetries: 2,
        refundOnFailure: true,
      },
    });

    expect(result.ok).toBe(true);
  });

  it("requires attestationSchema for attestor role", () => {
    const result = validateSourceAdapterManifest({
      version: "source-adapter.v1",
      source: "hermes",
      role: "attestor",
      runtime: "vllm",
      capabilities: { taskTypes: ["judge"] },
      paymentPolicy: "x402_required",
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toContain("attestationSchema is required");
  });
});
