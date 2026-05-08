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
  getClaimableUtxoScannerFunction,
  getEncryptedBalanceQuerierFunction,
  getPublicBalanceToReceiverClaimableUtxoCreatorFunction,
  getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction,
  getUmbraClient,
  getUmbraRelayer,
  getUserAccountQuerierFunction,
  getUserRegistrationFunction,
} from "@umbra-privacy/sdk";
import {
  getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver,
  getCreateReceiverClaimableUtxoFromPublicBalanceProver,
  getUserRegistrationProver,
} from "@umbra-privacy/web-zk-prover";
import { selectReceiverClaimableUtxos } from "../lib/privacy/umbra/receiver-claimable-utxo.js";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const outDir = join(rootDir, "artifacts", "umbra-devnet-receiver-claimable-utxo", timestamp);
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
const payerKeypairPath = resolveKeypairPath(process.env.UMBRA_DEVNET_PAYER_KEYPAIR_PATH || process.env.UMBRA_DEVNET_KEYPAIR_PATH || process.env.SOLANA_KEYPAIR, "payer");
const recipientKeypairPath = resolveKeypairPath(process.env.UMBRA_DEVNET_RECIPIENT_KEYPAIR_PATH, "recipient");
const funderKeypairPath = resolveKeypairPath(process.env.UMBRA_DEVNET_FUNDER_KEYPAIR_PATH || process.env.UMBRA_DEVNET_KEYPAIR_PATH || process.env.SOLANA_KEYPAIR, "funder");
const payer = loadKeypair(payerKeypairPath, "payer");
const recipient = loadKeypair(recipientKeypairPath, "recipient");
const funder = loadKeypair(funderKeypairPath, "funder");
const payerSigner = await createSignerFromPrivateKeyBytes(payer.secretKey);
const recipientSigner = await createSignerFromPrivateKeyBytes(recipient.secretKey);
const amountLamports = BigInt(process.env.UMBRA_DEVNET_UTXO_AMOUNT_LAMPORTS || "500000");
const requestedAirdropLamports = Number(process.env.UMBRA_DEVNET_AIRDROP_LAMPORTS || LAMPORTS_PER_SOL);
const minRequiredLamports = Number(process.env.UMBRA_DEVNET_MIN_REQUIRED_LAMPORTS || "50000000");
const scanTreeIndex = BigInt(process.env.UMBRA_DEVNET_SCAN_TREE_INDEX || "0");
const scanStartInsertionIndex = BigInt(process.env.UMBRA_DEVNET_SCAN_START_INDEX || "0");
const scanEndInsertionIndex = process.env.UMBRA_DEVNET_SCAN_END_INDEX ? BigInt(process.env.UMBRA_DEVNET_SCAN_END_INDEX) : undefined;
const scanRetries = Number(process.env.UMBRA_DEVNET_SCAN_RETRIES || "8");
const scanRetryMs = Number(process.env.UMBRA_DEVNET_SCAN_RETRY_MS || "5000");

const evidence = {
  ok: false,
  schemaVersion: "reddi.umbra-devnet-receiver-claimable-utxo.v1",
  timestamp,
  boundary:
    "Umbra receiver-claimable UTXO devnet-only smoke. No mainnet settlement, no real funds, no Quasar-native Umbra execution, no MagicBlock PER settlement.",
  network: "devnet",
  rpcUrl: RPC_URL,
  indexerUrl: INDEXER_URL,
  relayerUrl: RELAYER_URL,
  umbraProgramId: UMBRA_DEVNET_PROGRAM_ID,
  mint: NATIVE_MINT.toBase58(),
  amountBaseUnits: amountLamports.toString(),
  payerAddress: payer.publicKey.toBase58(),
  recipientAddress: recipient.publicKey.toBase58(),
  payerSignerSource: keypairSource(payerKeypairPath),
  recipientSignerSource: keypairSource(recipientKeypairPath),
  funderAddress: funder.publicKey.toBase58(),
  funderSignerSource: keypairSource(funderKeypairPath),
  associatedTokenAddress: null,
  relayerAddress: null,
  supportedMints: [],
  indexerHealth: null,
  transactions: {
    payerAirdrop: null,
    recipientAirdrop: null,
    payerFunderTransfer: null,
    recipientFunderTransfer: null,
    wrapSol: null,
    payerRegistration: [],
    recipientRegistration: [],
    createUtxo: [],
    claim: [],
  },
  scan: {
    treeIndex: scanTreeIndex,
    startInsertionIndex: scanStartInsertionIndex,
    endInsertionIndex: scanEndInsertionIndex ?? null,
    attempts: [],
    receivedCount: 0,
    publicReceivedCount: 0,
    selectedBucket: null,
    selectedCount: 0,
  },
  payerUserAccount: null,
  recipientUserAccount: null,
  recipientEncryptedBalanceBefore: null,
  recipientEncryptedBalanceAfter: null,
  error: null,
};

