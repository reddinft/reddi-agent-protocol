import nacl from "tweetnacl";
import { Keypair } from "@solana/web3.js";
import { loadKeypairFromEnv } from "./wallet";

export interface VanishCoreConfig {
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
}

export interface VanishTradeInput {
  userAddress: string;
  sourceTokenAddress: string;
  targetTokenAddress: string;
  amount: string;
  swapTransaction: string;
  loanSol?: string;
  jitoTip?: string;
  timestampMs: string;
  userSignature: string;
}

export class VanishCoreClient {
  constructor(private readonly cfg: VanishCoreConfig) {}

  static fromEnv(): VanishCoreClient {
    const enabled = String(process.env.X402_ENABLE_VANISH_PRIVATE_SWAP ?? "false").toLowerCase() === "true";
    const apiKey = process.env.VANISH_API_KEY ?? "";
    const baseUrl = process.env.VANISH_BASE_URL ?? "https://core-api.vanish.trade";

    if (!enabled) throw new Error("Vanish disabled (set X402_ENABLE_VANISH_PRIVATE_SWAP=true)");
    if (!apiKey) throw new Error("VANISH_API_KEY env var not set");

    return new VanishCoreClient({ baseUrl, apiKey, enabled });
  }

  async getOneTimeWallet(): Promise<{ address: string }> {
    return this.request(`/trade/one-time-wallet`);
  }

  async createTrade(input: VanishTradeInput): Promise<{ tx_id: string; status?: string }> {
    return this.request(`/trade/create`, {
      method: "POST",
      body: JSON.stringify({
        user_address: input.userAddress,
        source_token_address: input.sourceTokenAddress,
        target_token_address: input.targetTokenAddress,
        amount: input.amount,
        loan_sol: input.loanSol ?? "0",
        timestamp_ms: input.timestampMs,
        jito_tip: input.jitoTip ?? "0",
        swap_transaction: input.swapTransaction,
        user_signature: input.userSignature,
      }),
    });
  }

  async commit(txId: string): Promise<{ tx_id: string; status?: string }> {
    return this.request(`/commit`, {
      method: "POST",
      body: JSON.stringify({ tx_id: txId }),
    });
  }

  private async request(path: string, init?: { method?: string; body?: string }): Promise<any> {
    const fetchFn = (globalThis as any).fetch;
    if (!fetchFn) {
      throw new Error("fetch is unavailable in this runtime");
    }

    const res = await fetchFn(`${this.cfg.baseUrl}${path}`, {
      method: init?.method ?? "GET",
      headers: {
        "x-api-key": this.cfg.apiKey,
        "content-type": "application/json",
      },
      body: init?.body,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Vanish API ${res.status}: ${text}`);
    }

    return res.json();
  }
}

export function buildVanishTradeDetails(params: {
  sourceTokenAddress: string;
  targetTokenAddress: string;
  amount: string;
  loanSol: string;
  timestampMs: string;
  jitoTip: string;
}): string {
  return `trade:${params.sourceTokenAddress}:${params.targetTokenAddress}:${params.amount}:${params.loanSol}:${params.timestampMs}:${params.jitoTip}`;
}

export function signVanishDetails(details: string): string {
  const signer = loadVanishSigner();
  const msg = Buffer.from(details, "utf8");
  const sig = nacl.sign.detached(msg, signer.secretKey);
  return Buffer.from(sig).toString("base64");
}

function loadVanishSigner(): Keypair {
  const raw = process.env.VANISH_SIGNER_SECRET_KEY;
  if (raw) {
    let bytes: number[];
    try {
      bytes = JSON.parse(raw);
    } catch {
      throw new Error("VANISH_SIGNER_SECRET_KEY must be a JSON array of bytes");
    }
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  }

  return loadKeypairFromEnv();
}
