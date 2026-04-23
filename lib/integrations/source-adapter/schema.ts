export const SOURCE_ADAPTER_VERSION = "source-adapter.v1";

export type SourceAdapterRole = "supervisor" | "specialist" | "attestor" | "consumer";
export type SourcePaymentPolicy = "x402_required" | "simulation_only";

export type SourceAdapterManifest = {
  version: string;
  source: string;
  role: SourceAdapterRole;
  runtime: string;
  capabilities: {
    taskTypes: string[];
    inputModes?: string[];
    outputModes?: string[];
  };
  paymentPolicy: SourcePaymentPolicy;
  attestationSchema?: string;
  failurePolicy?: {
    maxRetries?: number;
    refundOnFailure?: boolean;
  };
};

const ROLE_SET: SourceAdapterRole[] = ["supervisor", "specialist", "attestor", "consumer"];
const PAYMENT_POLICY_SET: SourcePaymentPolicy[] = ["x402_required", "simulation_only"];

function hasNonEmptyStringArray(value: unknown) {
  return Array.isArray(value) && value.length > 0 && value.every((x) => typeof x === "string" && x.trim().length > 0);
}

export function validateSourceAdapterManifest(input: unknown) {
  const issues: string[] = [];
  const manifest = input as Partial<SourceAdapterManifest> | null;

  if (!manifest || typeof manifest !== "object") {
    return { ok: false as const, issues: ["sourceAdapter manifest object is required."] };
  }

  if (manifest.version !== SOURCE_ADAPTER_VERSION) {
    issues.push(`version must be '${SOURCE_ADAPTER_VERSION}'.`);
  }

  if (!manifest.source || typeof manifest.source !== "string") {
    issues.push("source is required.");
  }

  if (!manifest.runtime || typeof manifest.runtime !== "string") {
    issues.push("runtime is required.");
  }

  if (!manifest.role || !ROLE_SET.includes(manifest.role)) {
    issues.push("role must be one of: supervisor, specialist, attestor, consumer.");
  }

  if (!manifest.paymentPolicy || !PAYMENT_POLICY_SET.includes(manifest.paymentPolicy)) {
    issues.push("paymentPolicy must be one of: x402_required, simulation_only.");
  }

  const capabilities = manifest.capabilities;
  if (!capabilities || typeof capabilities !== "object") {
    issues.push("capabilities object is required.");
  } else {
    if (!hasNonEmptyStringArray(capabilities.taskTypes)) {
      issues.push("capabilities.taskTypes must be a non-empty string array.");
    }

    if (capabilities.inputModes && !hasNonEmptyStringArray(capabilities.inputModes)) {
      issues.push("capabilities.inputModes must be a non-empty string array when provided.");
    }

    if (capabilities.outputModes && !hasNonEmptyStringArray(capabilities.outputModes)) {
      issues.push("capabilities.outputModes must be a non-empty string array when provided.");
    }
  }

  if (manifest.role === "attestor") {
    if (!manifest.attestationSchema || typeof manifest.attestationSchema !== "string" || !manifest.attestationSchema.trim()) {
      issues.push("attestationSchema is required when role=attestor.");
    }
  }

  if (manifest.failurePolicy && typeof manifest.failurePolicy === "object") {
    const maxRetries = manifest.failurePolicy.maxRetries;
    if (maxRetries !== undefined && (!Number.isInteger(maxRetries) || maxRetries < 0 || maxRetries > 10)) {
      issues.push("failurePolicy.maxRetries must be an integer between 0 and 10 when provided.");
    }

    const refundOnFailure = manifest.failurePolicy.refundOnFailure;
    if (refundOnFailure !== undefined && typeof refundOnFailure !== "boolean") {
      issues.push("failurePolicy.refundOnFailure must be a boolean when provided.");
    }
  }

  return {
    ok: issues.length === 0,
    issues,
  } as const;
}
