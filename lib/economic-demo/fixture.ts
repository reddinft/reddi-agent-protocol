export type EconomicDemoScenarioId = "webpage" | "research" | "picture";

export type PaymentAsset = "USDC" | "SOL";

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

export type EconomicDemoQuote = {
  currency: "USDC";
  downstreamFeesUsdc: number;
  attestorFeesUsdc: number;
  orchestratorMarkupUsdc: number;
  jupiterSwapAllowanceUsdc: number;
  totalUsdc: number;
  solEstimate: number;
  slippageBps: number;
};

export type BudgetLedgerEntry = {
  label: string;
  from: string;
  to: string;
  amountUsdc: number;
  category: "user-funding" | "swap" | "downstream" | "attestation" | "markup" | "refund";
};

export type VisualFlowEdge = {
  from: string;
  to: string;
  label: string;
  payload: string;
  paymentUsdc: number;
  status: "quoted" | "funded" | "reserved" | "paid" | "attested" | "returned" | "blocked";
};

export type EconomicDemoScenario = {
  id: EconomicDemoScenarioId;
  title: string;
  prompt: string;
  orchestrator: string;
  mode: "fixture-zero-spend" | "planned-dry-run" | "adapter-required";
  finalOutputType: "webpage" | "article" | "image-brief";
  finalOutputSummary: string;
  quote: EconomicDemoQuote;
  budgetLedger: BudgetLedgerEntry[];
  communicationFlow: VisualFlowEdge[];
  agents: Array<{ profileId: string; role: WalletBalance["role"]; description: string }>;
  edges: EconomicEdge[];
  balances: WalletBalance[];
  guardrails: string[];
};

export type EconomicRunReportPaymentReceipt = {
  from: string;
  to: string;
  purpose: string;
  amountUsdc: number;
  inputAsset?: PaymentAsset;
  outputAsset?: "USDC";
  inputAmount?: number;
  proofStatus: "fixture" | "local-surfpool" | "devnet-verified" | "pending-live-receipt";
  transactionAddress: string;
};

export type EconomicRunReportAttestation = {
  attestorProfileId: string;
  validatesProfileId: string;
  validation: string;
  result: "release_recommended" | "needs_revision" | "blocked";
  attestationReceipt: string;
};

export type EconomicRunReportReputationEvent = {
  profileId: string;
  beforeScore: number;
  committedScore: number;
  afterScore: number;
  commitTx: string;
  revealTx: string;
  status: "fixture_commit_reveal" | "devnet_verified" | "pending_live_reveal";
};

