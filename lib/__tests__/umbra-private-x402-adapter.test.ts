import { createUmbraPrivatePaymentPlan, createUmbraX402Adapter } from "@/lib/privacy/umbra";
import type { UmbraPrivatePaymentIntent, UmbraSdkImports, UmbraZkProverImports } from "@/lib/privacy/umbra";

const intent: UmbraPrivatePaymentIntent = {
  id: "intent-umbra-x402-1",
  x402Nonce: "nonce-123",
  payerAddress: "payer-wallet",
  recipientAddress: "recipient-wallet",
  mint: "devnet-usdc-mint",
  amountBaseUnits: "1000000",
  network: "devnet",
  mode: "receiver-claimable-utxo",
};

describe("Umbra private x402 adapter boundary", () => {
  it("plans receiver-claimable UTXO payments without claiming Quasar-native execution", () => {
    const plan = createUmbraPrivatePaymentPlan(intent);

    expect(plan.schemaVersion).toBe("reddi.umbra-private-x402.plan.v1");
    expect(plan.endpoints.programId).toBe("DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ");
    expect(plan.endpoints.indexerApiEndpoint).toBe("https://utxo-indexer.api-devnet.umbraprivacy.com");
    expect(plan.endpoints.relayerApiEndpoint).toBe("https://relayer.api-devnet.umbraprivacy.com");
    expect(plan.operations).toEqual(expect.arrayContaining(["create_receiver_claimable_utxo_from_public_balance", "recipient_scans_indexer_and_claims_via_relayer"]));
    expect(plan.evidenceExpectation.claimBoundary).toMatch(/SDK-level private x402 settlement adapter lane/i);
    expect(plan.evidenceExpectation.notClaimed).toEqual(expect.arrayContaining(["Quasar-native Umbra execution", "MagicBlock PER settlement", "Pay.sh settlement"]));
  });

  it("keeps SDK execution dependency-injected and emits bounded receipts", async () => {
    const calls: string[] = [];
    const sdk: UmbraSdkImports = {
      getUmbraClient: jest.fn(async () => ({ client: true })),
      getUserRegistrationFunction: jest.fn(() => async () => ["register-tx"]),
      getPublicBalanceToEncryptedBalanceDirectDepositorFunction: jest.fn(() => async () => ({ queueSignature: "queue-tx", callbackSignature: "callback-tx" })),
      getPublicBalanceToReceiverClaimableUtxoCreatorFunction: jest.fn((_args, deps) => async (args) => {
        calls.push(`utxo:${String(args.destinationAddress)}:${Boolean(deps.zkProver)}`);
        return ["utxo-tx"];
      }),
      getClaimableUtxoScannerFunction: jest.fn(() => async () => ({ publicReceived: [{ leafIndex: 1n }] })),
      getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction: jest.fn((_args, deps) => async () => {
        calls.push(`claim:${Boolean(deps.zkProver)}:${Boolean(deps.relayer)}`);
        return { signatures: { 0: ["claim-tx"] } };
      }),
      getUmbraRelayer: jest.fn(() => ({ relayer: true })),
    };
    const provers: UmbraZkProverImports = {
      getUserRegistrationProver: jest.fn(() => ({ prover: "registration" })),
      getCreateReceiverClaimableUtxoFromPublicBalanceProver: jest.fn(() => ({ prover: "create-utxo" })),
      getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver: jest.fn(() => ({ prover: "claim-utxo" })),
    };

    const adapter = createUmbraX402Adapter({ sdk, provers });
    const createReceipt = await adapter.createReceiverClaimableUtxo({ client: true }, intent);
    const claimReceipt = await adapter.claimReceiverUtxosToEncryptedBalance({ client: true }, intent, [{ leafIndex: 1n }]);

    expect(calls).toEqual(["utxo:recipient-wallet:true", "claim:true:true"]);
    expect(createReceipt).toMatchObject({ operation: "utxo_created", signatures: ["utxo-tx"] });
    expect(claimReceipt).toMatchObject({ operation: "utxo_claimed", signatures: ["claim-tx"] });
    expect(claimReceipt.claimBoundary).toMatch(/does not prove mainnet private settlement/i);
  });
});
