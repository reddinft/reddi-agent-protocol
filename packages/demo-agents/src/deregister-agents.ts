#!/usr/bin/env ts-node
/**
 * deregister-agents.ts — owner-signed cleanup for demo agents.
 *
 * Run: npm run deregister
 *
 * This executes on-chain `deregister_agent` for Agent A/B/C wallets.
 * Owner-only by program constraints (`has_one = owner` + signer).
 */
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import crypto from "crypto";
import { AGENT_A_KEYPAIR, AGENT_B_KEYPAIR, AGENT_C_KEYPAIR } from "./wallets";
import { AGENT_SEED, DEVNET_RPC, ESCROW_PROGRAM_ID, explorerTxUrl } from "./config";

const PROGRAM_ID = new PublicKey(ESCROW_PROGRAM_ID);
const connection = new Connection(DEVNET_RPC, "confirmed");

function disc(ixName: string): Buffer {
  return crypto.createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

function agentPda(owner: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([AGENT_SEED, owner.toBytes()], PROGRAM_ID)[0];
}

async function deregisterAgent(owner: Keypair, label: string) {
  const agentPk = agentPda(owner.publicKey);
  console.log(`\n🧹 Deregistering ${label}...`);
  console.log(`   Owner: ${owner.publicKey.toBase58()}`);
  console.log(`   Agent PDA: ${agentPk.toBase58()}`);

  const existing = await connection.getAccountInfo(agentPk, "confirmed");
  if (!existing) {
    console.log("   ℹ️  Agent PDA not found (already deregistered) — skipping");
    return;
  }

  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: agentPk, isSigner: false, isWritable: true },
      { pubkey: owner.publicKey, isSigner: true, isWritable: true },
    ],
    data: disc("deregister_agent"),
  });

  const { blockhash } = await connection.getLatestBlockhash();
  const tx = new Transaction();
  tx.recentBlockhash = blockhash;
  tx.feePayer = owner.publicKey;
  tx.add(ix);
  tx.sign(owner);

  const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
  await connection.confirmTransaction(sig, "confirmed");
  console.log(`   ✅ Deregistered! sig: ${sig}`);
  console.log(`   🔍 Explorer: ${explorerTxUrl(sig)}`);
}

async function main() {
  console.log("🚀 Deregistering demo agents...\n");
  console.log(`Program: ${ESCROW_PROGRAM_ID}`);

  await deregisterAgent(AGENT_A_KEYPAIR, "Agent A (Orchestrator)");
  await deregisterAgent(AGENT_B_KEYPAIR, "Agent B (Primary Specialist)");
  await deregisterAgent(AGENT_C_KEYPAIR, "Agent C (Attestation Judge)");

  console.log("\n✅ Deregistration complete.");
}

main().catch(console.error);
