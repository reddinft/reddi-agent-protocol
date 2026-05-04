export type EconomicDemoScenarioId = "webpage" | "research" | "picture";

export type WalletBalance = {
  profileId: string;
  role: "end-user" | "orchestrator" | "specialist" | "attestor" | "adapter";
  wallet: string;
  startingLamports: number;
  endingLamports: number;
};

export type EconomicEdge = {
  from: string;
  to: string;
  capability: string;
  payloadSummary: string;
  amountLamports: number;
  status: "planned" | "paid" | "attested" | "blocked";
  receipt: string;
};

export type EconomicDemoScenario = {
  id: EconomicDemoScenarioId;
  title: string;
  prompt: string;
  orchestrator: string;
  mode: "fixture-zero-spend" | "planned-dry-run" | "adapter-required";
  finalOutputType: "webpage" | "article" | "image-brief";
  finalOutputSummary: string;
  agents: Array<{ profileId: string; role: WalletBalance["role"]; description: string }>;
  edges: EconomicEdge[];
  balances: WalletBalance[];
  guardrails: string[];
};

const USER_WALLET = "UserDevnet111111111111111111111111111111111";

export const economicDemoScenarios: EconomicDemoScenario[] = [
  {
    id: "webpage",
    title: "Design me a webpage for X",
    prompt: "Design me a webpage for a solar-powered bakery.",
    orchestrator: "agentic-workflow-system",
    mode: "fixture-zero-spend",
    finalOutputType: "webpage",
    finalOutputSummary:
      "A responsive landing page plan with hero copy, menu sections, sustainability proof points, and implementation-ready component notes.",
    agents: [
      { profileId: "end-user", role: "end-user", description: "Submits the goal and funds the run budget." },
      { profileId: "agentic-workflow-system", role: "orchestrator", description: "Breaks the request into paid specialist jobs." },
      { profileId: "content-creation-agent", role: "specialist", description: "Writes page copy and calls-to-action." },
      { profileId: "code-generation-agent", role: "specialist", description: "Turns the approved structure into webpage code." },
      { profileId: "verification-validation-agent", role: "attestor", description: "Checks the output against acceptance criteria." },
    ],
    edges: [
      {
        from: "end-user",
        to: "agentic-workflow-system",
        capability: "workflow-orchestration",
        payloadSummary: "Goal, audience, tone, run budget, and desired output type.",
        amountLamports: 1_000_000,
        status: "planned",
        receipt: "fixture:x402:challenge:webpage-orchestrator",
      },
      {
        from: "agentic-workflow-system",
        to: "content-creation-agent",
        capability: "marketing-copy",
        payloadSummary: "Bakery positioning, section list, and CTA requirements.",
        amountLamports: 1_000_000,
        status: "planned",
        receipt: "fixture:x402:challenge:webpage-copy",
      },
      {
        from: "agentic-workflow-system",
        to: "code-generation-agent",
        capability: "webpage-code",
        payloadSummary: "Approved copy plus responsive layout constraints.",
        amountLamports: 1_000_000,
        status: "planned",
        receipt: "fixture:x402:challenge:webpage-code",
      },
      {
        from: "agentic-workflow-system",
        to: "verification-validation-agent",
        capability: "attestation",
        payloadSummary: "Final page draft, acceptance criteria, and receipt chain.",
        amountLamports: 500_000,
        status: "attested",
        receipt: "fixture:attestation:release-recommended",
      },
    ],
    balances: [
      { profileId: "end-user", role: "end-user", wallet: USER_WALLET, startingLamports: 10_000_000, endingLamports: 6_500_000 },
      { profileId: "agentic-workflow-system", role: "orchestrator", wallet: "AgenticWorkflow111111111111111111111111111", startingLamports: 4_000_000, endingLamports: 4_000_000 },
      { profileId: "content-creation-agent", role: "specialist", wallet: "ContentCreation11111111111111111111111111", startingLamports: 2_000_000, endingLamports: 3_000_000 },
      { profileId: "code-generation-agent", role: "specialist", wallet: "CodeGeneration111111111111111111111111111", startingLamports: 2_000_000, endingLamports: 3_000_000 },
      { profileId: "verification-validation-agent", role: "attestor", wallet: "VerifyValidate11111111111111111111111111", startingLamports: 2_000_000, endingLamports: 2_500_000 },
    ],
    guardrails: ["Fixture mode only", "No wallet mutation", "Next live loop allows one exact downstream edge"],
  },
  {
    id: "research",
    title: "Write me a research article on Y",
    prompt: "Write me a research article on decentralized agent marketplaces.",
    orchestrator: "scientific-research-agent",
    mode: "fixture-zero-spend",
    finalOutputType: "article",
    finalOutputSummary:
      "A structured article outline with evidence-gathering, synthesis, drafting, explainability, and verification steps.",
    agents: [
      { profileId: "end-user", role: "end-user", description: "Requests a research-backed article." },
      { profileId: "scientific-research-agent", role: "orchestrator", description: "Owns evidence synthesis and hires support specialists." },
      { profileId: "knowledge-retrieval-agent", role: "specialist", description: "Collects source summaries and citation candidates." },
      { profileId: "content-creation-agent", role: "specialist", description: "Turns synthesis into an article draft." },
      { profileId: "explainable-agent", role: "attestor", description: "Checks traceability and readability." },
      { profileId: "verification-validation-agent", role: "attestor", description: "Checks claims against evidence." },
    ],
    edges: [
      { from: "end-user", to: "scientific-research-agent", capability: "research-orchestration", payloadSummary: "Topic, desired audience, and evidence standard.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-orchestrator" },
      { from: "scientific-research-agent", to: "knowledge-retrieval-agent", capability: "knowledge-retrieval", payloadSummary: "Search questions, source criteria, and citation requirements.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-retrieval" },
      { from: "scientific-research-agent", to: "content-creation-agent", capability: "article-drafting", payloadSummary: "Evidence synthesis, angle, outline, and caveats.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-draft" },
      { from: "scientific-research-agent", to: "explainable-agent", capability: "explainability-review", payloadSummary: "Draft plus traceability checklist.", amountLamports: 500_000, status: "attested", receipt: "fixture:attestation:traceable" },
      { from: "scientific-research-agent", to: "verification-validation-agent", capability: "claim-verification", payloadSummary: "Final article and cited evidence map.", amountLamports: 500_000, status: "attested", receipt: "fixture:attestation:release-recommended" },
    ],
    balances: [
      { profileId: "end-user", role: "end-user", wallet: USER_WALLET, startingLamports: 12_000_000, endingLamports: 8_000_000 },
      { profileId: "scientific-research-agent", role: "orchestrator", wallet: "ScientificResearch111111111111111111111111", startingLamports: 3_000_000, endingLamports: 3_000_000 },
      { profileId: "knowledge-retrieval-agent", role: "specialist", wallet: "KnowledgeRetrieval11111111111111111111111", startingLamports: 2_000_000, endingLamports: 3_000_000 },
      { profileId: "content-creation-agent", role: "specialist", wallet: "ContentCreation11111111111111111111111111", startingLamports: 3_000_000, endingLamports: 4_000_000 },
      { profileId: "explainable-agent", role: "attestor", wallet: "Explainable1111111111111111111111111111", startingLamports: 2_000_000, endingLamports: 2_500_000 },
      { profileId: "verification-validation-agent", role: "attestor", wallet: "VerifyValidate11111111111111111111111111", startingLamports: 2_500_000, endingLamports: 3_000_000 },
    ],
    guardrails: ["Fixture mode only", "Citations are represented as payload summaries", "No live retrieval or inference in this slice"],
  },
  {
    id: "picture",
    title: "Give me a picture that shows Z",
    prompt: "Give me a picture that shows autonomous agents cooking Malatang.",
    orchestrator: "tool-using-agent",
    mode: "adapter-required",
    finalOutputType: "image-brief",
    finalOutputSummary:
      "A visual brief/storyboard until an image-generation adapter is explicitly approved and allowlisted.",
    agents: [
      { profileId: "end-user", role: "end-user", description: "Requests a visual output." },
      { profileId: "tool-using-agent", role: "orchestrator", description: "Would call an allowlisted image adapter after approval." },
      { profileId: "image-generation-adapter", role: "adapter", description: "Not yet part of the 30-agent catalog; requires explicit approval." },
      { profileId: "vision-language-agent", role: "specialist", description: "Validates visual output against the prompt after generation." },
      { profileId: "verification-validation-agent", role: "attestor", description: "Issues release/refund/dispute guidance." },
    ],
    edges: [
      { from: "end-user", to: "tool-using-agent", capability: "visual-workflow-planning", payloadSummary: "Prompt, style, safety constraints, and budget cap.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:picture-orchestrator" },
      { from: "tool-using-agent", to: "image-generation-adapter", capability: "image-generation", payloadSummary: "Adapter gated by env flag, provider key, and exact OpenAI/Fal provider route.", amountLamports: 0, status: "blocked", receipt: "blocked:image-generation-disabled" },
      { from: "tool-using-agent", to: "vision-language-agent", capability: "image-validation", payloadSummary: "Generated image or storyboard plus prompt criteria.", amountLamports: 500_000, status: "planned", receipt: "fixture:x402:challenge:vision-validation" },
    ],
    balances: [
      { profileId: "end-user", role: "end-user", wallet: USER_WALLET, startingLamports: 10_000_000, endingLamports: 9_000_000 },
      { profileId: "tool-using-agent", role: "orchestrator", wallet: "ToolUsing111111111111111111111111111111", startingLamports: 3_000_000, endingLamports: 3_000_000 },
      { profileId: "image-generation-adapter", role: "adapter", wallet: "PendingAdapter11111111111111111111111111", startingLamports: 0, endingLamports: 0 },
      { profileId: "vision-language-agent", role: "specialist", wallet: "VisionLanguage11111111111111111111111111", startingLamports: 2_000_000, endingLamports: 2_000_000 },
      { profileId: "verification-validation-agent", role: "attestor", wallet: "VerifyValidate11111111111111111111111111", startingLamports: 3_000_000, endingLamports: 3_000_000 },
    ],
    guardrails: ["OpenAI/Fal image adapter route exists but is disabled until ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true", "Provider order: OpenAI first when configured, Fal.ai fallback when configured", "Vision validation follows generated image receipt capture"],
  },
];

export function lamportsDelta(balance: WalletBalance) {
  return balance.endingLamports - balance.startingLamports;
}

export function formatLamports(lamports: number) {
  const sign = lamports > 0 ? "+" : "";
  return `${sign}${(lamports / 1_000_000_000).toFixed(6)} SOL`;
}
