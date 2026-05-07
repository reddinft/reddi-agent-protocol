import {
  DEFAULT_UMBRA_PRIVATE_PAYMENT_INTENT,
  UMBRA_DEVNET_CONFIG,
  buildUmbraPrivatePaymentQuote,
  runUmbraPrivatePaymentAdapterContract,
  type UmbraPrivatePaymentDeps,
} from "@/lib/privacy/umbra/private-payment";

describe("Umbra private x402 payment adapter", () => {
  it("builds a devnet private-payment quote without weakening Quasar public settlement claims", () => {
    const quote = buildUmbraPrivatePaymentQuote(DEFAULT_UMBRA_PRIVATE_PAYMENT_INTENT);

    expect(quote).toMatchObject({
      rail: "private-umbra",
      network: "devnet",
      operation: "public-balance-to-receiver-claimable-utxo",
      protocolProgramId: UMBRA_DEVNET_CONFIG.programId,
      indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
      relayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
      requiresRegistration: true,
      requiresZkProver: true,
    });
    expect(quote.selectiveDisclosure.reveals).toContain("signatures");
    expect(quote.selectiveDisclosure.hides).toEqual(
      expect.arrayContaining(["recipientFinalWalletLink", "encryptedBalance", "utxoSecret"]),
    );
    expect(quote.claimBoundary).toContain("mocked/local proof only");
    expect(quote.claimBoundary).toContain("approval-gated devnet SDK smoke");
  });

  it("runs the receiver-claimable UTXO lifecycle through dependency-injected SDK operations", async () => {
    const calls: string[] = [];
    const deps: UmbraPrivatePaymentDeps = {
      async ensureRegistered(input) {
        calls.push(`register:${input.recipientProfileId}`);
        return { signatures: ["sig-register"] };
      },
      async createReceiverClaimableUtxo(input) {
        calls.push(`create:${input.amount}:${input.mint}`);
        return { signatures: ["sig-create-utxo"] };
      },
      async scanClaimable(input) {
        calls.push(`scan:${input.recipientProfileId}`);
        return { receivedCount: 1, publicReceivedCount: 0 };
      },
      async claimToEncryptedBalance(input) {
        calls.push(`claim:${input.recipientProfileId}`);
        return { signatures: ["sig-claim"] };
      },
    };

    const receipt = await runUmbraPrivatePaymentAdapterContract(DEFAULT_UMBRA_PRIVATE_PAYMENT_INTENT, deps);

    expect(calls).toEqual(["register:code-generation-agent", "create:10000:devnet-usdc-placeholder", "scan:code-generation-agent", "claim:code-generation-agent"]);
    expect(receipt).toMatchObject({
      schemaVersion: "reddi.umbra-private-x402.receipt.v1",
      x402Package: "reddi-x402",
      rail: "private-umbra",
      status: "mocked_adapter_contract",
      registrationSignatures: ["sig-register"],
      createUtxoSignatures: ["sig-create-utxo"],
      claimSignatures: ["sig-claim"],
      scan: { receivedCount: 1, publicReceivedCount: 0 },
      evidence: {
        sdkPackages: {
          sdk: "@umbra-privacy/sdk",
          webZkProver: "@umbra-privacy/web-zk-prover",
        },
        generatedBy: "dependency-injected-mock",
      },
    });
  });
});
