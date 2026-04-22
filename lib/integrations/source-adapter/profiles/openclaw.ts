import { SOURCE_ADAPTER_VERSION, type SourceAdapterManifest, type SourceAdapterRole } from "@/lib/integrations/source-adapter/schema";

export const OPENCLAW_SOURCE_ID = "openclaw";

export const OPENCLAW_SOURCE_PROFILE = {
  source: OPENCLAW_SOURCE_ID,
  roles: ["supervisor", "consumer", "attestor"] as SourceAdapterRole[],
  runtimes: ["ollama", "vllm", "hosted"],
  defaultPaymentPolicy: "x402_required" as const,
  defaultAttestationSchema: "reddi.attestation.v1",
  capabilityHints: {
    supervisor: ["resolve", "invoke", "monitor", "delegate"],
    consumer: ["resolve", "invoke", "release", "signal"],
    attestor: ["judge", "score", "audit"],
  },
};

export function buildOpenClawSourceManifest(input: {
  role: SourceAdapterRole;
  runtime: "ollama" | "vllm" | "hosted";
  taskTypes: string[];
  inputModes?: string[];
  outputModes?: string[];
  failurePolicy?: { maxRetries?: number; refundOnFailure?: boolean };
}): SourceAdapterManifest {
  const manifest: SourceAdapterManifest = {
    version: SOURCE_ADAPTER_VERSION,
    source: OPENCLAW_SOURCE_ID,
    role: input.role,
    runtime: input.runtime,
    capabilities: {
      taskTypes: input.taskTypes,
      inputModes: input.inputModes ?? ["text"],
      outputModes: input.outputModes ?? ["text"],
    },
    paymentPolicy: OPENCLAW_SOURCE_PROFILE.defaultPaymentPolicy,
    failurePolicy: input.failurePolicy,
  };

  if (input.role === "attestor") {
    manifest.attestationSchema = OPENCLAW_SOURCE_PROFILE.defaultAttestationSchema;
  }

  return manifest;
}
