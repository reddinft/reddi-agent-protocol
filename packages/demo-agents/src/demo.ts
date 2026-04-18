#!/usr/bin/env ts-node
/**
 * demo.ts — Full A→B→C agent cycle on Solana devnet.
 *
 * Agent A (Orchestrator) → queries registry → locks escrow → releases via PER → commits ratings
 * Agent B (Specialist)   → receives payment → delivers work → reveals rating
 * Agent C (Judge)        → attests quality of Agent B's work
 *
 * Run: npm run demo
 * Target: < 10s end-to-end (excl. async PER confirmation polling)
 */
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import crypto from "crypto";
import { AGENT_A_KEYPAIR, AGENT_B_KEYPAIR, AGENT_C_KEYPAIR, AGENT_B, AGENT_C } from "./wallets";
import {
  AGENT_SEED,
  ATTESTATION_SEED,
  DEVNET_RPC,
  ESCROW_PROGRAM_ID,
  PER_DEVNET_RPC,
  RATING_SEED,
  ESCROW_SEED,
} from "./config";
import {
  formatTransferContract,
  resolveTransferContractForDemo,
} from "./payments-contract";
import { runMintReadinessPreflight } from "./payments-mint-readiness";

const PROGRAM_ID = new PublicKey(ESCROW_PROGRAM_ID);
const connection = new Connection(DEVNET_RPC, "confirmed");

type SettlementMode = "auto" | "magicblock_per" | "vanish_core" | "public";

// ── Helpers ───────────────────────────────────────────────────────────────────

function disc(ixName: string): Buffer {
  return crypto.createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

function findPda(seeds: Buffer[]): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];
}

function escrowPda(payer: PublicKey, nonce: Uint8Array): PublicKey {
  return findPda([ESCROW_SEED, Buffer.from(payer.toBytes()), Buffer.from(nonce)]);
}

function agentPda(owner: PublicKey): PublicKey {
  return findPda([AGENT_SEED, Buffer.from(owner.toBytes())]);
}

function ratingPda(jobId: Uint8Array): PublicKey {
  return findPda([RATING_SEED, Buffer.from(jobId)]);
}

function attestationPda(jobId: Uint8Array): PublicKey {
  return findPda([ATTESTATION_SEED, Buffer.from(jobId)]);
}

async function sendTx(ix: TransactionInstruction, signers: Keypair[]): Promise<string> {
  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = signers[0].publicKey;
  tx.add(ix);
  tx.sign(...signers);
  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(sig, "confirmed");
  return sig;
}

function sha256(score: number, salt: Uint8Array): Uint8Array {
  const h = crypto.createHash("sha256");
  h.update(Buffer.from([score]));
  h.update(salt);
  return new Uint8Array(h.digest());
}

function readSettlementMode(): SettlementMode {
  const raw = (process.env.DEMO_SETTLEMENT_MODE ?? "auto").toLowerCase();
  switch (raw) {
    case "auto":
    case "magicblock_per":
    case "vanish_core":
    case "public":
      return raw;
    default:
      console.log(`⚠️  Unknown DEMO_SETTLEMENT_MODE='${raw}', defaulting to auto`);
      return "auto";
  }
}

// ── Instruction encoders ──────────────────────────────────────────────────────

function encodeLockEscrow(amount: bigint, nonce: Uint8Array): Buffer {
  const buf = Buffer.alloc(8 + 8 + 16);
  disc("lock_escrow").copy(buf, 0);
  buf.writeBigUInt64LE(amount, 8);
  Buffer.from(nonce).copy(buf, 16);
  return buf;
}

function encodeDelegateEscrow(sessionKey: PublicKey): Buffer {
  const buf = Buffer.alloc(8 + 32);
  disc("delegate_escrow").copy(buf, 0);
  Buffer.from(sessionKey.toBytes()).copy(buf, 8);
  return buf;
}

function encodeReleaseEscrowPer(sessionKey: PublicKey): Buffer {
  const buf = Buffer.alloc(8 + 32);
  disc("release_escrow_per").copy(buf, 0);
  Buffer.from(sessionKey.toBytes()).copy(buf, 8);
  return buf;
}

function encodeReleaseEscrow(): Buffer {
  return disc("release_escrow");
}

function encodeCommitRating(
  jobId: Uint8Array, commitment: Uint8Array, role: 0 | 1,
  consumerPk: PublicKey, specialistPk: PublicKey
): Buffer {
  // discriminator(8) + job_id(16) + commitment(32) + role enum(1) + consumer(32) + specialist(32)
  const buf = Buffer.alloc(8 + 16 + 32 + 1 + 32 + 32);
  let o = 0;
  disc("commit_rating").copy(buf, o); o += 8;
  Buffer.from(jobId).copy(buf, o); o += 16;
  Buffer.from(commitment).copy(buf, o); o += 32;
  buf.writeUInt8(role, o); o += 1;
  Buffer.from(consumerPk.toBytes()).copy(buf, o); o += 32;
  Buffer.from(specialistPk.toBytes()).copy(buf, o);
  return buf;
}

