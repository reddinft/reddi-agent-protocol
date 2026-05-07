export type UmbraNetwork = "mainnet" | "devnet" | "localnet";

export type UmbraNetworkConfig = {
  network: UmbraNetwork;
  programId: string;
  indexerApiEndpoint?: string;
  relayerApiEndpoint?: string;
  claimBoundary: string;
};

export const UMBRA_NETWORKS: Record<"mainnet" | "devnet", UmbraNetworkConfig> = {
  mainnet: {
    network: "mainnet",
    programId: "UMBRAD2ishebJTcgCLkTkNUx1v3GyoAgpTRPeWoLykh",
    indexerApiEndpoint: "https://utxo-indexer.api.umbraprivacy.com",
    relayerApiEndpoint: "https://relayer.api.umbraprivacy.com",
    claimBoundary: "Umbra mainnet private settlement requires explicit live-spend approval before use.",
  },
  devnet: {
    network: "devnet",
    programId: "DSuKkyqGVGgo4QtPABfxKJKygUDACbUhirnuv63mEpAJ",
    indexerApiEndpoint: "https://utxo-indexer.api-devnet.umbraprivacy.com",
    relayerApiEndpoint: "https://relayer.api-devnet.umbraprivacy.com",
    claimBoundary: "Umbra devnet smoke is approval-gated and does not prove mainnet private settlement.",
  },
};

export const UMBRA_PRIVATE_X402_BOUNDARY =
  "Umbra is an SDK-level private x402 settlement adapter lane, not Quasar-native program execution.";
