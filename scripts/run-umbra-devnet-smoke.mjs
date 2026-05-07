#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  createSignerFromPrivateKeyBytes,
  getEncryptedBalanceQuerierFunction,
  getPublicBalanceToEncryptedBalanceDirectDepositorFunction,
  getUmbraClient,
  getUmbraRelayer,
  getUserAccountQuerierFunction,
  getUserRegistrationFunction,
} from "@umbra-privacy/sdk";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "umbra-devnet-smoke", timestamp);
mkdirSync(outDir, { recursive: true });

const RPC_URL = process.env.UMBRA_DEVNET_RPC_URL || "https://api.devnet.solana.com";
const RPC_WS_URL = process.env.UMBRA_DEVNET_RPC_WS_URL || RPC_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:");
const INDEXER_URL = process.env.UMBRA_DEVNET_INDEXER_URL || "https://utxo-indexer.api-devnet.umbraprivacy.com";
const RELAYER_URL = process.env.UMBRA_DEVNET_RELAYER_URL || "https://relayer.api-devnet.umbraprivacy.com";
const UMBRA_DEVNET_PROGRAM_ID = "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ";
const NATIVE_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const connection = new Connection(RPC_URL, "confirmed");
const payer = loadPayer();
const signer = await createSignerFromPrivateKeyBytes(payer.secretKey);
const amountLamports = BigInt(process.env.UMBRA_DEVNET_WS0L_AMOUNT_LAMPORTS || "1000000"); // 0.001 wSOL
const requestedAirdropLamports = Number(process.env.UMBRA_DEVNET_AIRDROP_LAMPORTS || LAMPORTS_PER_SOL);
const minRequiredLamports = Number(process.env.UMBRA_DEVNET_MIN_REQUIRED_LAMPORTS || "50000000"); // 0.05 SOL

const evidence = {
  ok: false,
  schemaVersion: "reddi.umbra-devnet-smoke.v1",
  timestamp,
  boundary: "Umbra devnet-only smoke. No mainnet settlement, no real funds, no Quasar-native Umbra execution, no MagicBlock PER settlement.",
  network: "devnet",
  rpcUrl: RPC_URL,
  indexerUrl: INDEXER_URL,
  relayerUrl: RELAYER_URL,
  umbraProgramId: UMBRA_DEVNET_PROGRAM_ID,
  mint: NATIVE_MINT.toBase58(),
  amountBaseUnits: amountLamports.toString(),
  signerAddress: payer.publicKey.toBase58(),
  signerSource: process.env.UMBRA_DEVNET_KEYPAIR_PATH || process.env.SOLANA_KEYPAIR || "ephemeral",
  associatedTokenAddress: null,
  supportedMints: [],
  transactions: {},
  encryptedBalance: null,
  userAccount: null,
  error: null,
};