async function main() {
  const relayerInfo = await fetch(`${RELAYER_URL}/v1/relayer/info`).then((r) => r.json());
  evidence.relayerAddress = relayerInfo.address;
  evidence.supportedMints = relayerInfo.supported_mints ?? [];
  if (!evidence.supportedMints.includes(NATIVE_MINT.toBase58())) {
    throw Object.assign(new Error(`Umbra devnet relayer does not list native mint ${NATIVE_MINT.toBase58()} as supported.`), { stage: "relayer-mint-support" });
  }

  evidence.indexerHealth = await fetch(`${INDEXER_URL}/health`).then((r) => r.json());

  await ensureLamports(payer, "payerAirdrop");
  await ensureLamports(recipient, "recipientAirdrop");

  const payerAta = await getAssociatedTokenAddress(NATIVE_MINT, payer.publicKey);
  evidence.associatedTokenAddress = payerAta.toBase58();
  evidence.transactions.wrapSol = await wrapSolToAta(payer, payerAta, Number(amountLamports));

  const payerClient = await getUmbraClient({
    signer: payerSigner,
    network: "devnet",
    rpcUrl: RPC_URL,
    rpcSubscriptionsUrl: RPC_WS_URL,
    indexerApiEndpoint: INDEXER_URL,
  });
  const recipientClient = await getUmbraClient({
    signer: recipientSigner,
    network: "devnet",
    rpcUrl: RPC_URL,
    rpcSubscriptionsUrl: RPC_WS_URL,
    indexerApiEndpoint: INDEXER_URL,
  });

  evidence.payerUserAccountBefore = await queryUserAccount(payerClient);
  evidence.recipientUserAccountBefore = await queryUserAccount(recipientClient);

  const userRegistrationProver = getUserRegistrationProver();
  const registerRecipient = getUserRegistrationFunction({ client: recipientClient }, { zkProver: userRegistrationProver });
  evidence.transactions.recipientRegistration = await registerRecipient({ confidential: true, anonymous: true });

  const registerPayer = getUserRegistrationFunction({ client: payerClient }, { zkProver: userRegistrationProver });
  evidence.transactions.payerRegistration = await registerPayer({ confidential: true, anonymous: true });

  evidence.payerUserAccount = await queryUserAccount(payerClient);
  evidence.recipientUserAccount = await queryUserAccount(recipientClient);

  evidence.recipientEncryptedBalanceBefore = await queryEncryptedBalance(recipientClient);

  const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
    { client: payerClient },
    { zkProver: getCreateReceiverClaimableUtxoFromPublicBalanceProver() },
  );
  const createUtxoResult = await createUtxo(
    {
      destinationAddress: recipientClient.signer.address,
      mint: NATIVE_MINT.toBase58(),
      amount: amountLamports,
    },
    { optionalData: optionalData32("reddi-umbra-utxo-create") },
  );
  evidence.createUtxoResult = normaliseForJson(createUtxoResult);
  evidence.transactions.createUtxo = flattenSignatureRecord(createUtxoResult);

  const scanned = await scanUntilFound(recipientClient);
  const selectedUtxos = selectReceiverClaimableUtxos(scanned, amountLamports, recipientClient.signer.address);
  evidence.scan.selectedCount = selectedUtxos.length;
  evidence.scan.selectedBucket = selectedUtxos[0]?.__bucket ?? null;
  if (selectedUtxos.length === 0) {
    throw Object.assign(new Error("No receiver-claimable Umbra UTXO found for recipient after bounded scan retries."), { stage: "scan-no-match" });
  }

  const relayer = getUmbraRelayer({ apiEndpoint: RELAYER_URL });
  const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
    { client: recipientClient },
    { zkProver: getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver(), relayer, fetchBatchMerkleProof: recipientClient.fetchBatchMerkleProof },
  );
  const claimResult = await claim(selectedUtxos.map(({ __bucket, ...utxo }) => utxo), optionalData32("reddi-umbra-utxo-claim"));
  evidence.transactions.claim = flattenSignatureRecord(claimResult?.signatures ?? claimResult);
  evidence.claimResult = normaliseForJson(claimResult);

  evidence.recipientEncryptedBalanceAfter = await queryEncryptedBalance(recipientClient);
  evidence.ok = evidence.transactions.createUtxo.length > 0 && evidence.transactions.claim.length > 0 && claimSucceeded(claimResult);
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
  process.exit(process.exitCode ?? 0);
}

