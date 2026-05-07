#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const require = createRequire(import.meta.url);
const sdk = require("../packages/per-client/node_modules/@magicblock-labs/ephemeral-rollups-sdk/lib/index.js");
const { getAuthToken } = require("../packages/per-client/node_modules/@magicblock-labs/ephemeral-rollups-sdk");
const nacl = require("../packages/per-client/node_modules/tweetnacl");
const pda = require("../packages/per-client/node_modules/@magicblock-labs/ephemeral-rollups-sdk/lib/pda.js");

const PROGRAM_ID = new PublicKey(process.env.QUASAR_PER_PROGRAM_ID || "7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb");
const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
const TEE_RPC_URL = process.env.TEE_RPC_URL || "https://devnet-tee.magicblock.app";
const KEYPAIR_PATH = process.env.SOLANA_KEYPAIR || path.join(os.homedir(), ".config/solana/id.json");
const AMOUNT_LAMPORTS = BigInt(process.env.QUASAR_PER_SMOKE_LAMPORTS || "1000000");
const AGENT_FUND_LAMPORTS = Number(process.env.QUASAR_PER_AGENT_FUND_LAMPORTS || "50000000");
const SKIP_COMMIT_ON_RELEASE_FAIL = process.env.QUASAR_PER_SKIP_COMMIT_ON_RELEASE_FAIL === "1";
const POST_DELEGATE_WAIT_MS = Number(process.env.QUASAR_PER_POST_DELEGATE_WAIT_MS || "0");
const OUT_DIR = process.env.OUT_DIR || path.join("artifacts", "quasar-per-agent-vault-delegation-smoke", new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"));
const DEVNET_TEE_VALIDATOR = new PublicKey(process.env.MAGICBLOCK_TEE_VALIDATOR || "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");

const QPERLOCK = Buffer.from([81, 80, 69, 82, 76, 79, 67, 75]);
const QPERDELG = Buffer.from([81, 80, 69, 82, 68, 69, 76, 71]);
const QPERCMIT = Buffer.from([81, 80, 69, 82, 67, 77, 73, 84]);
const QPERVALT = Buffer.from([81, 80, 69, 82, 86, 65, 76, 84]);
const QPERVDEL = Buffer.from([81, 80, 69, 82, 86, 68, 69, 76]);
const QPERVINT = Buffer.from([81, 80, 69, 82, 86, 73, 78, 84]);
const QPERVTAK = Buffer.from([81, 80, 69, 82, 86, 80, 82, 86]); // QPERVPRV private_take_to_agent_vault
const VAULT_CREDIT_INTENT_SPACE = 145;

function u64le(value) {
  const out = Buffer.alloc(8);
  out.writeBigUInt64LE(BigInt(value));
  return out;
}
function loadKeypair(file) {
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
}
function writeJson(name, value) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, name), `${JSON.stringify(value, null, 2)}\n`);
}
function accountSummary(info) {
  return info && { owner: info.owner.toBase58(), lamports: info.lamports, dataLength: info.data.length, executable: info.executable, dataPrefixHex: Buffer.from(info.data.slice(0, 16)).toString("hex") };
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function errorSummary(error) {
  return { name: error?.name, message: error?.message, logs: error?.logs || error?.transactionLogs || undefined, stack: error?.stack?.split("\n").slice(0, 6) };
}
async function simulateFailure(connection, tx, signers) {
  try {
    tx.feePayer ||= signers[0]?.publicKey;
    tx.recentBlockhash ||= (await connection.getLatestBlockhash("confirmed")).blockhash;
    tx.sign(...signers);
    return (await connection.simulateTransaction(tx)).value;
  } catch (simulationError) {
    return { simulationCaptureError: errorSummary(simulationError) };
  }
}
async function sendCaptured(connection, tx, signers, label) {
  try {
    const signature = await sendAndConfirmTransaction(connection, tx, signers, { commitment: "confirmed" });
    return { ok: true, signature };
  } catch (error) {
    const simulation = await simulateFailure(connection, tx, signers);
    const summary = { ok: false, ...errorSummary(error), simulation };
    writeJson(`${label}-error.json`, summary);
    return summary;
  }
}

const connection = new Connection(RPC_URL, "confirmed");
const payer = loadKeypair(KEYPAIR_PATH);
const agent = Keypair.generate();
const intent = Keypair.generate();
let teeRpcUrlWithAuth = TEE_RPC_URL;
let teeAuthMetadata = null;
if (TEE_RPC_URL.startsWith("https://devnet-tee.magicblock.app") && process.env.MAGICBLOCK_TEE_AUTH !== "0") {
  const auth = await getAuthToken(TEE_RPC_URL, payer.publicKey, (message) => Promise.resolve(nacl.sign.detached(message, payer.secretKey)));
  teeRpcUrlWithAuth = `${TEE_RPC_URL}?token=${encodeURIComponent(auth.token)}`;
  teeAuthMetadata = { endpoint: TEE_RPC_URL, wallet: payer.publicKey.toBase58(), tokenLength: auth.token.length, expiresAt: auth.expiresAt, tokenRedacted: true };
}
const teeConnection = new Connection(teeRpcUrlWithAuth, "confirmed");

const [counter] = PublicKey.findProgramAddressSync([Buffer.from("counter"), payer.publicKey.toBuffer()], PROGRAM_ID);
const counterInfo = await connection.getAccountInfo(counter, "confirmed");
const nextEscrowId = counterInfo && counterInfo.data.length >= 41 ? counterInfo.data.readBigUInt64LE(33) : 0n;
const ESCROW_ID = BigInt(process.env.QUASAR_PER_ESCROW_ID || nextEscrowId.toString());
const escrowIdBytes = u64le(ESCROW_ID);
const [escrow] = PublicKey.findProgramAddressSync([Buffer.from("escrow"), payer.publicKey.toBuffer(), escrowIdBytes], PROGRAM_ID);
const [vault] = PublicKey.findProgramAddressSync([Buffer.from("agent_vault"), agent.publicKey.toBuffer()], PROGRAM_ID);

const escrowPermission = pda.permissionPdaFromAccount(escrow);
const escrowPermissionDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(escrowPermission, sdk.PERMISSION_PROGRAM_ID);
const escrowPermissionDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(escrowPermission);
const escrowPermissionDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(escrowPermission);
const escrowDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(escrow, PROGRAM_ID);
const escrowDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(escrow);
const escrowDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(escrow);

const vaultPermission = pda.permissionPdaFromAccount(vault);
const vaultPermissionDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(vaultPermission, sdk.PERMISSION_PROGRAM_ID);
const vaultPermissionDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(vaultPermission);
const vaultPermissionDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(vaultPermission);
const vaultDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(vault, PROGRAM_ID);
const vaultDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(vault);
const vaultDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(vault);

const addresses = {
  rpcUrl: RPC_URL, teeRpcUrl: TEE_RPC_URL, teeAuth: teeAuthMetadata, programId: PROGRAM_ID.toBase58(),
  payer: payer.publicKey.toBase58(), agent: agent.publicKey.toBase58(), counter: counter.toBase58(), escrow: escrow.toBase58(), escrowId: ESCROW_ID.toString(), vault: vault.toBase58(), intent: intent.publicKey.toBase58(),
  escrowPermission: escrowPermission.toBase58(), escrowDelegateBuffer: escrowDelegateBuffer.toBase58(), escrowDelegationRecord: escrowDelegationRecord.toBase58(), escrowDelegationMetadata: escrowDelegationMetadata.toBase58(),
  vaultPermission: vaultPermission.toBase58(), vaultDelegateBuffer: vaultDelegateBuffer.toBase58(), vaultDelegationRecord: vaultDelegationRecord.toBase58(), vaultDelegationMetadata: vaultDelegationMetadata.toBase58(),
  permissionProgram: sdk.PERMISSION_PROGRAM_ID.toBase58(), delegationProgram: sdk.DELEGATION_PROGRAM_ID.toBase58(), magicProgram: sdk.MAGIC_PROGRAM_ID.toBase58(), magicContext: sdk.MAGIC_CONTEXT_ID.toBase58(), validator: DEVNET_TEE_VALIDATOR.toBase58(),
};
writeJson("00-addresses.json", addresses);

const payerBalanceBefore = await connection.getBalance(payer.publicKey, "confirmed");
const intentRentLamports = await connection.getMinimumBalanceForRentExemption(VAULT_CREDIT_INTENT_SPACE, "confirmed");
const fundAgentResult = await sendCaptured(connection, new Transaction().add(SystemProgram.transfer({ fromPubkey: payer.publicKey, toPubkey: agent.publicKey, lamports: AGENT_FUND_LAMPORTS })), [payer], "01-fund-agent");
const createIntentResult = await sendCaptured(connection, new Transaction().add(SystemProgram.createAccount({ fromPubkey: payer.publicKey, newAccountPubkey: intent.publicKey, lamports: intentRentLamports, space: VAULT_CREDIT_INTENT_SPACE, programId: PROGRAM_ID })), [payer, intent], "01b-create-vault-credit-intent");
const lockResult = await sendCaptured(connection, new Transaction().add({ programId: PROGRAM_ID, keys: [
  { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: agent.publicKey, isSigner: false, isWritable: false }, { pubkey: counter, isSigner: false, isWritable: true }, { pubkey: escrow, isSigner: false, isWritable: true }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
], data: Buffer.concat([QPERLOCK, u64le(AMOUNT_LAMPORTS), escrowIdBytes]) }), [payer], "02-lock");
const prepareVaultResult = await sendCaptured(connection, new Transaction().add({ programId: PROGRAM_ID, keys: [
  { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: agent.publicKey, isSigner: false, isWritable: false }, { pubkey: vault, isSigner: false, isWritable: true }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
], data: QPERVALT }), [payer], "03-prepare-vault");

let delegateEscrowResult = { ok: false, skipped: true, reason: "setup failed" };
let prepareIntentResult = { ok: false, skipped: true, reason: "setup failed" };
let delegateVaultResult = { ok: false, skipped: true, reason: "setup failed" };
let releaseToVaultResult = { ok: false, skipped: true, reason: "delegation failed" };
let commitEscrowResult = { ok: false, skipped: true, reason: "delegation failed" };
if (fundAgentResult.ok && createIntentResult.ok && lockResult.ok && prepareVaultResult.ok) {
  prepareIntentResult = await sendCaptured(connection, new Transaction().add({ programId: PROGRAM_ID, keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: escrow, isSigner: false, isWritable: false }, { pubkey: agent.publicKey, isSigner: false, isWritable: false }, { pubkey: vault, isSigner: false, isWritable: false }, { pubkey: intent.publicKey, isSigner: false, isWritable: true },
  ], data: Buffer.concat([QPERVINT, escrowIdBytes]) }), [payer], "03b-prepare-vault-credit-intent");
}
if (fundAgentResult.ok && createIntentResult.ok && lockResult.ok && prepareVaultResult.ok && prepareIntentResult.ok) {
  delegateEscrowResult = await sendCaptured(connection, new Transaction().add({ programId: PROGRAM_ID, keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: escrow, isSigner: false, isWritable: true }, { pubkey: escrowPermission, isSigner: false, isWritable: true }, { pubkey: sdk.PERMISSION_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: sdk.DELEGATION_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: escrowPermissionDelegateBuffer, isSigner: false, isWritable: true }, { pubkey: escrowPermissionDelegationRecord, isSigner: false, isWritable: true }, { pubkey: escrowPermissionDelegationMetadata, isSigner: false, isWritable: true }, { pubkey: escrowDelegateBuffer, isSigner: false, isWritable: true }, { pubkey: escrowDelegationRecord, isSigner: false, isWritable: true }, { pubkey: escrowDelegationMetadata, isSigner: false, isWritable: true }, { pubkey: DEVNET_TEE_VALIDATOR, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ], data: Buffer.concat([QPERDELG, escrowIdBytes]) }), [payer], "04-delegate-escrow");
  delegateVaultResult = await sendCaptured(connection, new Transaction().add({ programId: PROGRAM_ID, keys: [
    { pubkey: agent.publicKey, isSigner: true, isWritable: true }, { pubkey: vault, isSigner: false, isWritable: true }, { pubkey: vaultPermission, isSigner: false, isWritable: true }, { pubkey: sdk.PERMISSION_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: sdk.DELEGATION_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: vaultPermissionDelegateBuffer, isSigner: false, isWritable: true }, { pubkey: vaultPermissionDelegationRecord, isSigner: false, isWritable: true }, { pubkey: vaultPermissionDelegationMetadata, isSigner: false, isWritable: true }, { pubkey: vaultDelegateBuffer, isSigner: false, isWritable: true }, { pubkey: vaultDelegationRecord, isSigner: false, isWritable: true }, { pubkey: vaultDelegationMetadata, isSigner: false, isWritable: true }, { pubkey: DEVNET_TEE_VALIDATOR, isSigner: false, isWritable: false }, { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ], data: QPERVDEL }), [agent], "05-delegate-agent-vault");
}

