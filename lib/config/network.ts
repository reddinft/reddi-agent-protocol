import devnetProfile from "@/config/networks/devnet.json";
import localSurfpoolProfile from "@/config/networks/local-surfpool.json";
import mainnetProfile from "@/config/networks/mainnet.json";

export type NetworkProfileName = "local-surfpool" | "devnet" | "mainnet";

export type NetworkProfile = {
  name: NetworkProfileName;
  solana: {
    cluster: "localnet" | "devnet" | "mainnet-beta";
    rpcHttp: string;
    rpcWs?: string;
    explorerClusterParam: "custom" | "devnet" | "mainnet";
  };
  programs: {
    escrowProgramId: string;
  };
  payments: {
    jupiterApiBase: string;
    perRpc: string;
    paymentsApiBase: string;
  };
  features: {
    allowPerFallback: boolean;
    requireMintReadiness: boolean;
  };
};

const PROFILES: Record<NetworkProfileName, NetworkProfile> = {
  "local-surfpool": localSurfpoolProfile as NetworkProfile,
  devnet: devnetProfile as NetworkProfile,
  mainnet: mainnetProfile as NetworkProfile,
};

function pickEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveNetworkProfileName(): NetworkProfileName {
  const raw = (
    pickEnv("NETWORK_PROFILE", "NEXT_PUBLIC_NETWORK_PROFILE") ?? "devnet"
  ).toLowerCase();

  if (raw === "local" || raw === "localnet" || raw === "surfpool") return "local-surfpool";
  if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet";
  return "devnet";
}

export function getNetworkProfile(): NetworkProfile {
  const name = resolveNetworkProfileName();
  const base = PROFILES[name];

  const rpcOverride = pickEnv("NEXT_PUBLIC_RPC_ENDPOINT", "NEXT_PUBLIC_RPC_URL", "DEMO_DEVNET_RPC");
  const escrowOverride = pickEnv("NEXT_PUBLIC_ESCROW_PROGRAM_ID", "DEMO_ESCROW_PROGRAM_ID");
  const allowUnsafeDevnetOverride = pickEnv("ALLOW_UNSAFE_ESCROW_OVERRIDE") === "true";

  const effectiveEscrowProgramId =
    name === "devnet" &&
    escrowOverride &&
    escrowOverride !== base.programs.escrowProgramId &&
    !allowUnsafeDevnetOverride
      ? base.programs.escrowProgramId
      : escrowOverride ?? base.programs.escrowProgramId;

  return {
    ...base,
    solana: {
      ...base.solana,
      rpcHttp: rpcOverride ?? base.solana.rpcHttp,
      rpcWs: pickEnv("NEXT_PUBLIC_RPC_WS_ENDPOINT") ?? base.solana.rpcWs,
    },
    programs: {
      ...base.programs,
      escrowProgramId: effectiveEscrowProgramId,
    },
    payments: {
      ...base.payments,
      jupiterApiBase: pickEnv("JUPITER_API_BASE") ?? base.payments.jupiterApiBase,
      perRpc: pickEnv("NEXT_PUBLIC_PER_RPC", "DEMO_PER_RPC") ?? base.payments.perRpc,
      paymentsApiBase: pickEnv("DEMO_PAYMENTS_API_BASE_URL") ?? base.payments.paymentsApiBase,
    },
    features: {
      ...base.features,
      allowPerFallback:
        pickEnv("DEMO_ALLOW_FALLBACK") === undefined
          ? base.features.allowPerFallback
          : pickEnv("DEMO_ALLOW_FALLBACK") === "true",
      requireMintReadiness:
        pickEnv("DEMO_REQUIRE_MINT_READY") === undefined
          ? base.features.requireMintReadiness
          : pickEnv("DEMO_REQUIRE_MINT_READY") === "true",
    },
  };
}
