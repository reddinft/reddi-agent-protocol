#!/usr/bin/env ts-node
/**
 * register-agents.ts — Register Agent B (Primary) and Agent C (Attestation) on devnet.
 *
 * Run: npm run register
 *
 * Idempotent: will log a warning if an agent is already registered (Anchor
 * returns AlreadyInUse) and continue.
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
import { AGENT_B_KEYPAIR, AGENT_C_KEYPAIR } from "./wallets";
import { AGENT_SEED, DEVNET_RPC, ESCROW_PROGRAM_ID } from "./config";

const PROGRAM_ID = new PublicKey(ESCROW_PROGRAM_ID);
const connection = new Connection(DEVNET_RPC, "confirmed");

// IDL-derived discriminator
function disc(ixName: string): Buffer {
  return crypto.createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

// Hardcoded incinerator (matches on-chain AGENT_FEE_BURN_ADDRESS)
const INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");

function agentPda(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([AGENT_SEED, owner.toBytes()], PROGRAM_ID)[0];
}

/** AgentType enum variants (Anchor borsh encoding) */
const AgentType = { Primary: 0, Attestation: 1, Both: 2 };

function encodeRegisterAgent(agentType: number, model: string, rateLamports: bigint, minReputation: number): Buffer {
  // Discriminator (8) + agentType enum (1) + model string (4 len + bytes) + rate (8) + minRep (1)
  const modelBytes = Buffer.from(model, "utf8");
  const buf = Buffer.alloc(8 + 1 + 4 + modelBytes.length + 8 + 1);
  let offset = 0;
  disc("register_agent").copy(buf, offset); offset += 8;
  buf.writeUInt8(agentType, offset); offset += 1;
  buf.writeUInt32LE(modelBytes.length, offset); offset += 4;
  modelBytes.copy(buf, offset); offset += modelBytes.length;
  buf.writeBigUInt64LE(rateLamports, offset); offset += 8;
  buf.writeUInt8(minReputation, offset);
  return buf;
}

async function registerAgent(
  owner: Keypair,
  agentType: number,
  model: string,
  rateLamports: bigint,
  minReputation: number,
  label: string,
) {
  const agentPk = agentPda(owner.publicKey);
  console.log(`\n📝 Registering ${label}...`);
  console.log(`   Owner: ${owner.publicKey.toBase58()}`);
  console.log(`   Agent PDA: ${agentPk.toBase58()}`);
  console.log(`   Type: ${Object.keys(AgentType)[agentType]}, Model: ${model}, Rate: ${rateLamports} lamports`);

  const data = encodeRegisterAgent(agentType, model, rateLamports, minReputation);

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: agentPk, isSigner: false, isWritable: true },
      { pubkey: owner.publicKey, isSigner: true, isWritable: true },
      { pubkey: INCINERATOR, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner.publicKey;
  tx.add(ix);
  tx.sign(owner);

  try {
    const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
    await connection.confirmTransaction(sig, "confirmed");
    console.log(`   ✅ Registered! sig: ${sig}`);
    console.log(`   🔍 Explorer: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  } catch (e: any) {
    if (e.message?.includes("already in use") || e.message?.includes("AlreadyInUse") || e.message?.includes("0x0")) {
      console.log(`   ℹ️  Already registered — skipping`);
    } else {
      throw e;
    }
  }
}

async function main() {
  console.log("🚀 Registering agents on devnet...\n");
  console.log(`Program: ${ESCROW_PROGRAM_ID}`);

  // Agent B — Specialist (Primary)
  await registerAgent(
    AGENT_B_KEYPAIR,
    AgentType.Primary,
    "qwen3:8b",
    1_000_000n, // 0.001 SOL per call
    0,
    "Agent B (Primary Specialist)",
  );

  // Agent C — Judge (Attestation)
  await registerAgent(
    AGENT_C_KEYPAIR,
    AgentType.Attestation,
    "claude-haiku",
    500_000n, // 0.0005 SOL per attestation
    0,
    "Agent C (Attestation Judge)",
  );

  console.log("\n✅ Registration complete.");
}

main().catch(console.error);
