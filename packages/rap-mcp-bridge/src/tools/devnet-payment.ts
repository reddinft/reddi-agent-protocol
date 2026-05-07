import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import type { BridgeConfig } from "../config.js";
import { sha256Json } from "../hash.js";
import type { ReddiQuote } from "../schemas.js";
import type { BridgeStore, DevnetReceipt } from "../store.js";

const DEFAULT_DEVNET_RPC_URL = clusterApiUrl("devnet");
const DEFAULT_MAX_TOTAL_DEBIT_LAMPORTS = 100_050;
const APPROVAL_PHRASE = "EXECUTE_DEVNET_RAP_PAYMENT";

function keypairFor(profileId: string): Keypair {
  const seed = createHash("sha256").update(`reddi-rap-mcp-bridge-devnet-mcp:${profileId}`).digest().subarray(0, 32);
  return Keypair.fromSeed(seed);
}

function loadKeypair(path: string | undefined): Keypair | null {
  if (!path || !existsSync(path)) return null;
  const secret = Uint8Array.from(JSON.parse(readFileSync(path, "utf8")) as number[]);
  return Keypair.fromSecretKey(secret);
}

function decimalAmountToLamports(amount: string): number {
  const [wholeRaw, fracRaw = ""] = amount.split(".");
  const whole = Number(wholeRaw || "0");
  if (!Number.isSafeInteger(whole) || whole < 0) throw new Error("invalid_quote_amount");
  const frac = (fracRaw + "000000000").slice(0, 9);
  const lamports = whole * LAMPORTS_PER_SOL + Number(frac);
  if (!Number.isSafeInteger(lamports) || lamports <= 0) throw new Error("invalid_quote_amount");
  return lamports;
}

function feeLamportsFor(amountLamports: number): number {
  return Math.round((amountLamports * 5) / 10_000);
}

function quoteDevnetProfile(quote: ReddiQuote) {
  return {
    payer: keypairFor(`payer:${quote.quoteId}`),
    specialist: keypairFor(`specialist:${quote.specialist.walletAddress}:${quote.quoteId}`),
    treasury: keypairFor(`treasury:${quote.quoteId}`),
  };
}

function assertDevnetConfigured(config: BridgeConfig) {
  if (config.policyMode !== "devnet") throw new Error("devnet_mode_not_enabled");
  if (!config.devnetProofApproved) throw new Error("devnet_payment_requires_RAP_MCP_DEVNET_PROOF_APPROVED=1");
  if (!config.devnetFunderKeypairPath) throw new Error("devnet_payment_requires_RAP_MCP_DEVNET_FUNDER_KEYPAIR");
}

function assertDevnetQuote(quote: ReddiQuote) {
  if (quote.terms.network !== "solana-devnet" && quote.terms.network !== "local-surfpool") {
    throw new Error("quote_not_devnet_eligible");
  }
  if (quote.binding !== false || quote.quoteAuthority !== "bridge_synthetic") {
    throw new Error("unsupported_quote_authority");
  }
}

function requestHash(input: { quoteId: string; maxTotalDebitLamports: number; approvalPhrase: string }): string {
  return sha256Json(input);
}

async function transfer(connection: Connection, from: Keypair, to: PublicKey, lamports: number) {
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: from.publicKey, toPubkey: to, lamports }));
  return sendAndConfirmTransaction(connection, tx, [from], { commitment: "confirmed" });
}

async function ensureBalance(connection: Connection, funder: Keypair, recipient: PublicKey, minimumLamports: number, category: string) {
  const current = await connection.getBalance(recipient);
  if (current >= minimumLamports) return { category, source: "existing_balance" as const, signature: null, lamports: 0, balanceLamports: current };
  const lamports = minimumLamports - current;
  const signature = await transfer(connection, funder, recipient, lamports);
  return { category, source: "configured_funder_wallet" as const, signature, lamports, balanceLamports: await connection.getBalance(recipient) };
}

export async function prepareDevnetPayment(args: { quoteId: string; maxTotalDebitLamports?: number }, config: BridgeConfig, store: BridgeStore) {
  assertDevnetConfigured(config);
  const quote = store.getQuote(args.quoteId);
  if (!quote) throw new Error("quote_not_found");
  assertDevnetQuote(quote);
  const funder = loadKeypair(config.devnetFunderKeypairPath);
  if (!funder) throw new Error("devnet_funder_keypair_unavailable");
  const connection = new Connection(config.devnetRpcUrl ?? DEFAULT_DEVNET_RPC_URL, "confirmed");
  const { payer, specialist, treasury } = quoteDevnetProfile(quote);
  const downstreamAmountLamports = decimalAmountToLamports(quote.terms.amount);
  const protocolFeeLamports = feeLamportsFor(downstreamAmountLamports);
  const totalDebitLamports = downstreamAmountLamports + protocolFeeLamports;
  const cap = args.maxTotalDebitLamports ?? config.devnetMaxTotalDebitLamports ?? DEFAULT_MAX_TOTAL_DEBIT_LAMPORTS;
  return {
    schemaVersion: "reddi.rap-mcp-bridge.devnet-payment-readiness.v1",
    quoteId: quote.quoteId,
    boundary: "solana-devnet-only-no-mainnet-no-specialist-http-invocation",
    rpcUrl: config.devnetRpcUrl ?? DEFAULT_DEVNET_RPC_URL,
    capLamports: cap,
    spendCapRespected: totalDebitLamports <= cap,
    funderWallet: funder.publicKey.toBase58(),
    wallets: {
      payer: payer.publicKey.toBase58(),
      specialist: specialist.publicKey.toBase58(),
      protocolTreasury: treasury.publicKey.toBase58(),
    },
    balances: {
      payerLamports: await connection.getBalance(payer.publicKey),
      specialistLamports: await connection.getBalance(specialist.publicKey),
      protocolTreasuryLamports: await connection.getBalance(treasury.publicKey),
      funderLamports: await connection.getBalance(funder.publicKey),
    },
    amounts: { downstreamAmountLamports, protocolFeeBps: 5, protocolFeeLamports, totalDebitLamports },
    executeRequiresApprovalPhrase: APPROVAL_PHRASE,
  };
}

