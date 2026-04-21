export const OPENONION_ADAPTER_VERSION = "openonion.reddi.v1";

export type OpenOnionSpecialistAdapterProfile = {
  adapter: "openonion";
  adapterVersion: string;
  role: "specialist";
  runtime: string;
  payment: {
    enforcement: string;
    required: boolean;
  };
  capabilities: {
    taskTypes: string[];
    inputModes: string[];
    outputModes: string[];
  };
};

export function validateOpenOnionSpecialistProfile(input: unknown) {
  const issues: string[] = [];
  const profile = input as Partial<OpenOnionSpecialistAdapterProfile> | null;

  if (!profile || typeof profile !== "object") {
    return { ok: false as const, issues: ["Adapter profile is required."] };
  }
  if (profile.adapter !== "openonion") issues.push("adapter must be 'openonion'.");
  if (profile.role !== "specialist") issues.push("role must be 'specialist'.");
  if (profile.adapterVersion !== OPENONION_ADAPTER_VERSION) {
    issues.push(`adapterVersion must be '${OPENONION_ADAPTER_VERSION}'.`);
  }
  if (profile.payment?.enforcement !== "x402") {
    issues.push("payment.enforcement must be 'x402'.");
  }
  if (profile.payment?.required !== true) {
    issues.push("payment.required must be true.");
  }

  const capabilities = profile.capabilities;
  if (!Array.isArray(capabilities?.taskTypes) || capabilities.taskTypes.length === 0) {
    issues.push("capabilities.taskTypes must be a non-empty array.");
  }
  if (!Array.isArray(capabilities?.inputModes) || capabilities.inputModes.length === 0) {
    issues.push("capabilities.inputModes must be a non-empty array.");
  }
  if (!Array.isArray(capabilities?.outputModes) || capabilities.outputModes.length === 0) {
    issues.push("capabilities.outputModes must be a non-empty array.");
  }

  return {
    ok: issues.length === 0,
    issues,
  } as const;
}

export function paymentRequiredSemantics() {
  return {
    status: 402,
    code: "PAYMENT_REQUIRED",
    message: "Valid x402 settlement proof is required before specialist execution.",
  };
}
