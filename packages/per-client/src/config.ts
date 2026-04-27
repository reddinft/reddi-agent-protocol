/**
 * MagicBlock PER network configuration.
 *
 * TEE validator endpoint: transactions sent here are executed privately
 * inside Intel TDX and remain hidden from the public mempool while in-flight.
 * The TEE then undelegates accounts and finalises on Solana mainnet.
 */

function pickEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function defaultPerRpcByProfile(): string {
  const profile = (pickEnv("NETWORK_PROFILE", "NEXT_PUBLIC_NETWORK_PROFILE") ?? "devnet").toLowerCase();
  if (profile === "mainnet" || profile === "mainnet-beta") return "https://mainnet-tee.magicblock.app";
  if (profile === "local" || profile === "localnet" || profile === "surfpool" || profile === "local-surfpool") {
    return "http://127.0.0.1:18999";
  }
  return "https://devnet-tee.magicblock.app";
}

/** Active TEE validator RPC endpoint */
export const PER_DEVNET_RPC = pickEnv("NEXT_PUBLIC_PER_RPC", "DEMO_PER_RPC") ?? defaultPerRpcByProfile();

/** Devnet TEE validator pubkey (for identity verification) */
export const PER_DEVNET_VALIDATOR_PUBKEY =
  "FnE6VJT5QNZdedZPnCoLsARgBwoE6DeJNjBs2H1gySXA";

/** MagicBlock Permission Program address */
export const PERMISSION_PROGRAM_ID =
  "ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1";

/** MagicBlock Delegation Program address */
export const DELEGATION_PROGRAM_ID =
  "DELeGGvXpWV2fqJUhqcF5ZSYMS4JTLjteaAMARRSaeSh";
