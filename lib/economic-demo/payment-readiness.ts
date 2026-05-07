export type EconomicDemoPaymentReadiness = {
  mode: "live_x402_payment_readiness";
  profileId: "code-generation-agent";
  endpoint: string;
  status: "blocked" | "ready";
  blocker?: "demo_payment_disabled" | "real_receipt_verifier_unavailable" | "unknown";
  liveChallenge: {
    reachable: boolean;
    network: "solana-devnet";
    payTo: string;
    amount: string;
    currency: string;
    nonceObserved: boolean;
  };
  paidCompletion: {
    reached: boolean;
    lastAttemptStatus: number;
    lastAttemptErrorCode?: "demo_payment_disabled" | "http_502" | "unknown";
    paymentSatisfied: boolean;
  };
  guardrails: {
    noAutomaticLiveRetry: true;
    noSignerMaterialInProbe: true;
    noDevnetTransferFromProbe: true;
    maxProbeCalls: 2;
  };
  evidence: {
    generatedAt: string;
    localArtifactPath: string;
    pr?: string;
    operationalChange?: string;
  };
  payShCompatibility: {
    packageName: "reddi-x402";
    providerSpecPath: string;
    registryMetadataPath: string;
    evidenceArtifactPath: string;
    sandboxStatus: "proven_single_charge";
    plainCurlStatus: "402 Payment Required";
    paidRetryStatus: "200 OK";
    receiptStatus: "success";
    receiptMethod: "solana";
    priceUsd: 0.01;
    currencies: ["USDC", "USDT"];
    claimBoundary: string;
    extensions: Array<{
      id: "capped_sessions" | "split_payments";
      status: "probe_only";
      observed: string;
      blocker: "pay_sh_0_16_returns_402_after_payment";
      evidenceArtifactPath: string;
    }>;
  };
  umbraPrivatePayment: {
    packageName: "reddi-x402";
    rail: "private-umbra";
    network: "devnet";
    status: "adapter_contract_plus_devnet_encrypted_balance_deposit";
    operation: "public-balance-to-receiver-claimable-utxo";
    sdkPackages: ["@umbra-privacy/sdk", "@umbra-privacy/web-zk-prover"];
    programId: string;
    indexerApiEndpoint: string;
    relayerApiEndpoint: string;
    evidenceArtifactPath: string;
    devnetEvidenceArtifactPath: string;
    selectiveDisclosure: {
      receiptType: "reddi.umbra-private-x402.receipt.v1";
      reveals: string[];
      hides: string[];
    };
    claimBoundary: string;
    nextGate: "receiver_claimable_utxo_devnet_claim_smoke";
  };
  nextOptions: Array<{
    id: "multi_edge_webpage_workflow" | "real_devnet_receipt_verifier" | "pay_sh_registry_publish";
    label: string;
    tradeoff: string;
  }>;
};

export function getEconomicDemoPaymentReadiness(): EconomicDemoPaymentReadiness {
  return {
    mode: "live_x402_payment_readiness",
    profileId: "code-generation-agent",
    endpoint: "https://reddi-code-generation.preview.reddi.tech/v1/chat/completions",
    status: "ready",
    liveChallenge: {
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    },
    paidCompletion: {
      reached: true,
      lastAttemptStatus: 200,
      paymentSatisfied: true,
    },
    guardrails: {
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    },
    evidence: {
      generatedAt: "2026-05-04T09:00:02.570Z",
      localArtifactPath: "artifacts/economic-demo-live-x402-readiness/20260504T085951Z/summary.json",
      pr: "https://github.com/nissan/reddi-agent-protocol/pull/195",
      operationalChange: "Controlled demo receipts enabled for the hosted code-generation specialist in Coolify; code-generation model slug corrected from unavailable anthropic/claude-3.5-sonnet to openai/gpt-4.1-mini.",
    },
    payShCompatibility: {
      packageName: "reddi-x402",
      providerSpecPath: "config/pay-sh/reddi-x402-economic-demo-provider.yml",
      registryMetadataPath: "providers/redditech/reddi-agent-protocol/reddi-x402-economic-demo-provider.md",
      evidenceArtifactPath: "artifacts/pay-sh-reddi-x402/20260507T064842Z/SUMMARY.md",
      sandboxStatus: "proven_single_charge",
      plainCurlStatus: "402 Payment Required",
      paidRetryStatus: "200 OK",
      receiptStatus: "success",
      receiptMethod: "solana",
      priceUsd: 0.01,
      currencies: ["USDC", "USDT"],
      claimBoundary:
        "Sandbox Pay.sh gateway compatibility only: no mainnet funds, no Umbra private settlement, and no MagicBlock PER settlement claimed from this lane.",
      extensions: [
        {
          id: "capped_sessions",
          status: "probe_only",
          observed: "Pay.sh emitted MPP session challenge metadata with a capped authorization request.",
          blocker: "pay_sh_0_16_returns_402_after_payment",
          evidenceArtifactPath: "artifacts/pay-sh-reddi-x402/20260507T065805Z-session-splits/SUMMARY.md",
        },
        {
          id: "split_payments",
          status: "probe_only",
          observed: "Pay.sh emitted MPP charge challenge metadata with downstream specialist split details.",
          blocker: "pay_sh_0_16_returns_402_after_payment",
          evidenceArtifactPath: "artifacts/pay-sh-reddi-x402/20260507T065908Z-splits/SUMMARY.md",
        },
      ],
    },
    umbraPrivatePayment: {
      packageName: "reddi-x402",
      rail: "private-umbra",
      network: "devnet",
      status: "adapter_contract_plus_devnet_encrypted_balance_deposit",
      operation: "public-balance-to-receiver-claimable-utxo",
      sdkPackages: ["@umbra-privacy/sdk", "@umbra-privacy/web-zk-prover"],
      programId: "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ",
      indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
      relayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
      evidenceArtifactPath: "artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.md",
      devnetEvidenceArtifactPath: "artifacts/umbra-devnet-smoke/20260507T075904Z/SUMMARY.md",
      selectiveDisclosure: {
        receiptType: "reddi.umbra-private-x402.receipt.v1",
        reveals: ["rail", "network", "mint", "amount", "recipientProfileId", "operation", "signatures"],
        hides: ["payerPublicAta", "recipientFinalWalletLink", "encryptedBalance", "utxoSecret"],
      },
      claimBoundary:
        "Umbra private x402 adapter + bounded devnet encrypted-balance deposit: SDK packages are installed/import-verified, adapter-contract evidence covers receiver-claimable UTXO receipt shape, and devnet smoke proves wSOL deposit into an encrypted balance. No mainnet/live-production settlement, Quasar-native Umbra execution, or MagicBlock PER settlement is claimed.",
      nextGate: "receiver_claimable_utxo_devnet_claim_smoke",
    },
    nextOptions: [
      {
        id: "multi_edge_webpage_workflow",
        label: "Promote the webpage path from single paid edge to multi-edge economic workflow",
        tradeoff: "Fastest judge-facing proof now that the first controlled paid completion reaches HTTP 200; still label receipts as controlled demo receipts until real settlement verification lands.",
      },
      {
        id: "real_devnet_receipt_verifier",
        label: "Implement real devnet receipt verification",
        tradeoff: "Stronger protocol proof; takes longer because the runtime must verify paid receipt semantics before OpenRouter execution.",
      },
      {
        id: "pay_sh_registry_publish",
        label: "Prepare public Pay.sh skills publishing",
        tradeoff: "Useful for agent discovery, but publish only after the external pay-skills workflow/version is confirmed and Nissan approves the external PR or registry action.",
      },
    ],
  };
}
