import { computeCapabilityHash, validateCapabilities } from "@/lib/onboarding/capabilities";

describe("capabilities disclosure schema", () => {
  it("normalizes optional disclosure metadata", () => {
    const normalized = validateCapabilities({
      taskTypes: ["summarize"],
      inputModes: ["text"],
      outputModes: ["text"],
      pricing: { baseUsd: 0.1, perCallUsd: 0.2 },
      privacyModes: ["public"],
      tags: [" openclaw ", "openclaw"],
      agent_composition: {
        llm: " qwen2.5:7b ",
        control_loop: " reflect-revise ",
        tools: ["web_search", "web_search"],
        skills: ["research", "research", "summarization"],
        memory: ["session"],
        goals: ["accuracy", "accuracy", "latency"],
        external_mcp_servers: ["browser-mcp", "browser-mcp"],
        marketplace_agent_calls: ["verification-validation-agent", "verification-validation-agent"],
        non_marketplace_agent_calls: ["openrouter:qwen", "openrouter:qwen"],
      },
      manifest: {
        profileId: "doc-agent",
        displayName: "Document Agent",
        description: "Summarizes documents.",
        roles: ["specialist", "specialist"],
        tools: ["web_search", "web_search"],
        skills: ["research", "summarization"],
        marketplace_agent_calls: ["verification-validation-agent"],
        external_mcp_servers: ["browser-mcp"],
        non_marketplace_agent_calls: ["openrouter:qwen"],
        preferred_attestors: ["verification-validation-agent"],
        disclosure_policy: "Return downstream ledger.",
      },
      quality_claims: ["schema pass", "schema pass"],
      attestor_checkpoints: ["schema_contract", "schema_contract", "policy_bounds"],
    });

    expect(normalized.agent_composition).toEqual({
      llm: "qwen2.5:7b",
      control_loop: "reflect-revise",
      tools: ["web_search"],
      skills: ["research", "summarization"],
      memory: ["session"],
      goals: ["accuracy", "latency"],
      external_mcp_servers: ["browser-mcp"],
      marketplace_agent_calls: ["verification-validation-agent"],
      non_marketplace_agent_calls: ["openrouter:qwen"],
    });
    expect(normalized.manifest).toEqual({
      profileId: "doc-agent",
      displayName: "Document Agent",
      description: "Summarizes documents.",
      roles: ["specialist"],
      tools: ["web_search"],
      skills: ["research", "summarization"],
      marketplace_agent_calls: ["verification-validation-agent"],
      external_mcp_servers: ["browser-mcp"],
      non_marketplace_agent_calls: ["openrouter:qwen"],
      preferred_attestors: ["verification-validation-agent"],
      disclosure_policy: "Return downstream ledger.",
    });
    expect(normalized.quality_claims).toEqual(["schema pass"]);
    expect(normalized.attestor_checkpoints).toEqual(["schema_contract", "policy_bounds"]);
  });

  it("includes disclosure metadata in capability hash", () => {
    const base = validateCapabilities({
      taskTypes: ["summarize"],
      inputModes: ["text"],
      outputModes: ["text"],
      pricing: { baseUsd: 0.1, perCallUsd: 0.2 },
      privacyModes: ["public"],
      agent_composition: {
        llm: "qwen2.5:7b",
        control_loop: "reflect-revise",
        tools: ["web_search"],
        memory: ["session"],
        goals: ["accuracy"],
      },
      quality_claims: ["schema pass"],
      attestor_checkpoints: ["schema_contract"],
    });

    const changed = validateCapabilities({
      taskTypes: ["summarize"],
      inputModes: ["text"],
      outputModes: ["text"],
      pricing: { baseUsd: 0.1, perCallUsd: 0.2 },
      privacyModes: ["public"],
      agent_composition: {
        llm: "qwen2.5:7b",
        control_loop: "reflect-revise",
        tools: ["web_search"],
        memory: ["session"],
        goals: ["accuracy"],
      },
      quality_claims: ["schema pass", "latency p95 < 3s"],
      attestor_checkpoints: ["schema_contract"],
    });

    const baseHash = computeCapabilityHash("wallet-1", base);
    const changedHash = computeCapabilityHash("wallet-1", changed);

    expect(baseHash).not.toBe(changedHash);
  });
});
