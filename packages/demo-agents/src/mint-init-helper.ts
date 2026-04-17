#!/usr/bin/env ts-node
import { PublicKey } from "@solana/web3.js";
import { AGENT_A_KEYPAIR } from "./wallets";
import { PER_VALIDATOR_PUBKEY } from "./config";

const DEFAULT_PAYMENTS_API_BASE_URL = "https://payments.magicblock.app";

function getPaymentsApiBaseUrl() {
  return (
    process.env.DEMO_PAYMENTS_API_BASE_URL?.trim() || DEFAULT_PAYMENTS_API_BASE_URL
  ).replace(/\/+$/, "");
}

function required(name: string, value?: string): string {
  const v = value?.trim();
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function ensurePubkey(name: string, value: string): string {
  try {
    new PublicKey(value);
    return value;
  } catch {
    throw new Error(`${name} is not a valid Solana public key`);
  }
}

function main() {
  const mint = ensurePubkey(
    "DEMO_PRIVATE_MINT",
    required("DEMO_PRIVATE_MINT", process.env.DEMO_PRIVATE_MINT)
  );

  const cluster = process.env.DEMO_PAYMENTS_CLUSTER?.trim() || "devnet";

  const validator = ensurePubkey(
    "DEMO_PAYMENTS_VALIDATOR_PUBKEY",
    process.env.DEMO_PAYMENTS_VALIDATOR_PUBKEY?.trim() || PER_VALIDATOR_PUBKEY
  );

  const payer = AGENT_A_KEYPAIR.publicKey.toBase58();
  const apiBase = getPaymentsApiBaseUrl();
  const endpoint = new URL("/v1/spl/initialize-mint", `${apiBase}/`).toString();

  const payload = {
    payer,
    mint,
    cluster,
    validator,
  };

  console.log("\nMint init helper (MagicBlock payments API)");
  console.log("========================================");
  console.log(`Payer:     ${payer}`);
  console.log(`Mint:      ${mint}`);
  console.log(`Cluster:   ${cluster}`);
  console.log(`Validator: ${validator}`);
  console.log(`Endpoint:  ${endpoint}\n`);

  console.log("JSON payload:\n");
  console.log(JSON.stringify(payload, null, 2));

  const escaped = JSON.stringify(payload).replace(/"/g, '\\"');
  console.log("\nReady-to-run curl:\n");
  console.log(
    `curl -sS -X POST \"${endpoint}\" -H \"content-type: application/json\" -d \"${escaped}\"`
  );
  console.log("");
}

try {
  main();
} catch (error: any) {
  console.error(`\n❌ ${error?.message || "mint init helper failed"}`);
  process.exit(1);
}
