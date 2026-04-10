import path from "path";
import dotenv from "dotenv";

// Load devnet env — resolve relative to package root (not transpiled __dirname)
const envPath = path.resolve(__dirname, "../.env.devnet");
dotenv.config({ path: envPath });

/** Deployed program ID on devnet */
export const ESCROW_PROGRAM_ID = "77rkRQxe4GRzHU56H6JuWPFe27g4NoRBz4GGftuUZXmX";

/** Solana devnet RPC */
export const DEVNET_RPC = "https://api.devnet.solana.com";

/** MagicBlock PER devnet TEE endpoint */
export const PER_DEVNET_RPC = "https://devnet-tee.magicblock.app";

/** MagicBlock critical addresses */
export const PERMISSION_PROGRAM_ID = "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";
export const DELEGATION_PROGRAM_ID = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
export const PER_VALIDATOR_PUBKEY = "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA";

/** PDA seeds — must match the on-chain program */
export const ESCROW_SEED = Buffer.from("escrow");
export const AGENT_SEED = Buffer.from("agent");
export const RATING_SEED = Buffer.from("rating");
export const ATTESTATION_SEED = Buffer.from("attestation");
