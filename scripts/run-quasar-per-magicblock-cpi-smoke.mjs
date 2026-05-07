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
const OUT_DIR = process.env.OUT_DIR || path.join("artifacts", "quasar-per-magicblock-cpi-smoke", new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"));
const DEVNET_TEE_VALIDATOR = new PublicKey(process.env.MAGICBLOCK_TEE_VALIDATOR || "MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo");

const QPERLOCK = Buffer.from([81, 80, 69, 82, 76, 79, 67, 75]);
const QPERTAKE = Buffer.from([81, 80, 69, 82, 84, 65, 75, 69]);
const QPERDELG = Buffer.from([81, 80, 69, 82, 68, 69, 76, 71]);
const QPERCMIT = Buffer.from([81, 80, 69, 82, 67, 77, 73, 84]);

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
  return info && {
    owner: info.owner.toBase58(),
    lamports: info.lamports,
    dataLength: info.data.length,
    executable: info.executable,
  };
}

function errorSummary(error) {
  return {
    name: error?.name,
    message: error?.message,
    logs: error?.logs || error?.transactionLogs || undefined,
    stack: error?.stack?.split("\n").slice(0, 6),
  };
}

async function simulateFailure(connection, tx, signers) {
  try {
    tx.feePayer ||= signers[0]?.publicKey;
    tx.recentBlockhash ||= (await connection.getLatestBlockhash("confirmed")).blockhash;
    tx.sign(...signers);
    const simulation = await connection.simulateTransaction(tx);
    return simulation.value;
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
let teeRpcUrlWithAuth = TEE_RPC_URL;
let teeAuthMetadata = null;
if (TEE_RPC_URL.startsWith("https://devnet-tee.magicblock.app") && process.env.MAGICBLOCK_TEE_AUTH !== "0") {
  const auth = await getAuthToken(TEE_RPC_URL, payer.publicKey, (message) =>
    Promise.resolve(nacl.sign.detached(message, payer.secretKey))
  );
  teeRpcUrlWithAuth = `${TEE_RPC_URL}?token=${encodeURIComponent(auth.token)}`;
  teeAuthMetadata = {
    endpoint: TEE_RPC_URL,
    wallet: payer.publicKey.toBase58(),
    tokenLength: auth.token.length,
    expiresAt: auth.expiresAt,
    tokenRedacted: true,
  };
}
const teeConnection = new Connection(teeRpcUrlWithAuth, "confirmed");
const payee = Keypair.generate().publicKey;
const [counter] = PublicKey.findProgramAddressSync([Buffer.from("counter"), payer.publicKey.toBuffer()], PROGRAM_ID);
const counterInfo = await connection.getAccountInfo(counter, "confirmed");
const nextEscrowId = counterInfo && counterInfo.data.length >= 41 ? counterInfo.data.readBigUInt64LE(33) : 0n;
const ESCROW_ID = BigInt(process.env.QUASAR_PER_ESCROW_ID || nextEscrowId.toString());
const escrowIdBytes = u64le(ESCROW_ID);
const [escrow] = PublicKey.findProgramAddressSync([Buffer.from("escrow"), payer.publicKey.toBuffer(), escrowIdBytes], PROGRAM_ID);

const permission = pda.permissionPdaFromAccount(escrow);
const permissionDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(permission, sdk.PERMISSION_PROGRAM_ID);
const permissionDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(permission);
const permissionDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(permission);
const escrowDelegateBuffer = pda.delegateBufferPdaFromDelegatedAccountAndOwnerProgram(escrow, PROGRAM_ID);
const escrowDelegationRecord = pda.delegationRecordPdaFromDelegatedAccount(escrow);
const escrowDelegationMetadata = pda.delegationMetadataPdaFromDelegatedAccount(escrow);

const addresses = {
  rpcUrl: RPC_URL,
  teeRpcUrl: TEE_RPC_URL,
  teeAuth: teeAuthMetadata,
  programId: PROGRAM_ID.toBase58(),
  payer: payer.publicKey.toBase58(),
  payee: payee.toBase58(),
  counter: counter.toBase58(),
  escrow: escrow.toBase58(),
  escrowId: ESCROW_ID.toString(),
  permission: permission.toBase58(),
  permissionDelegateBuffer: permissionDelegateBuffer.toBase58(),
  permissionDelegationRecord: permissionDelegationRecord.toBase58(),
  permissionDelegationMetadata: permissionDelegationMetadata.toBase58(),
  escrowDelegateBuffer: escrowDelegateBuffer.toBase58(),
  escrowDelegationRecord: escrowDelegationRecord.toBase58(),
  escrowDelegationMetadata: escrowDelegationMetadata.toBase58(),
  permissionProgram: sdk.PERMISSION_PROGRAM_ID.toBase58(),
  delegationProgram: sdk.DELEGATION_PROGRAM_ID.toBase58(),
  magicProgram: sdk.MAGIC_PROGRAM_ID.toBase58(),
  magicContext: sdk.MAGIC_CONTEXT_ID.toBase58(),
  validator: DEVNET_TEE_VALIDATOR.toBase58(),
};
writeJson("00-addresses.json", addresses);

const before = await connection.getBalance(payer.publicKey, "confirmed");
const fundPayeeResult = await sendCaptured(
  connection,
  new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: payee,
      lamports: 1_000_000,
    }),
  ),
  [payer],
  "01-fund-payee",
);

