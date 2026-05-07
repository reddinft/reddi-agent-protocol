export type BridgeConfig = {
  rapBaseUrl: string;
  policyMode: "dry_run" | "devnet";
  hostFramework: "claude" | "cursor" | "openclaw" | "openswarm" | "codex" | "custom";
  agentName?: string;
  storeDir: string;
  devnetProofApproved: boolean;
  devnetFunderKeypairPath?: string;
  devnetRpcUrl: string;
  devnetMaxTotalDebitLamports?: number;
};

const FRAMEWORKS = new Set(["claude", "cursor", "openclaw", "openswarm", "codex", "custom"]);
const LOCAL_BACKEND_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function sanitizeSmallText(value: string | undefined, max = 128): string | undefined {
  if (!value) return undefined;
  const clean = value.normalize("NFC").replace(/[^\p{L}\p{N} ._:@/-]/gu, "").trim().slice(0, max);
  return clean || undefined;
}

export function assertLocalRapBaseUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("invalid_rap_base_url");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("unsupported_rap_base_url_protocol");
  }
  if (!LOCAL_BACKEND_HOSTS.has(parsed.hostname)) {
    throw new Error(`unsupported_rap_base_url_host:${parsed.hostname}`);
  }
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}


export function assertDevnetRpcUrl(rawUrl: string): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("invalid_devnet_rpc_url");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("unsupported_devnet_rpc_url_protocol");
  }
  if (parsed.hostname.includes("mainnet")) {
    throw new Error("mainnet_rpc_url_forbidden");
  }
  if (parsed.hostname !== "api.devnet.solana.com" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "::1") {
    throw new Error(`unsupported_devnet_rpc_url_host:${parsed.hostname}`);
  }
  parsed.hash = "";
  parsed.search = "";
  return parsed.toString().replace(/\/$/, "");
}

function parsePositiveSafeInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error("invalid_positive_integer_env");
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): BridgeConfig {
  const policyMode = env.REDDI_RAP_MCP_MODE ?? env.REDDI_MCP_POLICY_MODE ?? "dry_run";
  if (policyMode !== "dry_run" && policyMode !== "devnet") {
    throw new Error(`unsupported_policy_mode:${policyMode}`);
  }
  const framework = env.REDDI_MCP_HOST_FRAMEWORK ?? "custom";
  const hostFramework = FRAMEWORKS.has(framework) ? framework as BridgeConfig["hostFramework"] : "custom";
  const home = env.HOME || env.USERPROFILE || process.cwd();
  return {
    rapBaseUrl: assertLocalRapBaseUrl(env.REDDI_RAP_BASE_URL ?? "http://localhost:3000"),
    policyMode,
    hostFramework,
    agentName: sanitizeSmallText(env.REDDI_MCP_AGENT_NAME),
    storeDir: env.REDDI_MCP_STORE_DIR ?? `${home}/.reddi/rap-mcp-bridge`,
    devnetProofApproved: env.RAP_MCP_DEVNET_PROOF_APPROVED === "1",
    devnetFunderKeypairPath: sanitizeSmallText(env.RAP_MCP_DEVNET_FUNDER_KEYPAIR, 512),
    devnetRpcUrl: assertDevnetRpcUrl(env.RAP_MCP_DEVNET_RPC_URL ?? "https://api.devnet.solana.com"),
    devnetMaxTotalDebitLamports: parsePositiveSafeInteger(env.RAP_MCP_DEVNET_MAX_TOTAL_DEBIT_LAMPORTS, 3_200_000),
  };
}
