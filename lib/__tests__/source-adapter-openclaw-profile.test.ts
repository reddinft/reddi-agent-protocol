import { buildOpenClawSourceManifest, OPENCLAW_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/openclaw";
import { getSourceProfile } from "@/lib/integrations/source-adapter/profiles";
import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";

describe("source adapter openclaw profile", () => {
  it("is discoverable via source registry", () => {
    const profile = getSourceProfile("openclaw");
    expect(profile).toBeTruthy();
    expect(profile?.source).toBe("openclaw");
    expect(profile?.roles).toContain("supervisor");
  });

  it("builds a valid attestor manifest with default attestation schema", () => {
    const manifest = buildOpenClawSourceManifest({
      role: "attestor",
      runtime: "ollama",
      taskTypes: ["judge"],
    });

    const validation = validateSourceAdapterManifest(manifest);
    expect(validation.ok).toBe(true);
    expect(manifest.attestationSchema).toBe(OPENCLAW_SOURCE_PROFILE.defaultAttestationSchema);
  });
});
