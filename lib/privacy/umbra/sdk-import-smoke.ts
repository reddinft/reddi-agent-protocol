export const UMBRA_SDK_IMPORTS = [
  "getUmbraClient",
  "getUserRegistrationFunction",
  "getUserAccountQuerierFunction",
  "getPublicBalanceToEncryptedBalanceDirectDepositorFunction",
  "getPublicBalanceToReceiverClaimableUtxoCreatorFunction",
  "getClaimableUtxoScannerFunction",
  "getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction",
  "getUmbraRelayer",
] as const;

export const UMBRA_WEB_ZK_PROVER_IMPORTS = [
  "getUserRegistrationProver",
  "getCreateReceiverClaimableUtxoFromPublicBalanceProver",
  "getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver",
] as const;

export async function verifyUmbraSdkImports() {
  const [sdk, prover] = await Promise.all([import("@umbra-privacy/sdk"), import("@umbra-privacy/web-zk-prover")]);
  const missingSdk = UMBRA_SDK_IMPORTS.filter((name) => typeof sdk[name] !== "function");
  const missingProver = UMBRA_WEB_ZK_PROVER_IMPORTS.filter((name) => typeof prover[name] !== "function");
  return {
    ok: missingSdk.length === 0 && missingProver.length === 0,
    missingSdk,
    missingProver,
    sdkPackage: "@umbra-privacy/sdk",
    webZkProverPackage: "@umbra-privacy/web-zk-prover",
  };
}
