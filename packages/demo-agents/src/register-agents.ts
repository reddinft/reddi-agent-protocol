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
  Transaction,
} from "@solana/web3.js";
import { AGENT_A_KEYPAIR, AGENT_B_KEYPAIR, AGENT_C_KEYPAIR } from "./wallets";
import { DEVNET_RPC, ESCROW_PROGRAM_ID, PROGRAM_TARGET, explorerTxUrl } from "./config";
import { buildDemoRegisterAgentInstruction, demoAgentPda } from "./registration-instruction";

const PROGRAM_ID = new PublicKey(ESCROW_PROGRAM_ID);
const connection = new Connection(DEVNET_RPC, "confirmed");

/** AgentType enum variants (Anchor borsh encoding in legacy mode; one-byte numeric in Quasar mode) */
const AgentType = { Primary: 0, Attestation: 1, Both: 2 };

async function registerAgent(
  owner: Keypair,
  agentType: number,
  model: string,
  rateLamports: bigint,
  minReputation: number,
  label: string,
) {
  const agentPk = demoAgentPda(owner.publicKey, PROGRAM_ID);
  console.log(`\n📝 Registering ${label}...`);
  console.log(`   Owner: ${owner.publicKey.toBase58()}`);
  console.log(`   Agent PDA: ${agentPk.toBase58()}`);
  console.log(`   Type: ${Object.keys(AgentType)[agentType]}, Model: ${model}, Rate: ${rateLamports} lamports`);

  const ix = buildDemoRegisterAgentInstruction({
    target: PROGRAM_TARGET,
    programId: PROGRAM_ID,
    owner: owner.publicKey,
    agentType,
    model,
    rateLamports,
    minReputation,
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
    console.log(`   🔍 Explorer: ${explorerTxUrl(sig)}`);
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
  console.log(`Target: ${PROGRAM_TARGET}`);

  // Agent A — Orchestrator (Primary)
  await registerAgent(
    AGENT_A_KEYPAIR,
    AgentType.Primary,
    "reddi-orchestrator",
    0n,
    0,
    "Agent A (Orchestrator)",
  );

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
