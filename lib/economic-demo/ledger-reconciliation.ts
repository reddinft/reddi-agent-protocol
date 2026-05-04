import { buildEconomicDemoDryRunPlan } from "@/lib/economic-demo/dry-run";
import { buildSurfpoolRehearsalReport } from "@/lib/economic-demo/surfpool-rehearsal";
import { getWebpageLiveWorkflowEvidence } from "@/lib/economic-demo/webpage-live-workflow-evidence";

export type EconomicDemoLedgerReconciliationEdge = {
  profileId: string;
  payeeWallet: string;
  challengeAmountUsdc: string;
  challengeAmountMicrousd: number;
  controlledReceiptStatus: "satisfied_demo_only";
  realSettlementStatus: "not_verified";
  surfpoolLocalTransferLamports: number;
  surfpoolTransferStatus: "planned_local_transfer_semantics";
};

export type EconomicDemoLedgerReconciliation = {
  schemaVersion: "reddi.economic-demo.ledger-reconciliation.v1";
  generatedAt: string;
  scenarioId: "webpage";
  mode: "controlled_demo_receipt_reconciliation";
  sourceEvidenceArtifactPath: string;
  edgeCount: 4;
  totals: {
    challengeAmountUsdc: string;
    challengeAmountMicrousd: number;
    controlledPaidCompletions: 4;
    realSettlementsVerified: 0;
    surfpoolLocalTransferLamports: number;
    surfpoolLocalTransferSol: string;
  };
  edges: EconomicDemoLedgerReconciliationEdge[];
  proofLayers: Array<{
    id: "x402_challenge" | "controlled_demo_receipt" | "surfpool_local_transfer" | "real_devnet_receipt_verifier";
    status: "complete" | "planned" | "not_implemented";
    summary: string;
  }>;
  guardrails: {
    noLiveCallsFromUi: true;
    noDevnetTransferFromUi: true;
    controlledDemoReceiptsClearlyLabeled: true;
    noProductionSettlementClaim: true;
  };
  nextStep: string;
};

function amountToMicrousd(amount: string): number {
  const [whole = "0", fraction = ""] = amount.split(".");
  const normalizedFraction = `${fraction}000000`.slice(0, 6);
  return Number.parseInt(whole, 10) * 1_000_000 + Number.parseInt(normalizedFraction, 10);
}

function microusdToAmount(microusd: number): string {
  const whole = Math.floor(microusd / 1_000_000);
  const fraction = String(microusd % 1_000_000).padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function lamportsToSol(lamports: number): string {
  return (lamports / 1_000_000_000).toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export function buildEconomicDemoLedgerReconciliation(): EconomicDemoLedgerReconciliation {
  const evidence = getWebpageLiveWorkflowEvidence();
  const surfpool = buildSurfpoolRehearsalReport(buildEconomicDemoDryRunPlan("webpage"));
  const surfpoolTransferByProfile = new Map(surfpool.transfers.map((transfer) => [transfer.toProfileId, transfer]));

  const edges = evidence.edges.map((edge): EconomicDemoLedgerReconciliationEdge => {
    const transfer = surfpoolTransferByProfile.get(edge.profileId);
    if (!transfer) throw new Error(`missing_surfpool_transfer:${edge.profileId}`);
    return {
      profileId: edge.profileId,
      payeeWallet: edge.unpaidChallenge.payTo,
      challengeAmountUsdc: edge.unpaidChallenge.amount,
      challengeAmountMicrousd: amountToMicrousd(edge.unpaidChallenge.amount),
      controlledReceiptStatus: "satisfied_demo_only",
      realSettlementStatus: "not_verified",
      surfpoolLocalTransferLamports: transfer.amountLamports,
      surfpoolTransferStatus: "planned_local_transfer_semantics",
    };
  });

  const challengeAmountMicrousd = edges.reduce((sum, edge) => sum + edge.challengeAmountMicrousd, 0);
  const surfpoolLocalTransferLamports = edges.reduce((sum, edge) => sum + edge.surfpoolLocalTransferLamports, 0);

  return {
    schemaVersion: "reddi.economic-demo.ledger-reconciliation.v1",
    generatedAt: "2026-05-04T10:38:40.306Z",
    scenarioId: "webpage",
    mode: "controlled_demo_receipt_reconciliation",
    sourceEvidenceArtifactPath: evidence.sourceArtifactPath,
    edgeCount: 4,
    totals: {
      challengeAmountUsdc: microusdToAmount(challengeAmountMicrousd),
      challengeAmountMicrousd,
      controlledPaidCompletions: 4,
      realSettlementsVerified: 0,
      surfpoolLocalTransferLamports,
      surfpoolLocalTransferSol: lamportsToSol(surfpoolLocalTransferLamports),
    },
    edges,
    proofLayers: [
      {
        id: "x402_challenge",
        status: "complete",
        summary: "Each hosted specialist returned an HTTP 402 x402 challenge with payee wallet, amount, currency, network, endpoint, and nonce.",
      },
      {
        id: "controlled_demo_receipt",
        status: "complete",
        summary: "Each specialist accepted a bounded controlled demo receipt and returned HTTP 200 completion evidence.",
      },
      {
        id: "surfpool_local_transfer",
        status: "complete",
        summary: "Surfpool/local rehearsal proves transfer semantics with deterministic local wallets and blocked-transfer zero-delta proof.",
      },
      {
        id: "real_devnet_receipt_verifier",
        status: "not_implemented",
        summary: "Production-style devnet USDC receipt verification is a later phase; this reconciliation makes no real-settlement claim.",
      },
    ],
    guardrails: {
      noLiveCallsFromUi: true,
      noDevnetTransferFromUi: true,
      controlledDemoReceiptsClearlyLabeled: true,
      noProductionSettlementClaim: true,
    },
    nextStep: "Use this reconciliation as the bridge into real devnet receipt verifier design, or proceed to research workflow with the same controlled-demo labeling.",
  };
}
