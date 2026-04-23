import { validatePiExtensionBundle } from "@/lib/integrations/source-adapter/pi/extension-bundle";
import { PI_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/pi";

describe("source adapter pi extension bundle compatibility", () => {
  it("accepts canonical pi extension bundle", () => {
    const result = validatePiExtensionBundle({
      version: PI_SOURCE_PROFILE.defaultExtensionBundleVersion,
      source: "pi",
      extensions: ["capability-index", "attestation", "settlement", "routing"],
    });

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it("rejects missing required extensions", () => {
    const result = validatePiExtensionBundle({
      version: PI_SOURCE_PROFILE.defaultExtensionBundleVersion,
      source: "pi",
      extensions: ["capability-index", "attestation"],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toContain("missing required extension: settlement");
  });
});
