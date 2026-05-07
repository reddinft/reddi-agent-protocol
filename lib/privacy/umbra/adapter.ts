import { UMBRA_NETWORKS, UMBRA_PRIVATE_X402_BOUNDARY, type UmbraNetworkConfig } from "./config";
import type {
  UmbraClientArgs,
  UmbraPrivatePaymentIntent,
  UmbraPrivatePaymentPlan,
  UmbraPrivatePaymentReceipt,
  UmbraSdkImports,
  UmbraZkProverImports,
} from "./types";

export type UmbraX402AdapterDeps = {
  sdk?: UmbraSdkImports;
  provers?: UmbraZkProverImports;
  networkConfig?: Partial<Record<UmbraPrivatePaymentIntent["network"], UmbraNetworkConfig>>;
};

export async function loadUmbraSdkImports(): Promise<UmbraSdkImports> {
  const sdk = (await import("@umbra-privacy/sdk")) as unknown as UmbraSdkImports;
  return sdk;
}

export async function loadUmbraZkProverImports(): Promise<UmbraZkProverImports> {
  const provers = (await import("@umbra-privacy/web-zk-prover")) as unknown as UmbraZkProverImports;
  return provers;
}

export function createUmbraPrivatePaymentPlan(
  intent: UmbraPrivatePaymentIntent,
  deps: Pick<UmbraX402AdapterDeps, "networkConfig"> = {},
): UmbraPrivatePaymentPlan {
  const network = deps.networkConfig?.[intent.network] ?? (intent.network === "mainnet" || intent.network === "devnet" ? UMBRA_NETWORKS[intent.network] : undefined);
  const operations = [
    "derive_or_load_umbra_master_seed",
    "register_confidential_and_anonymous_identity_if_needed",
    intent.mode === "encrypted-balance-transfer"
      ? "deposit_public_balance_into_recipient_encrypted_balance"
      : "create_receiver_claimable_utxo_from_public_balance",
    intent.mode === "receiver-claimable-utxo" ? "recipient_scans_indexer_and_claims_via_relayer" : "record_encrypted_balance_payment_receipt",
    "emit_selective_disclosure_receipt_boundary",
  ];

  return {
    schemaVersion: "reddi.umbra-private-x402.plan.v1",
    intent,
    operations,
    endpoints: {
      programId: network?.programId,
      indexerApiEndpoint: network?.indexerApiEndpoint,
      relayerApiEndpoint: network?.relayerApiEndpoint,
    },
    evidenceExpectation: {
      signatures: [],
      selectiveDisclosure: "planned",
      claimBoundary: `${UMBRA_PRIVATE_X402_BOUNDARY} ${network?.claimBoundary ?? "Localnet/custom Umbra config requires explicit operator validation."}`,
      notClaimed: [
        "Quasar-native Umbra execution",
        "MagicBlock PER settlement",
        "Pay.sh settlement",
        "mainnet private settlement without approval",
      ],
    },
  };
}

export function createUmbraX402Adapter(deps: UmbraX402AdapterDeps = {}) {
  return {
    plan: (intent: UmbraPrivatePaymentIntent) => createUmbraPrivatePaymentPlan(intent, deps),

    async createClient(args: UmbraClientArgs) {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      return sdk.getUmbraClient(args);
    },

    async register(client: unknown, options: { anonymous?: boolean; confidential?: boolean } = {}) {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      const provers = deps.provers ?? (await loadUmbraZkProverImports());
      const register = sdk.getUserRegistrationFunction(
        { client },
        options.anonymous === false ? undefined : { zkProver: provers.getUserRegistrationProver() },
      );
      return register({ confidential: options.confidential ?? true, anonymous: options.anonymous ?? true });
    },

    async shieldPublicBalance(client: unknown, intent: UmbraPrivatePaymentIntent): Promise<UmbraPrivatePaymentReceipt> {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      const deposit = sdk.getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
      const result = (await deposit(intent.recipientAddress, intent.mint, BigInt(intent.amountBaseUnits))) as { queueSignature?: string; callbackSignature?: string };
      return receiptFromSignatures(intent, "shielded", [result.queueSignature, result.callbackSignature]);
    },

    async createReceiverClaimableUtxo(client: unknown, intent: UmbraPrivatePaymentIntent): Promise<UmbraPrivatePaymentReceipt> {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      const provers = deps.provers ?? (await loadUmbraZkProverImports());
      const createUtxo = sdk.getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
        { client },
        { zkProver: provers.getCreateReceiverClaimableUtxoFromPublicBalanceProver() },
      );
      const signatures = await createUtxo({
        destinationAddress: intent.recipientAddress,
        mint: intent.mint,
        amount: BigInt(intent.amountBaseUnits),
      });
      return receiptFromSignatures(intent, "utxo_created", signatures);
    },

    async scanClaimableUtxos(client: unknown, treeIndex = 0, startInsertionIndex = 0, endInsertionIndex?: number) {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      const scan = sdk.getClaimableUtxoScannerFunction({ client });
      return scan(treeIndex, startInsertionIndex, endInsertionIndex);
    },

    async claimReceiverUtxosToEncryptedBalance(client: unknown, intent: UmbraPrivatePaymentIntent, utxos: readonly unknown[]): Promise<UmbraPrivatePaymentReceipt> {
      const sdk = deps.sdk ?? (await loadUmbraSdkImports());
      const provers = deps.provers ?? (await loadUmbraZkProverImports());
      const network = deps.networkConfig?.[intent.network] ?? (intent.network === "mainnet" || intent.network === "devnet" ? UMBRA_NETWORKS[intent.network] : undefined);
      if (!network?.relayerApiEndpoint) throw new Error(`Umbra relayer endpoint is required for ${intent.network} claims.`);
      const relayer = sdk.getUmbraRelayer({ apiEndpoint: network.relayerApiEndpoint });
      const claim = sdk.getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
        { client },
        { zkProver: provers.getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver(), relayer },
      );
      const result = (await claim(utxos)) as { signatures?: Record<string, string[]> };
      return receiptFromSignatures(intent, "utxo_claimed", Object.values(result.signatures ?? {}).flat());
    },
  };
}

function receiptFromSignatures(
  intent: UmbraPrivatePaymentIntent,
  operation: UmbraPrivatePaymentReceipt["operation"],
  signatures: readonly (string | undefined)[],
): UmbraPrivatePaymentReceipt {
  const network = intent.network === "mainnet" || intent.network === "devnet" ? UMBRA_NETWORKS[intent.network] : undefined;
  return {
    schemaVersion: "reddi.umbra-private-x402.receipt.v1",
    intentId: intent.id,
    mode: intent.mode,
    network: intent.network,
    signatures: signatures.filter((signature): signature is string => Boolean(signature)),
    operation,
    claimBoundary: `${UMBRA_PRIVATE_X402_BOUNDARY} ${network?.claimBoundary ?? "Custom network receipt requires operator validation."}`,
  };
}
