export type UmbraNetwork = "devnet" | "mainnet" | "localnet";

export type UmbraPrivatePaymentIntent = {
  x402Package: "reddi-x402";
  rail: "private-umbra";
  network: UmbraNetwork;
  payerProfileId: string;
  recipientProfileId: string;
  recipientAddress: string;
  mint: string;
  amount: string;
  currency: "USDC" | "USDT" | "wSOL" | "UMBRA";
  decimals: number;
  memo: string;
};

export type UmbraPrivatePaymentQuote = {
  rail: "private-umbra";
  network: UmbraNetwork;
  operation: "public-balance-to-receiver-claimable-utxo";
  protocolProgramId: string;
  indexerApiEndpoint: string;
  relayerApiEndpoint: string;
  requiresRegistration: true;
  requiresZkProver: true;
  selectiveDisclosure: {
    receiptType: "reddi.umbra-private-x402.receipt.v1";
    reveals: Array<"rail" | "network" | "mint" | "amount" | "recipientProfileId" | "operation" | "signatures">;
    hides: Array<"payerPublicAta" | "recipientFinalWalletLink" | "encryptedBalance" | "utxoSecret">;
  };
  claimBoundary: string;
};

export type UmbraPrivatePaymentReceipt = UmbraPrivatePaymentQuote & {
  schemaVersion: "reddi.umbra-private-x402.receipt.v1";
  x402Package: "reddi-x402";
  payerProfileId: string;
  recipientProfileId: string;
  recipientAddress: string;
  mint: string;
  amount: string;
  currency: UmbraPrivatePaymentIntent["currency"];
  status: "mocked_adapter_contract" | "devnet_submitted" | "devnet_claimed";
  registrationSignatures: string[];
  createUtxoSignatures: string[];
  scan: {
    receivedCount: number;
    publicReceivedCount: number;
    treeStart: number;
    cursorStart: number;
  };
  claimSignatures: string[];
  evidence: {
    sdkPackages: {
      sdk: "@umbra-privacy/sdk";
      webZkProver: "@umbra-privacy/web-zk-prover";
    };
    docsPath: string;
    generatedBy: "dependency-injected-mock" | "umbra-sdk-devnet";
  };
};

export type UmbraPrivatePaymentDeps = {
  ensureRegistered(input: UmbraPrivatePaymentIntent): Promise<{ signatures: string[] }>;
  createReceiverClaimableUtxo(input: UmbraPrivatePaymentIntent): Promise<{ signatures: string[] }>;
  scanClaimable(input: UmbraPrivatePaymentIntent): Promise<{ receivedCount: number; publicReceivedCount: number }>;
  claimToEncryptedBalance(input: UmbraPrivatePaymentIntent): Promise<{ signatures: string[] }>;
};

export const UMBRA_DEVNET_CONFIG = {
  network: "devnet" as const,
  programId: "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ",
  indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
  relayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
  docsPath: "ingests/umbra-docs-2026-05-07/two-deep-sdk/raw-md/llms_full_txt.md",
};

export const DEFAULT_UMBRA_PRIVATE_PAYMENT_INTENT: UmbraPrivatePaymentIntent = {
  x402Package: "reddi-x402",
  rail: "private-umbra",
  network: "devnet",
  payerProfileId: "agentic-workflow-system",
  recipientProfileId: "code-generation-agent",
  recipientAddress: "RecipientWalletAddressHere",
  mint: "devnet-usdc-placeholder",
  amount: "10000",
  currency: "USDC",
  decimals: 6,
  memo: "Reddi Agent Protocol private x402 payment intent for Umbra side-track demo.",
};

export function buildUmbraPrivatePaymentQuote(intent: UmbraPrivatePaymentIntent): UmbraPrivatePaymentQuote {
  return {
    rail: "private-umbra",
    network: intent.network,
    operation: "public-balance-to-receiver-claimable-utxo",
    protocolProgramId: UMBRA_DEVNET_CONFIG.programId,
    indexerApiEndpoint: UMBRA_DEVNET_CONFIG.indexerApiEndpoint,
    relayerApiEndpoint: UMBRA_DEVNET_CONFIG.relayerApiEndpoint,
    requiresRegistration: true,
    requiresZkProver: true,
    selectiveDisclosure: {
      receiptType: "reddi.umbra-private-x402.receipt.v1",
      reveals: ["rail", "network", "mint", "amount", "recipientProfileId", "operation", "signatures"],
      hides: ["payerPublicAta", "recipientFinalWalletLink", "encryptedBalance", "utxoSecret"],
    },
    claimBoundary:
      "Umbra private x402 adapter contract: mocked/local proof only until an approval-gated devnet SDK smoke submits registration, UTXO creation, scan, and claim transactions.",
  };
}

export function createMockUmbraPrivatePaymentDeps(): UmbraPrivatePaymentDeps {
  return {
    async ensureRegistered(input) {
      return { signatures: [`mock-umbra-devnet-register:${input.recipientProfileId}`] };
    },
    async createReceiverClaimableUtxo(input) {
      return { signatures: [`mock-umbra-devnet-create-utxo:${input.payerProfileId}:${input.recipientProfileId}:${input.amount}`] };
    },
    async scanClaimable() {
      return { receivedCount: 1, publicReceivedCount: 0 };
    },
    async claimToEncryptedBalance(input) {
      return { signatures: [`mock-umbra-devnet-claim-encrypted:${input.recipientProfileId}`] };
    },
  };
}

export async function runUmbraPrivatePaymentAdapterContract(
  intent: UmbraPrivatePaymentIntent = DEFAULT_UMBRA_PRIVATE_PAYMENT_INTENT,
  deps: UmbraPrivatePaymentDeps = createMockUmbraPrivatePaymentDeps(),
): Promise<UmbraPrivatePaymentReceipt> {
  const quote = buildUmbraPrivatePaymentQuote(intent);
  const registration = await deps.ensureRegistered(intent);
  const created = await deps.createReceiverClaimableUtxo(intent);
  const scan = await deps.scanClaimable(intent);
  const claimed = await deps.claimToEncryptedBalance(intent);

  return {
    schemaVersion: "reddi.umbra-private-x402.receipt.v1",
    x402Package: intent.x402Package,
    payerProfileId: intent.payerProfileId,
    recipientProfileId: intent.recipientProfileId,
    recipientAddress: intent.recipientAddress,
    mint: intent.mint,
    amount: intent.amount,
    currency: intent.currency,
    status: "mocked_adapter_contract",
    registrationSignatures: registration.signatures,
    createUtxoSignatures: created.signatures,
    scan: {
      receivedCount: scan.receivedCount,
      publicReceivedCount: scan.publicReceivedCount,
      treeStart: 0,
      cursorStart: 0,
    },
    claimSignatures: claimed.signatures,
    evidence: {
      sdkPackages: {
        sdk: "@umbra-privacy/sdk",
        webZkProver: "@umbra-privacy/web-zk-prover",
      },
      docsPath: UMBRA_DEVNET_CONFIG.docsPath,
      generatedBy: "dependency-injected-mock",
    },
    ...quote,
  };
}
