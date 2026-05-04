export type WebpageLiveWorkflowEvidenceEdge = {
  step: number;
  profileId: string;
  capability: string;
  endpoint: string;
  unpaidChallenge: {
    status: 402;
    network: "solana-devnet";
    payTo: string;
    amount: string;
    currency: "USDC";
    noncePresent: true;
  };
  paidCompletion: {
    status: 200;
    paymentSatisfied: true;
    model: string;
    outputPreview: string;
  };
};

export type WebpageLiveWorkflowEvidence = {
  schemaVersion: "reddi.economic-demo.webpage.live-x402-workflow.summary.v1";
  generatedAt: string;
  sourceArtifactPath: string;
  mode: "controlled_demo_receipt_multi_edge_webpage_workflow";
  scenarioId: "webpage";
  userRequest: string;
  conclusion: "multi_edge_paid_workflow_reached";
  downstreamCallsExecuted: 8;
  edges: WebpageLiveWorkflowEvidenceEdge[];
  blockers: [];
  guardrails: {
    exactEndpoints: true;
    noSignerMaterialUsed: true;
    noSignatureAttemptedByHarness: true;
    noDevnetTransferFromHarness: true;
    controlledDemoReceiptsOnly: true;
    boundedMaxDownstreamCalls: 8;
    noLiveCallsFromUi: true;
  };
  limitations: string[];
  nextStep: string;
};

export function getWebpageLiveWorkflowEvidence(): WebpageLiveWorkflowEvidence {
  return {
    schemaVersion: "reddi.economic-demo.webpage.live-x402-workflow.summary.v1",
    generatedAt: "2026-05-04T09:35:08.940Z",
    sourceArtifactPath: "artifacts/economic-demo-webpage-live-x402-workflow/20260504T093552Z/summary.json",
    mode: "controlled_demo_receipt_multi_edge_webpage_workflow",
    scenarioId: "webpage",
    userRequest:
      "Design me a webpage for a trustless AI agent marketplace where users pay specialist agents via x402 and receive attested outputs.",
    conclusion: "multi_edge_paid_workflow_reached",
    downstreamCallsExecuted: 8,
    edges: [
      {
        step: 1,
        profileId: "planning-agent",
        capability: "task-decomposition",
        endpoint: "https://reddi-planning-agent.preview.reddi.tech/v1/chat/completions",
        unpaidChallenge: {
          status: 402,
          network: "solana-devnet",
          payTo: "2wYpzbExNi2vHSdK48jBusfEx3WNVjzPFEVNcbCA5cAs",
          amount: "0.03",
          currency: "USDC",
          noncePresent: true,
        },
        paidCompletion: {
          status: 200,
          paymentSatisfied: true,
          model: "openai/gpt-4.1-mini-2025-04-14",
          outputPreview:
            "Produced a concise landing-page plan with hero/header, marketplace explanation, sections, calls to action, and acceptance criteria.",
        },
      },
      {
        step: 2,
        profileId: "content-creation-agent",
        capability: "marketing-copy",
        endpoint: "https://reddi-content-creation.preview.reddi.tech/v1/chat/completions",
        unpaidChallenge: {
          status: 402,
          network: "solana-devnet",
          payTo: "4RfVeJp8si1KunYbvf41i5cDjr2SEjNEHEknUMXSEvEE",
          amount: "0.025",
          currency: "USDC",
          noncePresent: true,
        },
        paidCompletion: {
          status: 200,
          paymentSatisfied: true,
          model: "openai/gpt-4.1-mini-2025-04-14",
          outputPreview:
            "Drafted headline, subheadline, and benefit bullets explaining trustless specialist hiring, x402 payments, and attested outputs.",
        },
      },
      {
        step: 3,
        profileId: "code-generation-agent",
        capability: "webpage-code",
        endpoint: "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
        unpaidChallenge: {
          status: 402,
          network: "solana-devnet",
          payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
          amount: "0.05",
          currency: "USDC",
          noncePresent: true,
        },
        paidCompletion: {
          status: 200,
          paymentSatisfied: true,
          model: "openai/gpt-4.1-mini-2025-04-14",
          outputPreview:
            "Returned a React/Tailwind landing-page component for the trustless AI agent marketplace plus validation notes.",
        },
      },
      {
        step: 4,
        profileId: "verification-validation-agent",
        capability: "attestation",
        endpoint: "https://reddi-verification-agent.preview.reddi.tech/v1/chat/completions",
        unpaidChallenge: {
          status: 402,
          network: "solana-devnet",
          payTo: "2EmtCTzhoSSorg2rRSnTbngGJqkqNufgtFUZRGU4iFWq",
          amount: "0.025",
          currency: "USDC",
          noncePresent: true,
        },
        paidCompletion: {
          status: 200,
          paymentSatisfied: true,
          model: "openai/gpt-4.1-mini-2025-04-14",
          outputPreview:
            "Assessed the evidence chain across planning, copy, code, and release criteria and returned release/refund/dispute guidance.",
        },
      },
    ],
    blockers: [],
    guardrails: {
      exactEndpoints: true,
      noSignerMaterialUsed: true,
      noSignatureAttemptedByHarness: true,
      noDevnetTransferFromHarness: true,
      controlledDemoReceiptsOnly: true,
      boundedMaxDownstreamCalls: 8,
      noLiveCallsFromUi: true,
    },
    limitations: [
      "Receipts are controlled demo receipts, not production USDC settlement verification.",
      "The UI reads this sanitized summary only; it does not call live specialist endpoints.",
      "Real devnet receipt verification remains a later phase.",
    ],
    nextStep: "Generate a judge-facing evidence pack and reconcile controlled receipt amounts with the ledger view.",
  };
}