async function main() {
  const relayerInfo = await fetch(`${RELAYER_URL}/v1/relayer/info`).then((r) => r.json());
  evidence.relayerAddress = relayerInfo.address;
  evidence.supportedMints = relayerInfo.supported_mints ?? [];
  if (!evidence.supportedMints.includes(NATIVE_MINT.toBase58())) {
    throw new Error(`Umbra devnet relayer does not list native mint ${NATIVE_MINT.toBase58()} as supported.`);
  }

  const indexerHealth = await fetch(`${INDEXER_URL}/health`).then((r) => r.json());
  evidence.indexerHealth = indexerHealth;

  const balanceBeforeFunding = await connection.getBalance(payer.publicKey, "confirmed");
  evidence.balanceBeforeFundingLamports = balanceBeforeFunding;
  if (balanceBeforeFunding < minRequiredLamports) {
    const airdropSignature = await requestAirdropWithFallback(requestedAirdropLamports);
    evidence.transactions.airdrop = airdropSignature;
  } else {
    evidence.transactions.airdrop = null;
    evidence.airdropSkipped = `existing devnet balance ${balanceBeforeFunding} lamports >= ${minRequiredLamports}`;
  }

  const ata = await getAssociatedTokenAddress(NATIVE_MINT, payer.publicKey);
  evidence.associatedTokenAddress = ata.toBase58();
  const wrapSignature = await wrapSolToAta(ata, Number(amountLamports));
  evidence.transactions.wrapSol = wrapSignature;

  const client = await getUmbraClient({
    signer,
    network: "devnet",
    rpcUrl: RPC_URL,
    rpcSubscriptionsUrl: RPC_WS_URL,
    indexerApiEndpoint: INDEXER_URL,
  });
  const relayer = getUmbraRelayer({ apiEndpoint: RELAYER_URL });
  evidence.sdkClient = {
    signerAddress: client.signer.address,
    network: client.network,
    relayerConfigured: Boolean(relayer),
  };

  const queryUser = getUserAccountQuerierFunction({ client });
  const beforeUser = await queryUser().catch((error) => ({ error: serialiseError(error) }));
  evidence.userAccountBefore = normaliseForJson(beforeUser);

  const register = getUserRegistrationFunction({ client });
  const registrationSignatures = await register({ confidential: true, anonymous: false });
  evidence.transactions.registration = registrationSignatures;

  const afterUser = await queryUser().catch((error) => ({ error: serialiseError(error) }));
  evidence.userAccount = normaliseForJson(afterUser);

  const deposit = getPublicBalanceToEncryptedBalanceDirectDepositorFunction({ client });
  const depositResult = await deposit(client.signer.address, NATIVE_MINT.toBase58(), amountLamports, {
    optionalData: optionalData32("reddi-umbra-devnet-smoke"),
  });
  evidence.transactions.deposit = normaliseForJson(depositResult);

  const queryEncryptedBalance = getEncryptedBalanceQuerierFunction({ client });
  const balances = await queryEncryptedBalance([NATIVE_MINT.toBase58()]);
  evidence.encryptedBalance = normaliseForJson(Object.fromEntries(balances));

  evidence.ok = true;
}

try {
  await main();
} catch (error) {
  evidence.error = serialiseError(error);
  process.exitCode = 1;
} finally {
  const jsonPath = join(outDir, "SUMMARY.json");
  const mdPath = join(outDir, "SUMMARY.md");
  writeFileSync(jsonPath, JSON.stringify(normaliseForJson(evidence), null, 2));
  writeFileSync(mdPath, renderMarkdown(evidence));
  console.log(JSON.stringify({ ok: evidence.ok, outDir: relative(rootDir, outDir), jsonPath: relative(rootDir, jsonPath), mdPath: relative(rootDir, mdPath), error: evidence.error?.message ?? null }, null, 2));
}

async function getAssociatedTokenAddress(mint, owner) {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

async function wrapSolToAta(ata, lamports) {
  const accountInfo = await connection.getAccountInfo(ata, "confirmed");
  const instructions = [];
  if (!accountInfo) {
    instructions.push(
      new TransactionInstruction({
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        keys: [
          { pubkey: payer.publicKey, isSigner: true, isWritable: true },
          { pubkey: ata, isSigner: false, isWritable: true },
          { pubkey: payer.publicKey, isSigner: false, isWritable: false },
          { pubkey: NATIVE_MINT, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.alloc(0),
      }),
    );
  }
  instructions.push(
    SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: ata, lamports }),
    new TransactionInstruction({
      programId: TOKEN_PROGRAM_ID,
      keys: [{ pubkey: ata, isSigner: false, isWritable: true }],
      data: Buffer.from([17]), // SyncNative
    }),
  );
  const tx = new Transaction().add(...instructions);
  const signature = await connection.sendTransaction(tx, [payer], { skipPreflight: false, preflightCommitment: "confirmed" });
  await connection.confirmTransaction(signature, "confirmed");
  return signature;
}

function optionalData32(label) {
  const data = new Uint8Array(32);
  new TextEncoder().encodeInto(label, data);
  return data;
}

function normaliseForJson(value) {
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === "bigint") return value.toString();
  if (Array.isArray(value)) return value.map(normaliseForJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normaliseForJson(entry)]));
  }
  return value;
}

