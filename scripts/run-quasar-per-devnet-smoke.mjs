#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

const PROGRAM_ID = new PublicKey(process.env.QUASAR_PER_PROGRAM_ID || "7ra8FZAHQ6F4SGfJJdjfgLuVnSN8HsGLx5iXq8qxSCpb");
const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
const KEYPAIR_PATH = process.env.SOLANA_KEYPAIR || path.join(os.homedir(), ".config/solana/id.json");
const AMOUNT_LAMPORTS = BigInt(process.env.QUASAR_PER_SMOKE_LAMPORTS || "1000000");
const OUT_DIR = process.env.OUT_DIR || path.join("artifacts", "quasar-per-devnet-smoke", new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z"));

const QPERLOCK = Buffer.from([81, 80, 69, 82, 76, 79, 67, 75]);
const QPERTAKE = Buffer.from([81, 80, 69, 82, 84, 65, 75, 69]);

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

const connection = new Connection(RPC_URL, "confirmed");
const payer = loadKeypair(KEYPAIR_PATH);
const payee = Keypair.generate().publicKey;
const [counter] = PublicKey.findProgramAddressSync([Buffer.from("counter"), payer.publicKey.toBuffer()], PROGRAM_ID);
const counterInfo = await connection.getAccountInfo(counter, "confirmed");
// UserEscrowCounter layout: 1-byte discriminator, 32-byte payer, u64 next_id, u8 bump.
const nextEscrowId = counterInfo && counterInfo.data.length >= 41
  ? counterInfo.data.readBigUInt64LE(33)
  : 0n;
const ESCROW_ID = BigInt(process.env.QUASAR_PER_ESCROW_ID || nextEscrowId.toString());
const escrowIdBytes = u64le(ESCROW_ID);
const [escrow] = PublicKey.findProgramAddressSync([Buffer.from("escrow"), payer.publicKey.toBuffer(), escrowIdBytes], PROGRAM_ID);

const lockData = Buffer.concat([QPERLOCK, u64le(AMOUNT_LAMPORTS), escrowIdBytes]);
const lockIx = {
  programId: PROGRAM_ID,
  keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: payee, isSigner: false, isWritable: false },
    { pubkey: counter, isSigner: false, isWritable: true },
    { pubkey: escrow, isSigner: false, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ],
  data: lockData,
};

const releaseIx = {
  programId: PROGRAM_ID,
  keys: [
    { pubkey: payer.publicKey, isSigner: true, isWritable: true },
    { pubkey: payee, isSigner: false, isWritable: true },
    { pubkey: escrow, isSigner: false, isWritable: true },
  ],
  data: Buffer.concat([QPERTAKE, escrowIdBytes]),
};

const before = await connection.getBalance(payer.publicKey, "confirmed");
const fundPayeeSig = await sendAndConfirmTransaction(
  connection,
  new Transaction().add(SystemProgram.transfer({
    fromPubkey: payer.publicKey,
    toPubkey: payee,
    lamports: 1_000_000,
  })),
  [payer],
  { commitment: "confirmed" },
);
const lockTx = new Transaction().add(lockIx);
const lockSig = await sendAndConfirmTransaction(connection, lockTx, [payer], { commitment: "confirmed" });
const escrowAccountAfterLock = await connection.getAccountInfo(escrow, "confirmed");

const releaseTx = new Transaction().add(releaseIx);
const releaseSig = await sendAndConfirmTransaction(connection, releaseTx, [payer], { commitment: "confirmed" });
const escrowAccountAfterRelease = await connection.getAccountInfo(escrow, "confirmed");
const after = await connection.getBalance(payer.publicKey, "confirmed");

const summary = {
  ok: true,
  rpcUrl: RPC_URL,
  programId: PROGRAM_ID.toBase58(),
  payer: payer.publicKey.toBase58(),
  payee: payee.toBase58(),
  counter: counter.toBase58(),
  escrow: escrow.toBase58(),
  escrowId: ESCROW_ID.toString(),
  amountLamports: AMOUNT_LAMPORTS.toString(),
  payerBalanceBefore: before,
  payerBalanceAfter: after,
  fundPayeeSig,
  lockSig,
  releaseSig,
  escrowAccountAfterLock: escrowAccountAfterLock && {
    owner: escrowAccountAfterLock.owner.toBase58(),
    lamports: escrowAccountAfterLock.lamports,
    dataLength: escrowAccountAfterLock.data.length,
  },
  escrowAccountAfterRelease: escrowAccountAfterRelease && {
    owner: escrowAccountAfterRelease.owner.toBase58(),
    lamports: escrowAccountAfterRelease.lamports,
    dataLength: escrowAccountAfterRelease.data.length,
  },
};
writeJson("summary.json", summary);
console.log(JSON.stringify(summary, null, 2));