if (delegateEscrowResult.ok && delegateVaultResult.ok) {
  if (POST_DELEGATE_WAIT_MS > 0) await sleep(POST_DELEGATE_WAIT_MS);
  writeJson("05b-post-delegate-tee-accounts.json", {
    escrowTee: accountSummary(await teeConnection.getAccountInfo(escrow, "confirmed")),
    vaultTee: accountSummary(await teeConnection.getAccountInfo(vault, "confirmed")),
    escrowBase: accountSummary(await connection.getAccountInfo(escrow, "confirmed")),
    vaultBase: accountSummary(await connection.getAccountInfo(vault, "confirmed")),
    intentBase: accountSummary(await connection.getAccountInfo(intent.publicKey, "confirmed")),
  });
  releaseToVaultResult = await sendCaptured(teeConnection, new Transaction().add({ programId: PROGRAM_ID, keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: agent.publicKey, isSigner: false, isWritable: false }, { pubkey: escrow, isSigner: false, isWritable: true }, { pubkey: vault, isSigner: false, isWritable: true }, { pubkey: intent.publicKey, isSigner: false, isWritable: false },
  ], data: Buffer.concat([QPERVTAK, escrowIdBytes]) }), [payer], "06-tee-private-take-to-agent-vault");
  if (!releaseToVaultResult.ok && SKIP_COMMIT_ON_RELEASE_FAIL) {
    commitEscrowResult = { ok: false, skipped: true, reason: "release_to_vault failed and QUASAR_PER_SKIP_COMMIT_ON_RELEASE_FAIL=1" };
  } else {
    commitEscrowResult = await sendCaptured(teeConnection, new Transaction().add({ programId: PROGRAM_ID, keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true }, { pubkey: escrow, isSigner: false, isWritable: true }, { pubkey: escrowPermission, isSigner: false, isWritable: true }, { pubkey: sdk.PERMISSION_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: sdk.MAGIC_PROGRAM_ID, isSigner: false, isWritable: false }, { pubkey: sdk.MAGIC_CONTEXT_ID, isSigner: false, isWritable: true },
  ], data: Buffer.concat([QPERCMIT, escrowIdBytes]) }), [payer], "07-commit-escrow");
  }
}

