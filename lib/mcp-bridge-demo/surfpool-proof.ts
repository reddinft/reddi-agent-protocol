import { createHash } from "node:crypto";

export type RapMcpBridgeSurfpoolProof = {
  schemaVersion: "reddi.rap-mcp-bridge.surfpool-proof.v1";
  generatedAt: string;
  mode: "surfpool_local_proof_plan";
  networkProfile: "local-surfpool";
  claimBoundary: "local_validator_only_no_devnet_no_mainnet";
  quote: {
    schemaVersion: "reddi.quote.v1";
    quoteId: string;
    quoteAuthority: "bridge_synthetic";
    binding: false;
    termsHash: string;
    amount: "1.25";
    currency: "USDC";
    network: "local-surfpool";
  };
  localPaymentSemantics: {
    payerProfileId: "mcp-host-agent";
    payeeProfileId: "research-specialist";
    protocolTreasuryProfileId: "reddi-protocol-treasury";
    downstreamAmountLamports: number;
    protocolFeeBps: number;
    protocolFeeLamports: number;
    totalDebitLamports: number;
  };
  verification: {
    boundary: "local-surfpool";
    quoteTermsHash: "pass";
    localPaymentSemantics: "planned";
    devnetSettlement: "not_applicable";
    mainnetSettlement: "not_applicable";
  };
  disclosureLedger: {
    schemaVersion: "reddi.downstream-disclosure-ledger.v1";
    safePublicEvidenceOnly: true;
    entries: Array<{
      entryId: string;
      runId: string;
      quoteId: string;
      specialistWallet: string;
      capability: string;
      payloadClass: "prompt_summary";
      payloadHash: string;
      amount: "1.25";
      currency: "USDC";
      network: "local-surfpool";
      verificationStatus: "local_planned";
      evidenceRefs: string[];
    }>;
  };
  nextGate: "execute_local_surfpool_transactions_before_devnet";
};

function sha256(value: string) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonical(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value.normalize("NFC"));
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
}

export function buildRapMcpBridgeSurfpoolProof(): RapMcpBridgeSurfpoolProof {
  const quoteTerms = {
    amount: "1.25",
    currency: "USDC",
    network: "local-surfpool",
    capability: "research_synthesis_with_citations",
    requiredEvidence: ["sources", "terms_hash", "disclosure_ledger", "local_payment_semantics"],
  };
  const termsHash = sha256(canonical(quoteTerms));
  const taskHash = sha256("prompt_summary:market brief about paid specialist agents");
  const downstreamAmountLamports = 1_250_000;
  const protocolFeeBps = 5;
  const protocolFeeLamports = Math.round((downstreamAmountLamports * protocolFeeBps) / 10_000);
  const quoteId = "quote_rap_mcp_bridge_surfpool_research_001";

  return {
    schemaVersion: "reddi.rap-mcp-bridge.surfpool-proof.v1",
    generatedAt: new Date().toISOString(),
    mode: "surfpool_local_proof_plan",
    networkProfile: "local-surfpool",
    claimBoundary: "local_validator_only_no_devnet_no_mainnet",
    quote: {
      schemaVersion: "reddi.quote.v1",
      quoteId,
      quoteAuthority: "bridge_synthetic",
      binding: false,
      termsHash,
      amount: "1.25",
      currency: "USDC",
      network: "local-surfpool",
    },
    localPaymentSemantics: {
      payerProfileId: "mcp-host-agent",
      payeeProfileId: "research-specialist",
      protocolTreasuryProfileId: "reddi-protocol-treasury",
      downstreamAmountLamports,
      protocolFeeBps,
      protocolFeeLamports,
      totalDebitLamports: downstreamAmountLamports + protocolFeeLamports,
    },
    verification: {
      boundary: "local-surfpool",
      quoteTermsHash: "pass",
      localPaymentSemantics: "planned",
      devnetSettlement: "not_applicable",
      mainnetSettlement: "not_applicable",
    },
    disclosureLedger: {
      schemaVersion: "reddi.downstream-disclosure-ledger.v1",
      safePublicEvidenceOnly: true,
      entries: [
        {
          entryId: "ledger_rap_mcp_bridge_surfpool_001",
          runId: "planned_rap_mcp_bridge_surfpool_001",
          quoteId,
          specialistWallet: "DemoResearch111111111111111111111111111111111",
          capability: "research_synthesis_with_citations",
          payloadClass: "prompt_summary",
          payloadHash: taskHash,
          amount: "1.25",
          currency: "USDC",
          network: "local-surfpool",
          verificationStatus: "local_planned",
          evidenceRefs: [quoteId, termsHash],
        },
      ],
    },
    nextGate: "execute_local_surfpool_transactions_before_devnet",
  };
}
