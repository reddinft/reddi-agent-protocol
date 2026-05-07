#!/usr/bin/env node
const sdkImports = [
  "getUmbraClient",
  "getUserRegistrationFunction",
  "getUserAccountQuerierFunction",
  "getPublicBalanceToEncryptedBalanceDirectDepositorFunction",
  "getPublicBalanceToReceiverClaimableUtxoCreatorFunction",
  "getClaimableUtxoScannerFunction",
  "getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction",
  "getUmbraRelayer",
];

const proverImports = [
  "getUserRegistrationProver",
  "getCreateReceiverClaimableUtxoFromPublicBalanceProver",
  "getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver",
];

const [sdk, prover] = await Promise.all([import("@umbra-privacy/sdk"), import("@umbra-privacy/web-zk-prover")]);
const missingSdk = sdkImports.filter((name) => typeof sdk[name] !== "function");
const missingProver = proverImports.filter((name) => typeof prover[name] !== "function");

if (missingSdk.length || missingProver.length) {
  console.error("[umbra-sdk-imports] FAIL");
  if (missingSdk.length) console.error(`- @umbra-privacy/sdk missing: ${missingSdk.join(", ")}`);
  if (missingProver.length) console.error(`- @umbra-privacy/web-zk-prover missing: ${missingProver.join(", ")}`);
  process.exit(1);
}

console.log(`[umbra-sdk-imports] OK: sdk=${sdkImports.length} web-zk-prover=${proverImports.length}`);