function serialiseError(error) {
  return {
    name: error?.name ?? "Error",
    message: error?.message ?? String(error),
    stack: error?.stack,
    stage: error?.stage,
    cause: error?.cause ? serialiseError(error.cause) : undefined,
  };
}

function txLink(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

function renderMarkdown(result) {
  const txs = result.transactions ?? {};
  const lines = [
    `# Umbra Devnet Smoke — ${result.timestamp}`,
    "",
    `- OK: ${result.ok ? "true" : "false"}`,
    `- Network: ${result.network}`,
    `- Umbra program: ${result.umbraProgramId}`,
    `- Signer: ${result.signerAddress}`,
    `- Mint: ${result.mint}`,
    `- Amount base units: ${result.amountBaseUnits}`,
    `- Boundary: ${result.boundary}`,
    "",
    "## Transactions",
  ];
  if (txs.airdrop) lines.push(`- Airdrop: [${txs.airdrop}](${txLink(txs.airdrop)})`);
  if (txs.wrapSol) lines.push(`- Wrap SOL to wSOL ATA: [${txs.wrapSol}](${txLink(txs.wrapSol)})`);
  for (const sig of txs.registration ?? []) lines.push(`- Umbra registration: [${sig}](${txLink(sig)})`);
  if (txs.deposit?.queueSignature) lines.push(`- Umbra encrypted-balance deposit queue: [${txs.deposit.queueSignature}](${txLink(txs.deposit.queueSignature)})`);
  if (txs.deposit?.callbackSignature) lines.push(`- Umbra encrypted-balance deposit callback: [${txs.deposit.callbackSignature}](${txLink(txs.deposit.callbackSignature)})`);
  if (txs.deposit?.rentClaimSignature) lines.push(`- Umbra rent claim cleanup: [${txs.deposit.rentClaimSignature}](${txLink(txs.deposit.rentClaimSignature)})`);
  lines.push("", "## Relayer / indexer", "", `- Relayer: ${result.relayerAddress ?? "unknown"}`, `- Supported mints: ${(result.supportedMints ?? []).join(", ")}`, `- Indexer health: ${JSON.stringify(result.indexerHealth ?? null)}`);
  if (result.encryptedBalance) lines.push("", "## Encrypted balance query", "", "```json", JSON.stringify(normaliseForJson(result.encryptedBalance), null, 2), "```");
  if (result.error) lines.push("", "## Error", "", "```json", JSON.stringify(result.error, null, 2), "```");
  return `${lines.join("\n")}\n`;
}

function loadPayer() {
  const explicitPath = process.env.UMBRA_DEVNET_KEYPAIR_PATH || process.env.SOLANA_KEYPAIR;
  const defaultSolanaPath = join(os.homedir(), ".config", "solana", "id.json");
  const keypairPath = explicitPath || (existsSync(defaultSolanaPath) ? defaultSolanaPath : null);
  if (!keypairPath) return Keypair.generate();
  const bytes = JSON.parse(readFileSync(keypairPath, "utf8"));
  if (!Array.isArray(bytes)) throw new Error(`Keypair file must contain a byte array: ${keypairPath}`);
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

async function requestAirdropWithFallback(initialLamports) {
  const attempts = [initialLamports, Math.floor(0.5 * LAMPORTS_PER_SOL), Math.floor(0.1 * LAMPORTS_PER_SOL), Math.floor(0.05 * LAMPORTS_PER_SOL)];
  let lastError;
  for (const lamports of [...new Set(attempts.filter((value) => value > 0))]) {
    try {
      const signature = await connection.requestAirdrop(payer.publicKey, lamports);
      await connection.confirmTransaction(signature, "confirmed");
      evidence.airdropLamports = lamports;
      return signature;
    } catch (error) {
      lastError = error;
      evidence.airdropAttempts = [...(evidence.airdropAttempts ?? []), { lamports, error: serialiseError(error) }];
    }
  }
  throw lastError;
}