async function ensureLamports(keypair, field) {
  const balance = await connection.getBalance(keypair.publicKey, "confirmed");
  evidence[`${field}BalanceBeforeLamports`] = balance;
  if (balance >= minRequiredLamports) return;
  const neededLamports = minRequiredLamports - balance;
  const airdropLamports = Math.max(neededLamports, requestedAirdropLamports);
  if (process.env.UMBRA_DEVNET_SKIP_AIRDROP !== "1") {
    try {
      const signature = await requestAirdropWithFallback(keypair, airdropLamports);
      evidence.transactions[field] = signature;
      return;
    } catch (error) {
      evidence[`${field}AirdropError`] = serialiseError(error);
    }
  }
  const transferSignature = await transferFromFunder(keypair.publicKey, neededLamports, `${field.replace(/Airdrop$/, "")}FunderTransfer`);
  if (!transferSignature) {
    throw Object.assign(new Error(`Unable to fund ${keypair.publicKey.toBase58()} from airdrop or configured devnet funder.`), { stage: "funding" });
  }
}

async function transferFromFunder(destination, lamports, field) {
  if (funder.publicKey.equals(destination)) return null;
  const funderBalance = await connection.getBalance(funder.publicKey, "confirmed");
  evidence[`${field}FunderBalanceBeforeLamports`] = funderBalance;
  const rentSafetyLamports = Number(process.env.UMBRA_DEVNET_FUNDER_RENT_SAFETY_LAMPORTS || "10000000");
  const transferLamports = Math.min(lamports, Math.max(0, funderBalance - rentSafetyLamports));
  if (transferLamports <= 0) return null;
  const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: funder.publicKey, toPubkey: destination, lamports: transferLamports }));
  const signature = await connection.sendTransaction(tx, [funder], { skipPreflight: false, preflightCommitment: "confirmed" });
  await confirmSignatureLenient(signature);
  evidence.transactions[field] = signature;
  return signature;
}

async function requestAirdropWithFallback(keypair, initialLamports) {
  const attempts = [initialLamports, Math.floor(0.5 * LAMPORTS_PER_SOL), Math.floor(0.1 * LAMPORTS_PER_SOL), Math.floor(0.05 * LAMPORTS_PER_SOL)];
  let lastError;
  for (const lamports of [...new Set(attempts.filter((value) => value > 0))]) {
    try {
      const signature = await connection.requestAirdrop(keypair.publicKey, lamports);
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    } catch (error) {
      lastError = error;
    }
  }
  throw Object.assign(new Error(`Unable to airdrop devnet SOL to ${keypair.publicKey.toBase58()}: ${lastError?.message ?? lastError}`), { stage: "airdrop" });
}

async function getAssociatedTokenAddress(mint, owner) {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}

