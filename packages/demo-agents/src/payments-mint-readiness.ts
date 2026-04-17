import { PublicKey } from "@solana/web3.js";
import { PER_VALIDATOR_PUBKEY } from "./config";
import type { TransferContract } from "./payments-contract";

const DEFAULT_PAYMENTS_API_BASE_URL = "https://payments.magicblock.app";

interface MintReadinessOptions {
  payer: PublicKey;
  contract: TransferContract;
}

function getPaymentsApiBaseUrl() {
  return (
    process.env.DEMO_PAYMENTS_API_BASE_URL?.trim() || DEFAULT_PAYMENTS_API_BASE_URL
  ).replace(/\/+$/, "");
}

function getCluster() {
  return process.env.DEMO_PAYMENTS_CLUSTER?.trim() || "devnet";
}

function getValidator() {
  return process.env.DEMO_PAYMENTS_VALIDATOR_PUBKEY?.trim() || PER_VALIDATOR_PUBKEY;
}

function isMintInitializedResponse(payload: any): boolean | null {
  if (!payload || typeof payload !== "object") return null;

  const candidates = [
    payload.initialized,
    payload.isInitialized,
    payload.data?.initialized,
    payload.result?.initialized,
  ];

  for (const value of candidates) {
    if (typeof value === "boolean") return value;
  }

  return null;
}

export async function runMintReadinessPreflight({
  payer,
  contract,
}: MintReadinessOptions): Promise<void> {
  if (contract.visibility !== "private") {
    return;
  }

  const mint = process.env.DEMO_PRIVATE_MINT?.trim();
  if (!mint) {
    console.log(
      "   ℹ️  Mint-readiness preflight skipped (DEMO_PRIVATE_MINT not set)."
    );
    return;
  }

  try {
    new PublicKey(mint);
  } catch {
    throw new Error("DEMO_PRIVATE_MINT is not a valid Solana public key");
  }

  const validator = getValidator();
  try {
    new PublicKey(validator);
  } catch {
    throw new Error("DEMO_PAYMENTS_VALIDATOR_PUBKEY is not a valid Solana public key");
  }

  const baseUrl = getPaymentsApiBaseUrl();
  const statusUrl = new URL("/v1/spl/is-mint-initialized", `${baseUrl}/`);
  statusUrl.searchParams.set("mint", mint);
  statusUrl.searchParams.set("cluster", getCluster());
  statusUrl.searchParams.set("validator", validator);

  console.log(`   🧪 Mint preflight: checking ${mint}`);

  let initialized = false;
  try {
    const response = await fetch(statusUrl.toString(), {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body?.error?.message || body?.message || `HTTP ${response.status}`;
      throw new Error(`mint readiness request failed: ${message}`);
    }

    const parsed = isMintInitializedResponse(body);
    initialized = parsed === true;
  } catch (error: any) {
    console.log(
      `   ⚠️  Mint preflight unavailable (${error?.message ?? "unknown error"}). Continuing with fallback-safe path.`
    );
    return;
  }

  if (initialized) {
    console.log("   ✅ Mint preflight passed (mint initialized for private transfers)");
    return;
  }

  const strict =
    String(process.env.DEMO_REQUIRE_MINT_READY ?? "false").toLowerCase() === "true";

  console.log("   ⚠️  Mint not initialized for private transfers on current cluster/validator.");
  console.log("   👉 To initialize, use one of:");
  console.log(
    `      POST ${new URL("/v1/spl/initialize-mint", `${baseUrl}/`).toString()} with { payer: \"${payer.toBase58()}\", mint: \"${mint}\", cluster: \"${getCluster()}\", validator: \"${validator}\" }`
  );
  console.log("      or run: npm run mint:init-helper");
  console.log("   👉 Temporary workaround: run DEMO_SETTLEMENT_MODE=public for this demo.");

  if (strict) {
    throw new Error("Mint preflight failed and DEMO_REQUIRE_MINT_READY=true");
  }
}