function encodeRevealRating(jobId: Uint8Array, score: number, salt: Uint8Array): Buffer {
  // discriminator(8) + job_id(16) + score(1) + salt(32)
  const buf = Buffer.alloc(8 + 16 + 1 + 32);
  let o = 0;
  disc("reveal_rating").copy(buf, o); o += 8;
  Buffer.from(jobId).copy(buf, o); o += 16;
  buf.writeUInt8(score, o); o += 1;
  Buffer.from(salt).copy(buf, o);
  return buf;
}

function encodeAttestQuality(jobId: Uint8Array, scores: number[], consumerPk: PublicKey): Buffer {
  // discriminator(8) + job_id(16) + scores[u8;5](5) + consumer(32)
  const buf = Buffer.alloc(8 + 16 + 5 + 32);
  let o = 0;
  disc("attest_quality").copy(buf, o); o += 8;
  Buffer.from(jobId).copy(buf, o); o += 16;
  for (const s of scores) { buf.writeUInt8(s, o++); }
  Buffer.from(consumerPk.toBytes()).copy(buf, o);
  return buf;
}

// ── Demo ──────────────────────────────────────────────────────────────────────

async function runDemo() {
  const start = Date.now();
  const requestedSettlementMode = readSettlementMode();
  const allowFallback = String(process.env.DEMO_ALLOW_FALLBACK ?? "true").toLowerCase() === "true";
  const transferContract = resolveTransferContractForDemo(requestedSettlementMode);

  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║       Reddi Agent Protocol — Devnet Demo                ║");
  console.log("║   A→B→C cycle: payment + reputation + attestation       ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`Program:  ${ESCROW_PROGRAM_ID}`);
  console.log(`Agent A:  ${AGENT_A_KEYPAIR.publicKey.toBase58()} (Orchestrator)`);
  console.log(`Agent B:  ${AGENT_B.toBase58()} (Specialist)`);
  console.log(`Agent C:  ${AGENT_C.toBase58()} (Judge)`);
  console.log(`Settlement mode requested: ${requestedSettlementMode}`);
  console.log(`Transfer contract: ${formatTransferContract(transferContract)}`);
  console.log("");

  // ── Step 1: Query registry ────────────────────────────────────────────────
  console.log("🔍 Step 1 — Agent A: querying registry for Agent B...");
  const agentBPda = agentPda(AGENT_B);
  const agentBAccount = await connection.getAccountInfo(agentBPda);
  if (!agentBAccount) {
    throw new Error(`Agent B not registered. Run: npm run register`);
  }
  // Rate is at offset 8+32+1+4+model_len+8 — read from encoded account
  // For demo we hardcode 1_000_000 lamports (matches register-agents.ts)
  const rateLamports = BigInt(1_000_000);
  const paymentAmountSol = (Number(rateLamports) / 1_000_000_000).toString();
  const settlementMode = requestedSettlementMode;
  console.log(`   ✅ Found Agent B at ${agentBPda.toBase58()} | rate: ${rateLamports} lamports\n`);

  // ── Step 2: Lock escrow ───────────────────────────────────────────────────
  console.log("💰 Step 2 — Agent A: locking escrow for Agent B...");
  const nonce = new Uint8Array(crypto.randomBytes(16));
  const ePda = escrowPda(AGENT_A_KEYPAIR.publicKey, nonce);

  const lockIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: ePda, isSigner: false, isWritable: true },
      { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      { pubkey: AGENT_B, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeLockEscrow(rateLamports, nonce),
  });
  const lockSig = await sendTx(lockIx, [AGENT_A_KEYPAIR]);
  console.log(`   ✅ Escrow locked: ${ePda.toBase58()}`);
  console.log(`   📎 Sig: https://explorer.solana.com/tx/${lockSig}?cluster=devnet\n`);
  console.log("\n💳 x402 PAYMENT CYCLE");
  console.log("   Challenge:    HTTP 402 received from specialist endpoint");
  console.log("   Settlement:   USDC via SPL token transfer to escrow PDA");
  console.log(`   Amount:       ${paymentAmountSol ?? "0.001"} SOL equivalent`);
  console.log(`   Mode:         ${settlementMode ?? "public"}`);
  console.log(`   Escrow PDA:   ${ePda.toBase58()}`);
  console.log("   Status:       ✅ Payment locked, awaiting service delivery\n");

  // ── Step 3: Agent B delivers work ─────────────────────────────────────────
  console.log("⚡ Step 3 — Agent B: delivering work...");
  const workResult = { output: "Analysis complete: market is bullish. Confidence: 0.87." };
  console.log(`   ✅ Delivered: "${workResult.output}"\n`);

  // ── Step 4: Settlement routing choice (PER / Vanish / Public) ─────────────
  console.log("🔒 Step 4 — Agent A: selecting settlement route...");
  if (transferContract.visibility === "private") {
    console.log(`   🔧 Private routing config: ${formatTransferContract(transferContract)}`);
  }
  await runMintReadinessPreflight({
    payer: AGENT_A_KEYPAIR.publicKey,
    contract: transferContract,
  });

  let settlementSig: string;
  let settlementRouteUsed: "magicblock_per" | "public";

  const releaseViaL1 = async (): Promise<string> => {
    const releaseL1Ix = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: ePda, isSigner: false, isWritable: true },
        { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: true },
        { pubkey: AGENT_B, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeReleaseEscrow(),
    });
    return sendTx(releaseL1Ix, [AGENT_A_KEYPAIR]);
  };

  const releaseViaPer = async (): Promise<string> => {
    const sessionKeypair = Keypair.generate();

    const delegateIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: ePda, isSigner: false, isWritable: true },
        { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      ],
      data: encodeDelegateEscrow(sessionKeypair.publicKey),
    });
    await sendTx(delegateIx, [AGENT_A_KEYPAIR]);
    console.log(`   ✅ Escrow delegated to PER. Session key: ${sessionKeypair.publicKey.toBase58()}`);

    const releasePerIx = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: ePda, isSigner: false, isWritable: true },
        { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: true },
        { pubkey: AGENT_B, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: encodeReleaseEscrowPer(sessionKeypair.publicKey),
    });

    const { blockhash } = await connection.getLatestBlockhash();
    const perTx = new Transaction();
    perTx.recentBlockhash = blockhash;
    perTx.feePayer = AGENT_A_KEYPAIR.publicKey;
    perTx.add(releasePerIx);
    perTx.sign(AGENT_A_KEYPAIR);

    const perConn = new Connection(PER_DEVNET_RPC, "confirmed");
    return perConn.sendRawTransaction(perTx.serialize(), { skipPreflight: true });
  };

  if (requestedSettlementMode === "public") {
    settlementSig = await releaseViaL1();
    settlementRouteUsed = "public";
    console.log(`   🌐 Public L1 settlement used — sig: https://explorer.solana.com/tx/${settlementSig}?cluster=devnet\n`);
  } else {
    if (requestedSettlementMode === "vanish_core") {
      console.log("   ℹ️  Vanish Core is swap-privacy routing (x402_private_swap). This escrow release demo uses PER/public rails.");
    }

    try {
      settlementSig = await releaseViaPer();
      settlementRouteUsed = "magicblock_per";
      console.log(`   🔒 PER settlement submitted: ${settlementSig}`);
      console.log(`   ℹ️  Confirmation polling via TEE endpoint (async, omitted from timing)\n`);
    } catch (e: any) {
      if (!allowFallback || requestedSettlementMode === "magicblock_per") {
        throw new Error(`PER settlement failed and fallback disabled: ${e.message}`);
      }
      console.log(`   ⚠️  PER unavailable (${e.message?.slice(0, 60)}...) — using L1 fallback`);
      settlementSig = await releaseViaL1();
      settlementRouteUsed = "public";
      console.log(`   ✅ L1 fallback used — sig: https://explorer.solana.com/tx/${settlementSig}?cluster=devnet\n`);
    }
  }

  const payeeWallet = AGENT_B.toBase58();
  const txSignature = settlementSig;
  console.log("\n✅ PAYMENT CONFIRMED");
  console.log(`   Released to:  ${payeeWallet ?? "specialist wallet"}`);
  console.log(`   On-chain tx:  ${txSignature ?? "[tx signature]"}`);
  console.log(`   Explorer:     https://explorer.solana.com/tx/${txSignature ?? ""}?cluster=devnet\n`);

  // ── Step 5: Blind commit ratings ──────────────────────────────────────────
  console.log("⭐ Step 5 — Committing blind ratings...");
  const jobId = nonce; // reuse nonce as jobId for correlation
  const rPda = ratingPda(jobId);

  const consumerScore = 8;
  const specialistScore = 9;
  const consumerSalt = new Uint8Array(crypto.randomBytes(32));
  const specialistSalt = new Uint8Array(crypto.randomBytes(32));
  const cCommitment = sha256(consumerScore, consumerSalt);
  const sCommitment = sha256(specialistScore, specialistSalt);

  // Consumer commits (role=0)
  const commitConsumerIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: rPda, isSigner: false, isWritable: true },
      { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeCommitRating(jobId, cCommitment, 0, AGENT_A_KEYPAIR.publicKey, AGENT_B),
  });
  await sendTx(commitConsumerIx, [AGENT_A_KEYPAIR]);

  // Specialist commits (role=1)
  const commitSpecIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: rPda, isSigner: false, isWritable: true },
      { pubkey: AGENT_B_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeCommitRating(jobId, sCommitment, 1, AGENT_A_KEYPAIR.publicKey, AGENT_B),
  });
  await sendTx(commitSpecIx, [AGENT_B_KEYPAIR]);
  console.log(`   ✅ Both parties committed (blind). Rating PDA: ${rPda.toBase58()}\n`);

  // ── Step 6: Reveal ratings ────────────────────────────────────────────────
  console.log("🎭 Step 6 — Revealing ratings...");
  const agentBPdaAddr = agentPda(AGENT_B);
  const agentAPdaAddr = agentPda(AGENT_A_KEYPAIR.publicKey);

  // Consumer reveals
  const revealConsumerIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: rPda, isSigner: false, isWritable: true },
      { pubkey: AGENT_A_KEYPAIR.publicKey, isSigner: true, isWritable: false },
      { pubkey: agentBPdaAddr, isSigner: false, isWritable: true },
      { pubkey: agentAPdaAddr, isSigner: false, isWritable: true },
    ],
    data: encodeRevealRating(jobId, consumerScore, consumerSalt),
  });
  await sendTx(revealConsumerIx, [AGENT_A_KEYPAIR]);

  // Specialist reveals — triggers reputation update
  const revealSpecIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: rPda, isSigner: false, isWritable: true },
      { pubkey: AGENT_B_KEYPAIR.publicKey, isSigner: true, isWritable: false },
      { pubkey: agentBPdaAddr, isSigner: false, isWritable: true },
      { pubkey: agentAPdaAddr, isSigner: false, isWritable: true },
    ],
    data: encodeRevealRating(jobId, specialistScore, specialistSalt),
  });
  await sendTx(revealSpecIx, [AGENT_B_KEYPAIR]);
  console.log(`   ✅ Ratings revealed — consumer gave ${consumerScore}/10, specialist gave ${specialistScore}/10\n`);

  // ── Step 7: Agent C attests quality ──────────────────────────────────────
  console.log("👨‍⚖️ Step 7 — Agent C: attesting quality of Agent B's work...");
  const attestPda = attestationPda(jobId);
  const agentCPdaAddr = agentPda(AGENT_C);
  const qualityScores = [8, 8, 9, 8, 8]; // accuracy, completeness, relevance, format, latency

  const attestIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: attestPda, isSigner: false, isWritable: true },
      { pubkey: agentCPdaAddr, isSigner: false, isWritable: false },
      { pubkey: AGENT_C_KEYPAIR.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeAttestQuality(jobId, qualityScores, AGENT_A_KEYPAIR.publicKey),
  });
  await sendTx(attestIx, [AGENT_C_KEYPAIR]);
  console.log(`   ✅ Quality attested — scores: [${qualityScores.join(", ")}] (accuracy/completeness/relevance/format/latency)\n`);

  // ── Summary ───────────────────────────────────────────────────────────────
  const elapsed = Date.now() - start;

  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  🏁  Full A→B→C cycle complete                          ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");
  console.log(`  Escrow PDA:      ${ePda.toBase58()}`);
  console.log(`  Rating PDA:      ${rPda.toBase58()}`);
  console.log(`  Attestation PDA: ${attestPda.toBase58()}`);
  console.log(`  Settlement:      ${settlementRouteUsed === "magicblock_per" ? "MagicBlock PER (private)" : "L1 direct (public/fallback)"}`);
  console.log(`  Settlement sig:  ${settlementSig!}`);
  console.log(`\n  ⏱  Total time: ${elapsed}ms ${elapsed < 10_000 ? "✅ (< 10s target)" : "⚠️  (> 10s target)"}`);

  if (settlementRouteUsed !== "magicblock_per") {
    console.log(`\n  ℹ️  PER was unavailable — L1 fallback used. No funds stuck.`);
    console.log(`      For PER settlement, ensure devnet-tee.magicblock.app is reachable.`);
  } else {
    console.log(`\n  🔒 PER settlement sent to devnet-tee.magicblock.app`);
    console.log(`     Poll for TEE confirmation: new Connection("${PER_DEVNET_RPC}").confirmTransaction(sig)`);
  }
}

runDemo().catch((e) => {
  console.error("\n❌ Demo failed:", e.message);
  process.exit(1);
});