async function wrapSolToAta(owner, ata, lamports) {
  const accountInfo = await connection.getAccountInfo(ata, "confirmed");
  const instructions = [];
  if (!accountInfo) {
    instructions.push(
      new TransactionInstruction({
        programId: ASSOCIATED_TOKEN_PROGRAM_ID,
        keys: [
          { pubkey: owner.publicKey, isSigner: true, isWritable: true },
          { pubkey: ata, isSigner: false, isWritable: true },
          { pubkey: owner.publicKey, isSigner: false, isWritable: false },
          { pubkey: NATIVE_MINT, isSigner: false, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        data: Buffer.alloc(0),
      }),
    );
  }
  instructions.push(
    SystemProgram.transfer({ fromPubkey: owner.publicKey, toPubkey: ata, lamports }),
    new TransactionInstruction({
      programId: TOKEN_PROGRAM_ID,
      keys: [{ pubkey: ata, isSigner: false, isWritable: true }],
      data: Buffer.from([17]),
    }),
  );
  const tx = new Transaction().add(...instructions);
  const signature = await connection.sendTransaction(tx, [owner], { skipPreflight: false, preflightCommitment: "confirmed" });
  await confirmSignatureLenient(signature);
  return signature;
}

async function confirmSignatureLenient(signature) {
  try {
    await connection.confirmTransaction(signature, "confirmed");
    return;
  } catch (error) {
    const status = await connection.getSignatureStatus(signature, { searchTransactionHistory: true });
    if (status.value?.err) {
      throw Object.assign(new Error(`Transaction ${signature} failed: ${JSON.stringify(status.value.err)}`), { stage: "confirm", cause: error });
    }
    if (["confirmed", "finalized"].includes(status.value?.confirmationStatus)) return;
    throw error;
  }
}

async function queryUserAccount(client) {
  const query = getUserAccountQuerierFunction({ client });
  return normaliseForJson(await query(client.signer.address).catch((error) => ({ error: serialiseError(error) })));
}

async function queryEncryptedBalance(client) {
  const query = getEncryptedBalanceQuerierFunction({ client });
  const balances = await query([NATIVE_MINT.toBase58()]);
  return normaliseForJson(Object.fromEntries(balances));
}

async function scanUntilFound(client) {
  const scan = getClaimableUtxoScannerFunction({ client });
  let latest;
  for (let attempt = 1; attempt <= scanRetries; attempt += 1) {
    try {
      latest = await scan(scanTreeIndex, scanStartInsertionIndex, scanEndInsertionIndex);
      const publicReceivedCount = latest.publicReceived?.length ?? 0;
      const receivedCount = latest.received?.length ?? 0;
      evidence.scan.attempts.push({
        attempt,
        timestamp: new Date().toISOString(),
        receivedCount,
        publicReceivedCount,
        selfBurnableCount: latest.selfBurnable?.length ?? 0,
        publicSelfBurnableCount: latest.publicSelfBurnable?.length ?? 0,
      });
      evidence.scan.receivedCount = receivedCount;
      evidence.scan.publicReceivedCount = publicReceivedCount;
      if (publicReceivedCount + receivedCount > 0) return latest;
    } catch (error) {
      evidence.scan.attempts.push({ attempt, timestamp: new Date().toISOString(), error: serialiseError(error) });
    }
    if (attempt < scanRetries) await sleep(scanRetryMs);
  }
  return latest ?? { received: [], publicReceived: [], selfBurnable: [], publicSelfBurnable: [] };
}

function flattenSignatureRecord(signatures) {
  if (!signatures) return [];
  if (typeof signatures === "string") return [signatures];
  if (Array.isArray(signatures)) return signatures.flatMap(flattenSignatureRecord).filter(Boolean);
  if (signatures instanceof Map) return [...signatures.values()].flatMap(flattenSignatureRecord).filter(Boolean);
  if (typeof signatures === "object") {
    const direct = [signatures.txSignature, signatures.callbackSignature, signatures.createProofAccountSignature, signatures.createUtxoSignature, signatures.closeProofAccountSignature].filter(Boolean);
    const nested = Object.entries(signatures)
      .filter(([key]) => !["txSignature", "callbackSignature", "createProofAccountSignature", "createUtxoSignature", "closeProofAccountSignature", "requestId", "status", "resolvedVariant", "failureReason", "utxoIds"].includes(key))
      .flatMap(([, value]) => flattenSignatureRecord(value));
    return [...direct, ...nested].filter(Boolean);
  }
  return [];
}

function claimSucceeded(claimResult) {
  const batches = claimResult?.batches instanceof Map ? [...claimResult.batches.values()] : Object.values(claimResult?.batches ?? {});
  return batches.length > 0 && batches.every((batch) => batch?.status === "completed" && !batch?.failureReason && batch?.txSignature && batch?.callbackSignature);
}

function optionalData32(label) {
  const data = new Uint8Array(32);
  new TextEncoder().encodeInto(label, data);
  return data;
}

function normaliseForJson(value) {
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Uint8Array) return Array.from(value);
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
    `# Umbra Receiver-Claimable UTXO Devnet Smoke — ${result.timestamp}`,
    "",
    `- OK: ${result.ok ? "true" : "false"}`,
    `- Network: ${result.network}`,
    `- Umbra program: ${result.umbraProgramId}`,
    `- Payer: ${result.payerAddress}`,
    `- Recipient: ${result.recipientAddress}`,
    `- Mint: ${result.mint}`,
    `- Amount base units: ${result.amountBaseUnits}`,
    `- Boundary: ${result.boundary}`,
    "",
    "## Transactions",
  ];
  if (txs.payerAirdrop) lines.push(`- Payer airdrop: [${txs.payerAirdrop}](${txLink(txs.payerAirdrop)})`);
  if (txs.recipientAirdrop) lines.push(`- Recipient airdrop: [${txs.recipientAirdrop}](${txLink(txs.recipientAirdrop)})`);
  if (txs.wrapSol) lines.push(`- Wrap payer SOL to wSOL ATA: [${txs.wrapSol}](${txLink(txs.wrapSol)})`);
  for (const sig of txs.recipientRegistration ?? []) lines.push(`- Recipient Umbra registration: [${sig}](${txLink(sig)})`);
  for (const sig of txs.payerRegistration ?? []) lines.push(`- Payer Umbra registration: [${sig}](${txLink(sig)})`);
  for (const sig of txs.createUtxo ?? []) lines.push(`- Receiver-claimable UTXO create: [${sig}](${txLink(sig)})`);
  for (const sig of txs.claim ?? []) lines.push(`- Receiver claim via relayer: [${sig}](${txLink(sig)})`);
  lines.push(
    "",
    "## Relayer / indexer",
    "",
    `- Relayer: ${result.relayerAddress ?? "unknown"}`,
    `- Supported mints: ${(result.supportedMints ?? []).join(", ")}`,
    `- Indexer health: ${JSON.stringify(result.indexerHealth ?? null)}`,
    "",
    "## Scan",
    "",
    `- Tree index: ${result.scan?.treeIndex}`,
    `- Start insertion index: ${result.scan?.startInsertionIndex}`,
    `- End insertion index: ${result.scan?.endInsertionIndex ?? "current"}`,
    `- Received count: ${result.scan?.receivedCount}`,
    `- Public received count: ${result.scan?.publicReceivedCount}`,
    `- Selected bucket: ${result.scan?.selectedBucket ?? "none"}`,
    `- Selected count: ${result.scan?.selectedCount}`,
  );
  if (result.recipientEncryptedBalanceBefore || result.recipientEncryptedBalanceAfter) {
    lines.push("", "## Recipient encrypted balance", "", "```json", JSON.stringify({ before: result.recipientEncryptedBalanceBefore, after: result.recipientEncryptedBalanceAfter }, null, 2), "```");
  }
  if (result.error) lines.push("", "## Error", "", "```json", JSON.stringify(result.error, null, 2), "```");
  return `${lines.join("\n")}\n`;
}

function resolveKeypairPath(path, label) {
  if (path) return path;
  if (["payer", "funder"].includes(label)) {
    const defaultPath = join(os.homedir(), ".config", "solana", "id.json");
    if (existsSync(defaultPath)) return defaultPath;
  }
  return null;
}

function loadKeypair(keypairPath, label) {
  if (!keypairPath) return Keypair.generate();
  const bytes = JSON.parse(readFileSync(keypairPath, "utf8"));
  if (!Array.isArray(bytes)) throw new Error(`Keypair file must contain a byte array: ${keypairPath}`);
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

function keypairSource(path) {
  if (path) return path;
  return "ephemeral";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
