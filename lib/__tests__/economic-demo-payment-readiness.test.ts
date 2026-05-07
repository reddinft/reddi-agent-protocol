import { getEconomicDemoPaymentReadiness } from "@/lib/economic-demo/payment-readiness";

describe("economic demo payment readiness", () => {
  it("records the controlled paid-completion success without triggering live retries", () => {
    const readiness = getEconomicDemoPaymentReadiness();

    expect(readiness.status).toBe("ready");
    expect(readiness.blocker).toBeUndefined();
    expect(readiness.liveChallenge).toMatchObject({
      reachable: true,
      network: "solana-devnet",
      payTo: "8qSuegJzQ9QGWnXZve5fKahq4rDm6K3o9wEnKLkXp3To",
      amount: "0.05",
      currency: "USDC",
      nonceObserved: true,
    });
    expect(readiness.paidCompletion).toMatchObject({
      reached: true,
      lastAttemptStatus: 200,
      paymentSatisfied: true,
    });
    expect(readiness.guardrails).toMatchObject({
      noAutomaticLiveRetry: true,
      noSignerMaterialInProbe: true,
      noDevnetTransferFromProbe: true,
      maxProbeCalls: 2,
    });
    expect(readiness.evidence.localArtifactPath).toContain("20260504T085951Z");
  });

  it("surfaces proven Pay.sh reddi-x402 compatibility while keeping sessions and splits as probes", () => {
    const readiness = getEconomicDemoPaymentReadiness();

    expect(readiness.payShCompatibility).toMatchObject({
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
    });
    expect(readiness.payShCompatibility.claimBoundary).toContain("no mainnet funds");
    expect(readiness.payShCompatibility.claimBoundary).toContain("no MagicBlock PER settlement");
    expect(readiness.payShCompatibility.extensions).toHaveLength(2);
    expect(readiness.payShCompatibility.extensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "capped_sessions", status: "probe_only", blocker: "pay_sh_0_16_returns_402_after_payment" }),
        expect.objectContaining({ id: "split_payments", status: "probe_only", blocker: "pay_sh_0_16_returns_402_after_payment" }),
      ]),
    );
  });

  it("surfaces Umbra as an implemented private x402 adapter contract without claiming live settlement", () => {
    const readiness = getEconomicDemoPaymentReadiness();

    expect(readiness.umbraPrivatePayment).toMatchObject({
      packageName: "reddi-x402",
      rail: "private-umbra",
      network: "devnet",
      status: "adapter_contract_proven",
      operation: "public-balance-to-receiver-claimable-utxo",
      sdkPackages: ["@umbra-privacy/sdk", "@umbra-privacy/web-zk-prover"],
      programId: "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ",
      indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
      relayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
      evidenceArtifactPath: "artifacts/umbra-private-x402/20260507T074334Z/SUMMARY.md",
      nextGate: "approval_gated_devnet_sdk_smoke",
    });
    expect(readiness.umbraPrivatePayment.selectiveDisclosure.reveals).toContain("signatures");
    expect(readiness.umbraPrivatePayment.selectiveDisclosure.hides).toEqual(
      expect.arrayContaining(["recipientFinalWalletLink", "encryptedBalance", "utxoSecret"]),
    );
    expect(readiness.umbraPrivatePayment.claimBoundary).toContain("no live/devnet Umbra settlement is claimed");
  });
});
