import { validateSourceAdapterManifest } from "@/lib/integrations/source-adapter/schema";
import { getSourceProfile } from "@/lib/integrations/source-adapter/profiles";
import { buildHermesSourceManifest, HERMES_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/hermes";

describe("source adapter hermes profile", () => {
  it("is discoverable via source registry", () => {
    const profile = getSourceProfile("hermes");
    expect(profile).toBeTruthy();
    expect(profile?.source).toBe("hermes");
    expect(profile?.roles).toContain("attestor");
  });

  it("builds a valid attestor manifest with strict schema pin", () => {
    const manifest = buildHermesSourceManifest({
      role: "attestor",
      runtime: "vllm",
      taskTypes: ["judge"],
    });

    const validation = validateSourceAdapterManifest(manifest);
    expect(validation.ok).toBe(true);
    expect(manifest.attestationSchema).toBe(HERMES_SOURCE_PROFILE.defaultAttestationSchema);
  });
});
