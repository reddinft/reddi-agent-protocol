import { getSourceProfile } from "@/lib/integrations/source-adapter/profiles";
import { buildPiSourceManifest, PI_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/pi";
import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";

describe("source adapter pi profile", () => {
  it("resolves from source profile registry", () => {
    const profile = getSourceProfile("pi");
    expect(profile).toBeTruthy();
    expect(profile?.source).toBe("pi");
    expect(profile?.runtimes).toContain("hosted");
  });

  it("builds valid manifest and pins attestation schema for attestors", () => {
    const manifest = buildPiSourceManifest({
      role: "attestor",
      runtime: "hosted",
      taskTypes: ["judge"],
    });

    const validation = validateSourceAdapterManifest(manifest);
    expect(validation.ok).toBe(true);
    expect(manifest.attestationSchema).toBe(PI_SOURCE_PROFILE.defaultAttestationSchema);
  });
});
