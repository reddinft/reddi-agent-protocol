const requiredSdkExports = [
  "getUmbraClient",
  "getUserRegistrationFunction",
  "getPublicBalanceToEncryptedBalanceDirectDepositorFunction",
  "getPublicBalanceToReceiverClaimableUtxoCreatorFunction",
  "getClaimableUtxoScannerFunction",
  "getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction",
  "getUmbraRelayer",
];

const requiredProverExports = [
  "getUserRegistrationProver",
  "getCreateReceiverClaimableUtxoFromPublicBalanceProver",
  "getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver",
];

function assertExports(moduleName, mod, names) {
  const missing = names.filter((name) => typeof mod[name] !== "function");
  if (missing.length) {
    throw new Error(`${moduleName} missing function exports: ${missing.join(", ")}`);
  }
}

const sdk = await import("@umbra-privacy/sdk");
const provers = await import("@umbra-privacy/web-zk-prover");

assertExports("@umbra-privacy/sdk", sdk, requiredSdkExports);
assertExports("@umbra-privacy/web-zk-prover", provers, requiredProverExports);

console.log(JSON.stringify({
  ok: true,
  sdkExports: requiredSdkExports.length,
  proverExports: requiredProverExports.length,
  boundary: "import/type surface only; no Umbra client constructed, no CDN prover asset fetch, no RPC, no devnet/mainnet transaction",
}, null, 2));