const postAccounts = {
  escrowBase: accountSummary(await connection.getAccountInfo(escrow, "confirmed")),
  vaultBase: accountSummary(await connection.getAccountInfo(vault, "confirmed")),
  intentBase: accountSummary(await connection.getAccountInfo(intent.publicKey, "confirmed")),
  escrowTee: accountSummary(await teeConnection.getAccountInfo(escrow, "confirmed")),
  vaultTee: accountSummary(await teeConnection.getAccountInfo(vault, "confirmed")),
  agent: accountSummary(await connection.getAccountInfo(agent.publicKey, "confirmed")),
  escrowPermission: accountSummary(await connection.getAccountInfo(escrowPermission, "confirmed")),
  vaultPermission: accountSummary(await connection.getAccountInfo(vaultPermission, "confirmed")),
};
const summary = {
  ok: Boolean(fundAgentResult.ok && createIntentResult.ok && lockResult.ok && prepareVaultResult.ok && prepareIntentResult.ok && delegateEscrowResult.ok && delegateVaultResult.ok && releaseToVaultResult.ok && commitEscrowResult.ok),
  addresses, payerBalanceBefore, payerBalanceAfter: await connection.getBalance(payer.publicKey, "confirmed"), amountLamports: AMOUNT_LAMPORTS.toString(), agentFundLamports: AGENT_FUND_LAMPORTS, intentRentLamports,
  fundAgentResult, createIntentResult, lockResult, prepareVaultResult, prepareIntentResult, delegateEscrowResult, delegateVaultResult, releaseToVaultResult, commitEscrowResult, postAccounts,
};
writeJson("summary.json", summary);
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
