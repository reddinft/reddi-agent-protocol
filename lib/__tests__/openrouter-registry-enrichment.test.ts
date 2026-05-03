import {
  buildOpenRouterSpecialistIndexEntry,
  enrichCapabilityIndexWithOpenRouterProfiles,
} from "@/lib/registry/openrouter-enrichment";
import { specialistProfiles } from "../../packages/openrouter-specialists/src/profiles/index";

describe("OpenRouter registry enrichment", () => {
  it("builds enriched capability index entries for all first-five OpenRouter wallets", () => {
    const enriched = enrichCapabilityIndexWithOpenRouterProfiles([]);

    expect(enriched).toHaveLength(5);
    expect(enriched.map((entry) => entry.walletAddress).sort()).toEqual(
      specialistProfiles.map((profile) => profile.walletAddress).sort(),
    );

    for (const entry of enriched) {
      expect(entry.endpointUrl).toMatch(/^https:\/\/reddi-[a-z-]+\.preview\.reddi\.tech\/v1\/chat\/completions$/);
      expect(entry.healthcheckStatus).toBe("pass");
      expect(entry.freshness_state).toBe("fresh");
      expect(entry.capabilities.taskTypes.length).toBeGreaterThan(0);
      expect(entry.capabilities.tags?.length).toBeGreaterThan(0);
      expect(entry.capabilities.pricing.perCallUsd).toBeGreaterThan(0);
      expect(entry.capabilities.runtime_capabilities?.length).toBeGreaterThan(0);
      expect(entry.routingSignals?.feedbackCount).toBe(0);
      expect(entry.routingSignals?.avgFeedbackScore).toBe(0);
      expect(entry.ranking_score).toBeGreaterThan(0);
      expect(entry.capabilityHash).toMatch(/^[a-f0-9]{64}$/);
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
});
