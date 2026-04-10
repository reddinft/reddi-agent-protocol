import "./config"; // ensure dotenv is loaded before reading process.env
import { Keypair } from "@solana/web3.js";

function loadKeypair(envVar: string): Keypair {
  const raw = process.env[envVar];
  if (!raw) throw new Error(`${envVar} not set in .env.devnet`);
  const bytes = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}

/** Agent A — Orchestrator: queries registry, locks escrow, pays */
export const AGENT_A_KEYPAIR = loadKeypair("AGENT_A_KEYPAIR");
/** Agent B — Specialist (Primary): registered on-chain, delivers work */
export const AGENT_B_KEYPAIR = loadKeypair("AGENT_B_KEYPAIR");
/** Agent C — Judge (Attestation): scores Agent B's work */
export const AGENT_C_KEYPAIR = loadKeypair("AGENT_C_KEYPAIR");

export const AGENT_A = AGENT_A_KEYPAIR.publicKey;
export const AGENT_B = AGENT_B_KEYPAIR.publicKey;
export const AGENT_C = AGENT_C_KEYPAIR.publicKey;
