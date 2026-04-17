import { X402Request } from './types';

export interface JupiterSwapRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  userPublicKey: string;
  slippageBps?: number;
}

export interface JupiterSwapResult {
  orderId: string;
  executeId: string;
  inAmount: string;
  outAmount: string;
}

export interface SwapClient {
  swap(request: JupiterSwapRequest): Promise<JupiterSwapResult>;
}

export interface JupiterSwapClientOptions {
  apiBaseUrl?: string;
  fetchImpl?: typeof fetch;
}

const SYMBOL_TO_MINT: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

export function resolveMint(symbolOrMint: string): string {
  const normalized = symbolOrMint.trim();
  const upper = normalized.toUpperCase();
  return SYMBOL_TO_MINT[upper] || normalized;
}

export class JupiterSwapV2Client implements SwapClient {
  private apiBaseUrl: string;

  private fetchImpl: typeof fetch;

  constructor(options: JupiterSwapClientOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl || 'https://quote-api.jup.ag/v2';
    this.fetchImpl = options.fetchImpl || fetch;
  }

  async swap(request: JupiterSwapRequest): Promise<JupiterSwapResult> {
    const orderRes = await this.fetchImpl(`${this.apiBaseUrl}/order`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!orderRes.ok) {
      throw new Error(`Jupiter order failed (${orderRes.status})`);
    }

    const orderJson = (await orderRes.json()) as {
      orderId?: string;
      id?: string;
      inAmount?: string;
      outAmount?: string;
    };

    const orderId = orderJson.orderId || orderJson.id;
    if (!orderId) {
      throw new Error('Jupiter order response missing order id');
    }

    const executeRes = await this.fetchImpl(`${this.apiBaseUrl}/execute`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    if (!executeRes.ok) {
      throw new Error(`Jupiter execute failed (${executeRes.status})`);
    }

    const executeJson = (await executeRes.json()) as {
      executeId?: string;
      id?: string;
      outAmount?: string;
    };

    return {
      orderId,
      executeId: executeJson.executeId || executeJson.id || `exec_${Date.now().toString(36)}`,
      inAmount: orderJson.inAmount || request.amount,
      outAmount: executeJson.outAmount || orderJson.outAmount || '0',
    };
  }
}

export function needsAutoSwap(request: X402Request): boolean {
  const payerCurrency = (request.payerCurrency || request.currency).toUpperCase();
  const settlementCurrency = request.currency.toUpperCase();
  return Boolean(request.autoSwap && payerCurrency !== settlementCurrency);
}
