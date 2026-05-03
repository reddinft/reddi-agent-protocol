import { computeCapabilityHash, validateCapabilities } from "@/lib/onboarding/capabilities";
import {
  buildOpenRouterSpecialistIndexEntry,
  enrichCapabilityIndexWithOpenRouterProfiles,
} from "@/lib/registry/openrouter-enrichment";
import { specialistProfiles } from "../../packages/openrouter-specialists/src/profiles/index";

const evidenceTimestamp = "2026-05-04T08:05:44.000+10:00";
const hostedProfileIds = new Set([
  "planning-agent",
  "document-intelligence-agent",
  "verification-validation-agent",
  "code-generation-agent",
  "conversational-agent",
]);
const hostedProfiles = specialistProfiles.filter((profile) => hostedProfileIds.has(profile.id));

describe("OpenRouter registry enrichment", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-05-04T08:30:00.000+10:00"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("builds enriched capability index entries for all first-five OpenRouter wallets", () => {
    const enriched = enrichCapabilityIndexWithOpenRouterProfiles([]);

    expect(enriched).toHaveLength(hostedProfiles.length);
    expect(enriched.map((entry) => entry.walletAddress).sort()).toEqual(
      hostedProfiles.map((profile) => profile.walletAddress).sort(),
    );

    for (const entry of enriched) {
      expect(entry.endpointUrl).toMatch(/^https:\/\/reddi-[a-z-]+\.preview\.reddi\.tech\/v1\/chat\/completions$/);
      expect(entry.healthcheckStatus).toBe("pass");
      expect(entry.last_seen_at).toBe(evidenceTimestamp);
      expect(entry.freshness_state).toBe("fresh");
      expect(entry.capabilities.taskTypes.length).toBeGreaterThan(0);
      expect(entry.capabilities.tags?.length).toBeGreaterThan(0);
      expect(entry.capabilities.pricing.perCallUsd).toBeGreaterThan(0);
      expect(entry.capabilities.runtime_capabilities?.length).toBeGreaterThan(0);
      expect(entry.routingSignals?.feedbackCount).toBe(0);
      expect(entry.routingSignals?.avgFeedbackScore).toBe(0);
      expect(entry.ranking_score).toBeGreaterThan(0);
      expect(entry.capabilityHash).toBe(computeCapabilityHash(entry.walletAddress, validateCapabilities(entry.capabilities)));
    }
  });

  it("maps profile capabilities into registry taxonomy fields", () => {
    const codeProfile = specialistProfiles.find((profile) => profile.id === "code-generation-agent");
    expect(codeProfile).toBeDefined();

    const entry = buildOpenRouterSpecialistIndexEntry(codeProfile!.walletAddress);

    expect(entry?.capabilities.taskTypes).toEqual(expect.arrayContaining(["code", "review"]));
    expect(entry?.capabilities.tags).toEqual(expect.arrayContaining(["code-generation", "debugging", "engineering"]));
    expect(entry?.capabilities.runtime_capabilities).toEqual(expect.arrayContaining(["code_execution", "streaming"]));
    expect(entry?.capabilities.agent_composition?.llm).toBe(codeProfile!.model);
    expect(entry?.capabilities.pricing.perCallUsd).toBe(0.05);
    expect(entry?.capabilityHash).toBe(computeCapabilityHash(codeProfile!.walletAddress, validateCapabilities(entry!.capabilities)));
  });

  it("preserves explicit local index values while filling missing OpenRouter metadata", () => {
    const planning = specialistProfiles.find((profile) => profile.id === "planning-agent");
    expect(planning).toBeDefined();

    const enriched = enrichCapabilityIndexWithOpenRouterProfiles([
      {
        walletAddress: planning!.walletAddress,
        updatedAt: "2026-05-01T00:00:00.000Z",
        endpointUrl: "https://custom.example/v1/chat/completions",
        capabilities: {
          taskTypes: ["plan"],
          inputModes: ["text"],
          outputModes: ["text"],
          privacyModes: ["public"],
          pricing: { baseUsd: 0, perCallUsd: 0.01 },
          tags: ["custom-planning"],
          context_requirements: [],
          runtime_capabilities: ["stateful"],
        },
      },
    ]);

    const entry = enriched.find((item) => item.walletAddress === planning!.walletAddress);
    expect(entry?.endpointUrl).toBe("https://custom.example/v1/chat/completions");
    expect(entry?.capabilities.tags).toEqual(["custom-planning"]);
    expect(entry?.healthcheckStatus).toBe("pass");
    expect(entry?.freshness_state).toBe("fresh");
    expect(entry?.routingSignals?.avgFeedbackScore).toBe(0);
  });

  it("computes OpenRouter smoke evidence freshness dynamically from last_seen_at", () => {
    jest.spyOn(Date, "now").mockReturnValue(Date.parse("2026-05-05T09:00:00.000+10:00"));

    const planning = specialistProfiles.find((profile) => profile.id === "planning-agent");
    expect(planning).toBeDefined();

    const entry = buildOpenRouterSpecialistIndexEntry(planning!.walletAddress);

    expect(entry?.last_seen_at).toBe(evidenceTimestamp);
    expect(entry?.freshness_state).toBe("stale");
  });
});