const lockIx = {
  programId: PROGRAM_ID,
  keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: payee, isSigner: false, isWritable: false },
    { pubkey: counter, isSigner: false, isWritable: true },
    { pubkey: escrow, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.concat([QPERLOCK, u64le(AMOUNT_LAMPORTS), escrowIdBytes]),
};
const lockResult = await sendCaptured(connection, new Transaction().add(lockIx), [payer], "02-lock");
if (!lockResult.ok || !fundPayeeResult.ok) {
  const summary = { ok: false, stage: "setup", addresses, payerBalanceBefore: before, fundPayeeResult, lockResult };
  writeJson("summary.json", summary);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(1);
}

const delegateIx = {
  programId: PROGRAM_ID,
  keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: escrow, isSigner: false, isWritable: true },
    { pubkey: permission, isSigner: false, isWritable: true },
    { pubkey: sdk.PERMISSION_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: sdk.DELEGATION_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: permissionDelegateBuffer, isSigner: false, isWritable: true },
    { pubkey: permissionDelegationRecord, isSigner: false, isWritable: true },
    { pubkey: permissionDelegationMetadata, isSigner: false, isWritable: true },
    { pubkey: escrowDelegateBuffer, isSigner: false, isWritable: true },
    { pubkey: escrowDelegationRecord, isSigner: false, isWritable: true },
    { pubkey: escrowDelegationMetadata, isSigner: false, isWritable: true },
    { pubkey: DEVNET_TEE_VALIDATOR, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: Buffer.concat([QPERDELG, escrowIdBytes]),
};
const delegateResult = await sendCaptured(connection, new Transaction().add(delegateIx), [payer], "03-delegate-per");
const postDelegateAccounts = {
  escrow: accountSummary(await connection.getAccountInfo(escrow, "confirmed")),
  permission: accountSummary(await connection.getAccountInfo(permission, "confirmed")),
  permissionDelegateBuffer: accountSummary(await connection.getAccountInfo(permissionDelegateBuffer, "confirmed")),
  permissionDelegationRecord: accountSummary(await connection.getAccountInfo(permissionDelegationRecord, "confirmed")),
  permissionDelegationMetadata: accountSummary(await connection.getAccountInfo(permissionDelegationMetadata, "confirmed")),
  escrowDelegateBuffer: accountSummary(await connection.getAccountInfo(escrowDelegateBuffer, "confirmed")),
  escrowDelegationRecord: accountSummary(await connection.getAccountInfo(escrowDelegationRecord, "confirmed")),
  escrowDelegationMetadata: accountSummary(await connection.getAccountInfo(escrowDelegationMetadata, "confirmed")),
};
writeJson("03-post-delegate-accounts.json", postDelegateAccounts);

let releaseResult = { ok: false, skipped: true, reason: "delegate_per did not succeed" };
let commitResult = { ok: false, skipped: true, reason: "delegate_per did not succeed" };
if (delegateResult.ok) {
  const releaseIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: payee, isSigner: false, isWritable: false },
      { pubkey: escrow, isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([QPERTAKE, escrowIdBytes]),
  };
  releaseResult = await sendCaptured(teeConnection, new Transaction().add(releaseIx), [payer], "04-release-private");

  const commitIx = {
    programId: PROGRAM_ID,
    keys: [
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: escrow, isSigner: false, isWritable: true },
      { pubkey: permission, isSigner: false, isWritable: true },
      { pubkey: sdk.PERMISSION_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: sdk.MAGIC_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: sdk.MAGIC_CONTEXT_ID, isSigner: false, isWritable: true },
    ],
    data: Buffer.concat([QPERCMIT, escrowIdBytes]),
  };
  commitResult = await sendCaptured(teeConnection, new Transaction().add(commitIx), [payer], "05-commit-undelegate-per");
}

const after = await connection.getBalance(payer.publicKey, "confirmed");
const postCommitAccounts = {
  escrow: accountSummary(await connection.getAccountInfo(escrow, "confirmed")),
  payee: accountSummary(await connection.getAccountInfo(payee, "confirmed")),
  permission: accountSummary(await connection.getAccountInfo(permission, "confirmed")),
};
writeJson("06-post-commit-accounts.json", postCommitAccounts);
const summary = {
  ok: Boolean(lockResult.ok && delegateResult.ok && releaseResult.ok && commitResult.ok),
  addresses,
  payerBalanceBefore: before,
  payerBalanceAfter: after,
  amountLamports: AMOUNT_LAMPORTS.toString(),
  fundPayeeResult,
  lockResult,
  delegateResult,
  releaseResult,
  commitResult,
  postDelegateAccounts,
  postCommitAccounts,
};
writeJson("summary.json", summary);
console.log(JSON.stringify(summary, null, 2));
if (!summary.ok) process.exit(1);
