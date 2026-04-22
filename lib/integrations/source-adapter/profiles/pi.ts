import { SOURCE_ADAPTER_VERSION, type SourceAdapterManifest, type SourceAdapterRole } from "@/lib/integrations/source-adapter/schema";

export const PI_SOURCE_ID = "pi" as const;

export const PI_SOURCE_PROFILE = {
  source: PI_SOURCE_ID,
  roles: ["supervisor", "consumer", "attestor"] as SourceAdapterRole[],
  runtimes: ["hosted", "wasm"],
  defaultPaymentPolicy: "x402_required" as const,
  defaultAttestationSchema: "reddi.attestation.v1",
  defaultExtensionBundleVersion: "pi.extension-bundle.v1",
  capabilityHints: {
    supervisor: ["resolve", "invoke", "monitor", "route"],
    consumer: ["resolve", "invoke", "release", "signal"],
    attestor: ["judge", "score", "audit"],
  },
};

export function buildPiSourceManifest(input: {
  role: SourceAdapterRole;
  runtime: "hosted" | "wasm";
  taskTypes: string[];
  inputModes?: string[];
  outputModes?: string[];
  failurePolicy?: { maxRetries?: number; refundOnFailure?: boolean };
}): SourceAdapterManifest {
  const manifest: SourceAdapterManifest = {
    version: SOURCE_ADAPTER_VERSION,
    source: PI_SOURCE_ID,
    role: input.role,
    runtime: input.runtime,
    capabilities: {
      taskTypes: input.taskTypes,
      inputModes: input.inputModes ?? ["text"],
      outputModes: input.outputModes ?? ["text"],
    },
    paymentPolicy: PI_SOURCE_PROFILE.defaultPaymentPolicy,
    failurePolicy: input.failurePolicy,
  };

  if (input.role === "attestor") {
    manifest.attestationSchema = PI_SOURCE_PROFILE.defaultAttestationSchema;
  }

  return manifest;
}
