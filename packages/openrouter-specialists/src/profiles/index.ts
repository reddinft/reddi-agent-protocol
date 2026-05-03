import type { SpecialistProfile } from "../types.js";

const walletAddresses = {
  planning: "AXfCzZmfKsGDr8XdE4SZXDXdfvrqSSUm9xdX6EbmLA5H",
  documentIntelligence: "82Lpdv8FjaQUELikS9jc2ga3LQSxzKJmWKHwQr4v9acN",
  verificationValidation: "7eHBdFN8qUrG9ifyyM2RzqYaxX5T5ijeF7D5BZnQJyD7",
  codeGeneration: "GctzwjmUTJphtBLHA4VwfjY4qCajRywunMvUoKTB6Prn",
  conversational: "5qVJ6XhYiDqNXHYR4B5QLT6rDSQ72iyuG5ooHyV9B2Xc",
} as const;

function isBase58SolanaPublicKey(value: string): boolean {
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return false;
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = [0];
  for (const char of value) {
    const carryStart = alphabet.indexOf(char);
    if (carryStart < 0) return false;
    let carry = carryStart;
    for (let index = 0; index < bytes.length; index += 1) {
      carry += bytes[index] * 58;
      bytes[index] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (const char of value) {
    if (char !== "1") break;
    bytes.push(0);
  }
  return bytes.length === 32;
}

export const specialistProfiles: SpecialistProfile[] = [
  {
    id: "planning-agent",
    displayName: "Planning Agent",
    description: "Turns broad goals into sequenced execution plans with assumptions, risks, and validation gates.",
    walletAddress: walletAddresses.planning,
    endpointPath: "/v1/chat/completions",
    capabilities: ["planning", "task-decomposition", "risk-analysis", "agent-orchestration"],
    roles: ["specialist", "consumer"],
    price: { currency: "USDC", amount: "0.03", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: ["verification-validation-agent"],
    model: "openai/gpt-4.1-mini",
    tags: ["planning", "operations", "strategy"],
    systemPrompt:
      "You are the Reddi Planning Agent. Produce practical execution plans, expose assumptions, sequence dependencies, and recommend validation gates. Stay within marketplace-safe scope.",
  },
  {
    id: "document-intelligence-agent",
    displayName: "Document Intelligence Agent",
    description: "Extracts, classifies, summarizes, and cross-checks document evidence.",
    walletAddress: walletAddresses.documentIntelligence,
    endpointPath: "/v1/chat/completions",
    capabilities: ["document-analysis", "summarization", "evidence-extraction", "classification"],
    roles: ["specialist"],
    price: { currency: "USDC", amount: "0.04", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: ["verification-validation-agent"],
    model: "anthropic/claude-3.5-haiku",
    tags: ["documents", "evidence", "summaries"],
    systemPrompt:
      "You are the Reddi Document Intelligence Agent. Extract facts from supplied documents, separate evidence from inference, cite source snippets when available, and flag uncertainty.",
  },
  {
    id: "verification-validation-agent",
    displayName: "Verification & Validation Agent",
    description: "Reviews specialist outputs for evidence quality, safety boundaries, and release/refund/dispute recommendations.",
    walletAddress: walletAddresses.verificationValidation,
    endpointPath: "/v1/chat/completions",
    capabilities: ["verification", "validation", "attestation", "quality-review", "safety-review"],
    roles: ["specialist", "attestor"],
    price: { currency: "USDC", amount: "0.025", unit: "request" },
    safetyMode: "attestation",
    preferredAttestors: [],
    model: "openai/gpt-4.1-mini",
    tags: ["verification", "attestation", "qa"],
    systemPrompt:
      "You are the Reddi Verification & Validation Agent. Assess outputs against receipts, evidence, and stated constraints. Return clear findings without claiming professional certification.",
  },
  {
    id: "code-generation-agent",
    displayName: "Code Generation Agent",
    description: "Builds scoped code changes, tests, migrations, and implementation notes.",
    walletAddress: walletAddresses.codeGeneration,
    endpointPath: "/v1/chat/completions",
    capabilities: ["code-generation", "debugging", "test-writing", "technical-design"],
    roles: ["specialist"],
    price: { currency: "USDC", amount: "0.05", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: ["verification-validation-agent"],
    model: "anthropic/claude-3.5-sonnet",
    tags: ["engineering", "code", "tests"],
    systemPrompt:
      "You are the Reddi Code Generation Agent. Make minimal, testable code changes, explain tradeoffs, avoid secrets, and include validation evidence.",
  },
  {
    id: "conversational-agent",
    displayName: "Conversational Agent",
    description: "Handles general dialogue, intake, clarification, and user-friendly handoff summaries.",
    walletAddress: walletAddresses.conversational,
    endpointPath: "/v1/chat/completions",
    capabilities: ["conversation", "intake", "clarification", "handoff-summary"],
    roles: ["specialist"],
    price: { currency: "USDC", amount: "0.015", unit: "request" },
    safetyMode: "standard",
    preferredAttestors: ["verification-validation-agent"],
    model: "openai/gpt-4.1-mini",
    tags: ["chat", "support", "intake"],
    systemPrompt:
      "You are the Reddi Conversational Agent. Be clear, warm, and useful. Clarify missing requirements and route specialized work to the proper agent when needed.",
  },
];

export function getProfile(id: string): SpecialistProfile | undefined {
  return specialistProfiles.find((profile) => profile.id === id);
}

export function validateProfile(profile: SpecialistProfile): string[] {
  const errors: string[] = [];
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profile.id)) errors.push(`invalid id: ${profile.id}`);
  if (!profile.displayName.trim()) errors.push(`${profile.id}: missing displayName`);
  if (!profile.walletAddress.trim()) errors.push(`${profile.id}: missing walletAddress`);
  if (profile.walletAddress.trim() && !isBase58SolanaPublicKey(profile.walletAddress)) errors.push(`${profile.id}: invalid Solana walletAddress`);
  if (profile.endpointPath !== "/v1/chat/completions") errors.push(`${profile.id}: unsupported endpointPath`);
  if (profile.capabilities.length === 0) errors.push(`${profile.id}: missing capabilities`);
  if (profile.roles.length === 0 || !profile.roles.includes("specialist")) errors.push(`${profile.id}: must include specialist role`);
  if (!profile.price.amount || !profile.price.currency || !profile.price.unit) errors.push(`${profile.id}: invalid price`);
  if (!profile.model.trim()) errors.push(`${profile.id}: missing model`);
  if (!profile.systemPrompt.trim()) errors.push(`${profile.id}: missing systemPrompt`);
  return errors;
}

export function validateProfileRegistry(profiles = specialistProfiles): string[] {
  const ids = new Set<string>();
  const wallets = new Set<string>();
  const errors = profiles.flatMap(validateProfile);
  for (const profile of profiles) {
    if (ids.has(profile.id)) errors.push(`duplicate id: ${profile.id}`);
    ids.add(profile.id);
    if (wallets.has(profile.walletAddress)) errors.push(`duplicate wallet: ${profile.walletAddress}`);
    wallets.add(profile.walletAddress);
  }
  return errors;
}
