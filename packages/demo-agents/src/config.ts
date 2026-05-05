import path from "path";
import dotenv from "dotenv";

// Load devnet env — resolve relative to package root (not transpiled __dirname)
const envPath = path.resolve(__dirname, "../.env.devnet");
dotenv.config({ path: envPath });

function pickEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

type DemoNetworkProfileName = "local-surfpool" | "devnet" | "mainnet";

type DemoNetworkProfile = {
  rpcHttp: string;
  explorerClusterParam: "custom" | "devnet" | "mainnet";
  defaultEscrowProgramId: string;
  defaultPerRpc: string;
};

const QUASAR_DEVNET_ESCROW_PROGRAM_ID = "VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW";

export type DemoProgramTarget = "legacy-anchor" | "quasar";

function resolveProgramTarget(): DemoProgramTarget {
  const raw = (pickEnv("NEXT_PUBLIC_DEMO_PROGRAM_TARGET", "HACKATHON_DEMO_TARGET", "DEMO_PROGRAM_TARGET") ?? "legacy-anchor").toLowerCase();
  return raw === "quasar" ? "quasar" : "legacy-anchor";
}

const DEMO_NETWORK_PROFILES: Record<DemoNetworkProfileName, DemoNetworkProfile> = {
  "local-surfpool": {
    rpcHttp: "http://127.0.0.1:18999",
    explorerClusterParam: "custom",
    defaultEscrowProgramId: "794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD",
    defaultPerRpc: "http://127.0.0.1:18999",
  },
  devnet: {
    rpcHttp: "https://api.devnet.solana.com",
    explorerClusterParam: "devnet",
    defaultEscrowProgramId: "794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD",
    defaultPerRpc: "https://devnet-tee.magicblock.app",
  },
  mainnet: {
    rpcHttp: "https://api.mainnet-beta.solana.com",
    explorerClusterParam: "mainnet",
    defaultEscrowProgramId: "794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD",
    defaultPerRpc: "https://mainnet-tee.magicblock.app",
  },
};

function resolveNetworkProfileName(): DemoNetworkProfileName {
  const raw = (pickEnv("NETWORK_PROFILE", "NEXT_PUBLIC_NETWORK_PROFILE") ?? "devnet").toLowerCase();
  if (raw === "local" || raw === "localnet" || raw === "surfpool") return "local-surfpool";
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet";
  return "devnet";
}

const activeNetworkProfileName = resolveNetworkProfileName();
const activeProfile = DEMO_NETWORK_PROFILES[activeNetworkProfileName];
export const PROGRAM_TARGET: DemoProgramTarget =
  activeNetworkProfileName === "devnet" && resolveProgramTarget() === "quasar" ? "quasar" : "legacy-anchor";
export const PROGRAM_FRAMEWORK = PROGRAM_TARGET === "quasar" ? "quasar" : "anchor";
export const PROGRAM_COMPATIBILITY = PROGRAM_TARGET === "quasar" ? "quasar-layout-unverified" : "anchor-layout";

/** Deployed program ID (overrideable for local Surfpool/test lanes) */
export const ESCROW_PROGRAM_ID =
  pickEnv("DEMO_ESCROW_PROGRAM_ID", "NEXT_PUBLIC_ESCROW_PROGRAM_ID") ??
  (PROGRAM_TARGET === "quasar" ? QUASAR_DEVNET_ESCROW_PROGRAM_ID : activeProfile.defaultEscrowProgramId);

/** Solana RPC (overrideable for local Surfpool/test lanes) */
export const DEVNET_RPC = pickEnv("DEMO_DEVNET_RPC", "NEXT_PUBLIC_RPC_ENDPOINT") ?? activeProfile.rpcHttp;

/** MagicBlock PER endpoint (overrideable for local Surfpool/test lanes) */
export const PER_DEVNET_RPC = pickEnv("DEMO_PER_RPC", "NEXT_PUBLIC_PER_RPC") ?? activeProfile.defaultPerRpc;

export function explorerTxUrl(signature: string): string {
  if (activeProfile.explorerClusterParam === "mainnet") {
    return `https://explorer.solana.com/tx/${signature}`;
  }
  if (activeProfile.explorerClusterParam === "devnet") {
    return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
  }
  return `https://explorer.solana.com/tx/${signature}?cluster=custom&customUrl=${encodeURIComponent(DEVNET_RPC)}`;
}

/** MagicBlock critical addresses */
export const PERMISSION_PROGRAM_ID = "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";
export const DELEGATION_PROGRAM_ID = "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
export const PER_VALIDATOR_PUBKEY = "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA";

/** PDA seeds — must match the on-chain program */
export const ESCROW_SEED = Buffer.from("escrow");
export const AGENT_SEED = Buffer.from("agent");
export const RATING_SEED = Buffer.from("rating");
export const ATTESTATION_SEED = Buffer.from("attestation");
