import type { UmbraNetwork } from "./config";

export type UmbraPrivatePaymentMode =
  | "encrypted-balance-transfer"
  | "receiver-claimable-utxo";

export type UmbraPrivatePaymentIntent = {
  id: string;
  x402Nonce: string;
  payerAddress: string;
  recipientAddress: string;
  mint: string;
  amountBaseUnits: string;
  network: UmbraNetwork;
  mode: UmbraPrivatePaymentMode;
  optionalData?: string;
};

export type UmbraPrivatePaymentPlan = {
  schemaVersion: "reddi.umbra-private-x402.plan.v1";
  intent: UmbraPrivatePaymentIntent;
  operations: string[];
  endpoints: {
    programId?: string;
    indexerApiEndpoint?: string;
    relayerApiEndpoint?: string;
  };
  evidenceExpectation: {
    signatures: string[];
    selectiveDisclosure: "planned" | "available";
    claimBoundary: string;
    notClaimed: string[];
  };
};

export type UmbraPrivatePaymentReceipt = {
  schemaVersion: "reddi.umbra-private-x402.receipt.v1";
  intentId: string;
  mode: UmbraPrivatePaymentMode;
  network: UmbraNetwork;
  signatures: string[];
  operation: "registered" | "shielded" | "utxo_created" | "utxo_claimed";
  claimBoundary: string;
};

export type UmbraClientArgs = {
  signer: unknown;
  network: UmbraNetwork;
  rpcUrl: string;
  rpcSubscriptionsUrl: string;
  indexerApiEndpoint?: string;
  deferMasterSeedSignature?: boolean;
};

export type UmbraSdkImports = {
  getUmbraClient: (args: UmbraClientArgs, deps?: Record<string, unknown>) => Promise<unknown>;
  getUserRegistrationFunction: (args: { client: unknown }, deps?: Record<string, unknown>) => (options?: Record<string, unknown>) => Promise<string[]>;
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction: (args: { client: unknown }, deps?: Record<string, unknown>) => (destinationAddress: string, mint: string, transferAmount: bigint, options?: Record<string, unknown>) => Promise<unknown>;
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction: (args: { client: unknown }, deps: Record<string, unknown>) => (args: Record<string, unknown>, options?: Record<string, unknown>) => Promise<string[]>;
  getClaimableUtxoScannerFunction: (args: { client: unknown }, deps?: Record<string, unknown>) => (treeIndex: number, startInsertionIndex: number, endInsertionIndex?: number) => Promise<unknown>;
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction: (args: { client: unknown }, deps: Record<string, unknown>) => (utxos: readonly unknown[], optionalData?: Uint8Array) => Promise<unknown>;
  getUmbraRelayer: (args: { apiEndpoint: string }) => unknown;
};

export type UmbraZkProverImports = {
  getUserRegistrationProver: () => unknown;
  getCreateReceiverClaimableUtxoFromPublicBalanceProver: () => unknown;
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver: () => unknown;
};
