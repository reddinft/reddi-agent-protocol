import { PI_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/pi";

export type PiExtensionBundle = {
  version: string;
  source: "pi";
  extensions: string[];
};

const REQUIRED_PI_EXTENSIONS = ["capability-index", "attestation", "settlement"];

export function validatePiExtensionBundle(bundle: unknown) {
  const issues: string[] = [];
  const value = bundle as Partial<PiExtensionBundle> | null;

  if (!value || typeof value !== "object") {
    return { ok: false as const, issues: ["bundle object is required."] };
  }

  if (value.version !== PI_SOURCE_PROFILE.defaultExtensionBundleVersion) {
    issues.push(`version must be '${PI_SOURCE_PROFILE.defaultExtensionBundleVersion}'.`);
  }

  if (value.source !== "pi") {
    issues.push("source must be 'pi'.");
  }

  if (!Array.isArray(value.extensions) || value.extensions.length === 0) {
    issues.push("extensions must be a non-empty string array.");
  } else {
    const extSet = new Set(value.extensions.filter((x): x is string => typeof x === "string" && x.length > 0));
    for (const req of REQUIRED_PI_EXTENSIONS) {
      if (!extSet.has(req)) {
        issues.push(`missing required extension: ${req}`);
      }
    }
  }

  return { ok: issues.length === 0, issues } as const;
}
