import { JupiterSwapV2Client } from "@reddi/x402-solana";

let client: JupiterSwapV2Client | null = null;

export function getJupiterClient(): JupiterSwapV2Client | null {
  if (!process.env.JUPITER_API_KEY?.trim()) {
    return null;
  }

  if (client) {
    return client;
  }

  const apiBaseUrl = process.env.JUPITER_API_BASE?.trim() || "https://api.jup.ag/swap/v2";
  client = new JupiterSwapV2Client({ apiBaseUrl });
  return client;
}

export function getJupiterSlippageBps(): number {
  const parsed = Number.parseInt(process.env.JUPITER_SLIPPAGE_BPS ?? "50", 10);
  return Number.isFinite(parsed) ? parsed : 50;
}