export async function executeDevnetPayment(args: { quoteId: string; idempotencyKey: string; maxTotalDebitLamports: number; approvalPhrase: string }, config: BridgeConfig, store: BridgeStore): Promise<DevnetReceipt> {
  assertDevnetConfigured(config);
  if (args.approvalPhrase !== APPROVAL_PHRASE) throw new Error("missing_devnet_execution_approval_phrase");
  const quote = store.getQuote(args.quoteId);
  if (!quote) throw new Error("quote_not_found");
  assertDevnetQuote(quote);
  const inputHash = requestHash({ quoteId: args.quoteId, maxTotalDebitLamports: args.maxTotalDebitLamports, approvalPhrase: args.approvalPhrase });
  const existing = store.getDevnetReceiptByIdempotency(args.idempotencyKey);
  if (existing) {
    if (existing.requestHash !== inputHash) throw new Error("idempotency_key_conflict");
    return existing.receipt;
  }
  const funder = loadKeypair(config.devnetFunderKeypairPath);
  if (!funder) throw new Error("devnet_funder_keypair_unavailable");
  const connection = new Connection(config.devnetRpcUrl ?? DEFAULT_DEVNET_RPC_URL, "confirmed");
  const { payer, specialist, treasury } = quoteDevnetProfile(quote);
  const downstreamAmountLamports = decimalAmountToLamports(quote.terms.amount);
  const protocolFeeLamports = feeLamportsFor(downstreamAmountLamports);
  const totalDebitLamports = downstreamAmountLamports + protocolFeeLamports;
  const cap = Math.min(args.maxTotalDebitLamports, config.devnetMaxTotalDebitLamports ?? DEFAULT_MAX_TOTAL_DEBIT_LAMPORTS);
  if (totalDebitLamports > cap) throw new Error(`devnet_spend_cap_exceeded:${totalDebitLamports}>${cap}`);

  const rentSafetyLamports = 1_000_000;
  const payerFunding = await ensureBalance(connection, funder, payer.publicKey, rentSafetyLamports + totalDebitLamports + 20_000, "payer_top_up");
  const specialistSetup = await ensureBalance(connection, funder, specialist.publicKey, rentSafetyLamports, "specialist_rent_safety");
  const treasurySetup = await ensureBalance(connection, funder, treasury.publicKey, rentSafetyLamports, "treasury_rent_safety");
  const before = {
    payerLamports: await connection.getBalance(payer.publicKey),
    specialistLamports: await connection.getBalance(specialist.publicKey),
    protocolTreasuryLamports: await connection.getBalance(treasury.publicKey),
  };
  const downstreamSignature = await transfer(connection, payer, specialist.publicKey, downstreamAmountLamports);
  const feeSignature = await transfer(connection, payer, treasury.publicKey, protocolFeeLamports);
  const after = {
    payerLamports: await connection.getBalance(payer.publicKey),
    specialistLamports: await connection.getBalance(specialist.publicKey),
    protocolTreasuryLamports: await connection.getBalance(treasury.publicKey),
  };
  const receipt: DevnetReceipt = {
    schemaVersion: "reddi.rap-mcp-bridge.devnet-payment-receipt.v1",
    quoteId: quote.quoteId,
    createdAt: new Date().toISOString(),
    boundary: "solana-devnet-only-no-mainnet-no-specialist-http-invocation",
    quoteTermsHash: quote.termsHash,
    spendCapLamports: cap,
    amounts: { downstreamAmountLamports, protocolFeeBps: 5, protocolFeeLamports, totalDebitLamports },
    funding: { payerFunding, specialistSetup, treasurySetup },
    wallets: {
      payer: payer.publicKey.toBase58(),
      specialist: specialist.publicKey.toBase58(),
      protocolTreasury: treasury.publicKey.toBase58(),
      funder: funder.publicKey.toBase58(),
    },
    balances: { before, after },
    transactions: { downstreamSignature, feeSignature },
    verification: {
      devnetPaymentSemantics: after.specialistLamports - before.specialistLamports === downstreamAmountLamports && after.protocolTreasuryLamports - before.protocolTreasuryLamports === protocolFeeLamports ? "pass" : "fail",
      mainnetSettlement: "not_applicable",
    },
    disclosureLedgerEntry: {
      entryId: `ledger_${quote.quoteId}`,
      quoteId: quote.quoteId,
      specialistWallet: specialist.publicKey.toBase58(),
      capability: quote.specialist.capability,
      payloadHash: quote.task.taskSummaryHash,
      network: "solana-devnet",
      verificationStatus: "devnet_verified",
      evidenceRefs: [quote.quoteId, quote.termsHash, downstreamSignature, feeSignature],
    },
  };
  store.upsertDevnetReceipt(args.idempotencyKey, inputHash, receipt);
  return receipt;
}

export async function verifyDevnetReceipt(args: { quoteId: string }, store: BridgeStore) {
  const receipts = store.listDevnetReceipts(args.quoteId);
  return {
    schemaVersion: "reddi.rap-mcp-bridge.devnet-verification.v1",
    quoteId: args.quoteId,
    verified: receipts.some((receipt) => receipt.verification.devnetPaymentSemantics === "pass"),
    boundary: "solana-devnet-only-no-mainnet",
    mainnetSettlement: "not_applicable",
    receipts,
  };
}