export type EconomicRunReport = {
  scenarioId: EconomicDemoScenarioId;
  title: string;
  narrative: string;
  jupiterSwapProof: EconomicRunReportPaymentReceipt;
  specialistCalls: Array<{
    step: number;
    specialistProfileId: string;
    capability: string;
    payloadSummary: string;
    paymentReceipt: EconomicRunReportPaymentReceipt;
    validation: EconomicRunReportAttestation | null;
  }>;
  paymentReceipts: EconomicRunReportPaymentReceipt[];
  attestations: EconomicRunReportAttestation[];
  reputationEvents: EconomicRunReportReputationEvent[];
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
    quote: { currency: "USDC", downstreamFeesUsdc: 2, attestorFeesUsdc: 0.5, orchestratorMarkupUsdc: 0.75, jupiterSwapAllowanceUsdc: 0.08, totalUsdc: 3.33, solEstimate: 0.021, slippageBps: 75 },
    budgetLedger: [
      { label: "Upfront activity fee", from: "end-user", to: "agentic-workflow-system", amountUsdc: 3.33, category: "user-funding" },
      { label: "Reserved copy specialist budget", from: "agentic-workflow-system", to: "content-creation-agent", amountUsdc: 1, category: "downstream" },
      { label: "Reserved code specialist budget", from: "agentic-workflow-system", to: "code-generation-agent", amountUsdc: 1, category: "downstream" },
      { label: "Reserved attestation budget", from: "agentic-workflow-system", to: "verification-validation-agent", amountUsdc: 0.5, category: "attestation" },
      { label: "Orchestrator retained markup", from: "agentic-workflow-system", to: "agentic-workflow-system", amountUsdc: 0.75, category: "markup" },
      { label: "SOL route swap/slippage allowance", from: "Jupiter", to: "agentic-workflow-system", amountUsdc: 0.08, category: "swap" },
    ],
    communicationFlow: [
      { from: "end-user", to: "agentic-workflow-system", label: "fund and request", payload: "Goal, audience, tone, payment asset, and run budget.", paymentUsdc: 3.33, status: "funded" },
      { from: "agentic-workflow-system", to: "content-creation-agent", label: "buy copy", payload: "Bakery positioning, section list, and CTA requirements.", paymentUsdc: 1, status: "paid" },
      { from: "agentic-workflow-system", to: "code-generation-agent", label: "buy code", payload: "Approved copy plus responsive layout constraints.", paymentUsdc: 1, status: "paid" },
      { from: "agentic-workflow-system", to: "verification-validation-agent", label: "buy attestation", payload: "Final page draft, acceptance criteria, and receipt chain.", paymentUsdc: 0.5, status: "attested" },
      { from: "verification-validation-agent", to: "end-user", label: "return result", payload: "Release guidance, final output, and budget reconciliation.", paymentUsdc: 0, status: "returned" },
    ],
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
    orchestrator: "agentic-workflow-system",
    mode: "fixture-zero-spend",
    finalOutputType: "article",
    finalOutputSummary:
      "A structured article outline with evidence-gathering, synthesis, drafting, explainability, and verification steps.",
    quote: { currency: "USDC", downstreamFeesUsdc: 3, attestorFeesUsdc: 1, orchestratorMarkupUsdc: 1, jupiterSwapAllowanceUsdc: 0.12, totalUsdc: 5.12, solEstimate: 0.032, slippageBps: 75 },
    budgetLedger: [
      { label: "Upfront research activity fee", from: "end-user", to: "agentic-workflow-system", amountUsdc: 5.12, category: "user-funding" },
      { label: "Knowledge retrieval budget", from: "agentic-workflow-system", to: "knowledge-retrieval-agent", amountUsdc: 1, category: "downstream" },
      { label: "Scientific synthesis budget", from: "agentic-workflow-system", to: "scientific-research-agent", amountUsdc: 1, category: "downstream" },
      { label: "Drafting budget", from: "agentic-workflow-system", to: "content-creation-agent", amountUsdc: 1, category: "downstream" },
      { label: "Attestation/review budget", from: "agentic-workflow-system", to: "explainable-agent + verification-validation-agent", amountUsdc: 1, category: "attestation" },
      { label: "Orchestrator retained markup", from: "agentic-workflow-system", to: "agentic-workflow-system", amountUsdc: 1, category: "markup" },
      { label: "SOL route swap/slippage allowance", from: "Jupiter", to: "agentic-workflow-system", amountUsdc: 0.12, category: "swap" },
    ],
    communicationFlow: [
      { from: "end-user", to: "agentic-workflow-system", label: "fund and request", payload: "Topic, evidence standard, audience, payment asset, and budget envelope.", paymentUsdc: 5.12, status: "funded" },
      { from: "agentic-workflow-system", to: "knowledge-retrieval-agent", label: "buy retrieval", payload: "Search questions, source criteria, and citation requirements.", paymentUsdc: 1, status: "paid" },
      { from: "agentic-workflow-system", to: "scientific-research-agent", label: "buy synthesis", payload: "Source map, claim hierarchy, gaps, and caveats.", paymentUsdc: 1, status: "paid" },
      { from: "agentic-workflow-system", to: "content-creation-agent", label: "buy article", payload: "Evidence synthesis, angle, outline, and caveats.", paymentUsdc: 1, status: "paid" },
      { from: "agentic-workflow-system", to: "verification-validation-agent", label: "buy verification", payload: "Final article and cited evidence map.", paymentUsdc: 0.5, status: "attested" },
      { from: "verification-validation-agent", to: "end-user", label: "return article", payload: "Final article plus citation caveats and reconciliation.", paymentUsdc: 0, status: "returned" },
    ],
    agents: [
      { profileId: "end-user", role: "end-user", description: "Requests a research-backed article." },
      { profileId: "agentic-workflow-system", role: "orchestrator", description: "Coordinates the research graph and budget envelope." },
      { profileId: "scientific-research-agent", role: "specialist", description: "Owns evidence synthesis without self-orchestrating paid edges." },
      { profileId: "knowledge-retrieval-agent", role: "specialist", description: "Collects source summaries and citation candidates." },
      { profileId: "content-creation-agent", role: "specialist", description: "Turns synthesis into an article draft." },
      { profileId: "explainable-agent", role: "attestor", description: "Checks traceability and readability." },
      { profileId: "verification-validation-agent", role: "attestor", description: "Checks claims against evidence." },
    ],
    edges: [
      { from: "end-user", to: "agentic-workflow-system", capability: "research-orchestration", payloadSummary: "Topic, desired audience, evidence standard, and budget envelope.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-orchestrator" },
      { from: "agentic-workflow-system", to: "knowledge-retrieval-agent", capability: "knowledge-retrieval", payloadSummary: "Search questions, source criteria, and citation requirements.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-retrieval" },
      { from: "agentic-workflow-system", to: "scientific-research-agent", capability: "research-synthesis", payloadSummary: "Source map, claim hierarchy, evidence gaps, and caveat requirements.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-synthesis" },
      { from: "agentic-workflow-system", to: "content-creation-agent", capability: "article-drafting", payloadSummary: "Evidence synthesis, angle, outline, and caveats.", amountLamports: 1_000_000, status: "planned", receipt: "fixture:x402:challenge:research-draft" },
      { from: "agentic-workflow-system", to: "explainable-agent", capability: "explainability-review", payloadSummary: "Draft plus traceability checklist.", amountLamports: 500_000, status: "attested", receipt: "fixture:attestation:traceable" },
      { from: "agentic-workflow-system", to: "verification-validation-agent", capability: "claim-verification", payloadSummary: "Final article and cited evidence map.", amountLamports: 500_000, status: "attested", receipt: "fixture:attestation:release-recommended" },
    ],
    balances: [
      { profileId: "end-user", role: "end-user", wallet: USER_WALLET, startingLamports: 12_000_000, endingLamports: 7_000_000 },
      { profileId: "agentic-workflow-system", role: "orchestrator", wallet: "AgenticWorkflow111111111111111111111111111", startingLamports: 4_000_000, endingLamports: 4_000_000 },
      { profileId: "scientific-research-agent", role: "specialist", wallet: "ScientificResearch111111111111111111111111", startingLamports: 3_000_000, endingLamports: 4_000_000 },
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
    quote: { currency: "USDC", downstreamFeesUsdc: 0.5, attestorFeesUsdc: 0.25, orchestratorMarkupUsdc: 0.5, jupiterSwapAllowanceUsdc: 0.05, totalUsdc: 1.3, solEstimate: 0.008, slippageBps: 75 },
    budgetLedger: [
      { label: "Upfront picture activity fee", from: "end-user", to: "tool-using-agent", amountUsdc: 1.3, category: "user-funding" },
      { label: "Image adapter budget", from: "tool-using-agent", to: "image-generation-adapter", amountUsdc: 0, category: "downstream" },
      { label: "Vision validation budget", from: "tool-using-agent", to: "vision-language-agent", amountUsdc: 0.5, category: "downstream" },
      { label: "Attestation budget", from: "tool-using-agent", to: "verification-validation-agent", amountUsdc: 0.25, category: "attestation" },
      { label: "Orchestrator retained markup", from: "tool-using-agent", to: "tool-using-agent", amountUsdc: 0.5, category: "markup" },
      { label: "SOL route swap/slippage allowance", from: "Jupiter", to: "tool-using-agent", amountUsdc: 0.05, category: "swap" },
    ],
    communicationFlow: [
      { from: "end-user", to: "tool-using-agent", label: "fund and request", payload: "Prompt, style, safety constraints, payment asset, and budget cap.", paymentUsdc: 1.3, status: "funded" },
      { from: "tool-using-agent", to: "image-generation-adapter", label: "call image adapter", payload: "Adapter remains gated by env/provider approval.", paymentUsdc: 0, status: "blocked" },
      { from: "tool-using-agent", to: "vision-language-agent", label: "buy validation", payload: "Generated image or storyboard plus prompt criteria.", paymentUsdc: 0.5, status: "paid" },
      { from: "tool-using-agent", to: "verification-validation-agent", label: "buy release check", payload: "Validation result, image/storyboard receipt, and release/refund criteria.", paymentUsdc: 0.25, status: "attested" },
      { from: "verification-validation-agent", to: "end-user", label: "return visual", payload: "Image/storyboard, release guidance, and budget reconciliation.", paymentUsdc: 0, status: "returned" },
    ],
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

function fixtureTx(label: string) {
  return `fixture-local-tx:${label}`;
}

export function buildEconomicRunReport(scenario: EconomicDemoScenario): EconomicRunReport {
  const attestors = scenario.agents.filter((agent) => agent.role === "attestor");
  const specialistEdges = scenario.edges.filter((edge) => edge.to !== scenario.orchestrator && edge.status !== "blocked");
  const jupiterSwapProof: EconomicRunReportPaymentReceipt = {
    from: "end-user",
    to: scenario.orchestrator,
    purpose: "Jupiter SOL→USDC swap funds the run budget before downstream payments",
    amountUsdc: scenario.quote.totalUsdc,
    inputAsset: "SOL",
    outputAsset: "USDC",
    inputAmount: scenario.quote.solEstimate,
    proofStatus: "local-surfpool",
    transactionAddress: fixtureTx(`${scenario.id}:jupiter-swap:sol-to-usdc-budget`),
  };
  const paymentReceipts = [jupiterSwapProof, ...scenario.budgetLedger
    .filter((entry) => entry.category !== "markup" && entry.amountUsdc > 0)
    .map((entry): EconomicRunReportPaymentReceipt => ({
      from: entry.from,
      to: entry.to,
      purpose: entry.label,
      amountUsdc: entry.amountUsdc,
      proofStatus: "pending-live-receipt",
      transactionAddress: fixtureTx(`${scenario.id}:${entry.category}:${entry.from}->${entry.to}`),
    }))];
  const attestations = specialistEdges
    .filter((edge) => edge.capability.includes("attestation") || edge.capability.includes("verification") || edge.status === "attested")
    .map((edge, index): EconomicRunReportAttestation => ({
      attestorProfileId: edge.to,
      validatesProfileId: specialistEdges[Math.max(0, index - 1)]?.to ?? scenario.orchestrator,
      validation: `${edge.payloadSummary} Attestor checks payload, receipt chain, budget reconciliation, and release/refund criteria.`,
      result: edge.status === "blocked" ? "blocked" : "release_recommended",
      attestationReceipt: edge.receipt,
    }));
  const fallbackAttestor = attestors[0]?.profileId ?? "verification-validation-agent";
  const calls = specialistEdges
    .filter((edge) => !edge.capability.includes("attestation") && !edge.capability.includes("verification") && !edge.capability.includes("review"))
    .map((edge, index) => {
      const matchingPayment = paymentReceipts.find((receipt) => receipt.to === edge.to) ?? paymentReceipts[index + 1] ?? paymentReceipts[0];
      const validation = attestations.find((attestation) => attestation.validatesProfileId === edge.to) ?? {
        attestorProfileId: fallbackAttestor,
        validatesProfileId: edge.to,
        validation: `Attestor validates ${edge.to} output against acceptance criteria, payment receipt, and disclosure-ledger completeness.`,
        result: "release_recommended" as const,
        attestationReceipt: `fixture:attestation:${scenario.id}:${edge.to}:release-recommended`,
      };
      return {
        step: index + 1,
        specialistProfileId: edge.to,
        capability: edge.capability,
        payloadSummary: edge.payloadSummary,
        paymentReceipt: matchingPayment,
        validation,
      };
    });

  const reputationEvents = calls.map((call, index): EconomicRunReportReputationEvent => {
    const beforeScore = 72 + index * 4;
    const committedScore = call.validation?.result === "release_recommended" ? 5 : 2;
    return {
      profileId: call.specialistProfileId,
      beforeScore,
      committedScore,
      afterScore: beforeScore + committedScore,
      commitTx: fixtureTx(`${scenario.id}:reputation:${call.specialistProfileId}:commit`),
      revealTx: fixtureTx(`${scenario.id}:reputation:${call.specialistProfileId}:reveal`),
      status: "fixture_commit_reveal",
    };
  });

  return {
    scenarioId: scenario.id,
    title: `${scenario.title} run report`,
    narrative: "The user funds the activity, the orchestrator purchases specialist work, attestors validate outputs and receipts, then reputation changes are applied only after commit-reveal.",
    jupiterSwapProof,
    specialistCalls: calls,
    paymentReceipts,
    attestations,
    reputationEvents,
  };
}
