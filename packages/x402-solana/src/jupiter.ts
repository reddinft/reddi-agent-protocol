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
  quoteApiBaseUrl?: string;
  apiKey?: string;
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

  private quoteApiBaseUrl: string;

  private apiKey?: string;

  private fetchImpl: typeof fetch;

  constructor(options: JupiterSwapClientOptions = {}) {
    this.apiBaseUrl = options.apiBaseUrl || 'https://api.jup.ag/swap/v2';
    this.quoteApiBaseUrl = options.quoteApiBaseUrl || 'https://lite-api.jup.ag/swap/v1';
    this.apiKey = options.apiKey || process.env.JUPITER_API_KEY?.trim();
    this.fetchImpl = options.fetchImpl || fetch;
  }

  private buildHeaders() {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }
    return headers;
  }

  private async swapViaOrderExecute(request: JupiterSwapRequest): Promise<JupiterSwapResult> {
    const orderRes = await this.fetchImpl(`${this.apiBaseUrl}/order`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        inputMint: request.inputMint,
        outputMint: request.outputMint,
        amount: request.amount,
        taker: request.userPublicKey,
        slippageBps: request.slippageBps ?? 50,
      }),
    });

    if (orderRes.status === 404) {
      throw new Error('Jupiter order failed (404)');
    }
    if (!orderRes.ok) {
      throw new Error(`Jupiter order failed (${orderRes.status})`);
    }

    const orderJson = (await orderRes.json()) as {
      requestId?: string;
      orderId?: string;
      id?: string;
      inAmount?: string;
      outAmount?: string;
      transaction?: string;
      tx?: string;
    };

    const orderId = orderJson.requestId || orderJson.orderId || orderJson.id;
    if (!orderId) {
      throw new Error('Jupiter order response missing request id');
    }

    const executeTx = orderJson.transaction || orderJson.tx;
    if (!executeTx) {
      return {
        orderId,
        executeId: `exec_pending_${Date.now().toString(36)}`,
        inAmount: orderJson.inAmount || request.amount,
        outAmount: orderJson.outAmount || '0',
      };
    }

    const executeRes = await this.fetchImpl(`${this.apiBaseUrl}/execute`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        requestId: orderId,
        signedTransaction: executeTx,
      }),
    });

    if (!executeRes.ok) {
      throw new Error(`Jupiter execute failed (${executeRes.status})`);
    }

    const executeJson = (await executeRes.json()) as {
      requestId?: string;
      executeId?: string;
      id?: string;
      outputAmountResult?: string;
      outAmount?: string;
    };

    return {
      orderId,
      executeId:
        executeJson.executeId || executeJson.requestId || executeJson.id || `exec_${Date.now().toString(36)}`,
      inAmount: orderJson.inAmount || request.amount,
      outAmount: executeJson.outputAmountResult || executeJson.outAmount || orderJson.outAmount || '0',
    };
  }

  private async swapViaQuote(request: JupiterSwapRequest): Promise<JupiterSwapResult> {
    const query = new URLSearchParams({
      inputMint: request.inputMint,
      outputMint: request.outputMint,
      amount: request.amount,
      slippageBps: String(request.slippageBps ?? 50),
    });

    const quoteRes = await this.fetchImpl(`${this.quoteApiBaseUrl}/quote?${query.toString()}`, {
      method: 'GET',
      headers: this.apiKey ? { 'x-api-key': this.apiKey } : undefined,
    });

    if (!quoteRes.ok) {
      throw new Error(`Jupiter quote failed (${quoteRes.status})`);
    }

    const quoteJson = (await quoteRes.json()) as {
      inAmount?: string;
      outAmount?: string;
      contextSlot?: number;
      routePlan?: unknown[];
      priceImpactPct?: string;
    };

    return {
      orderId: `quote_${Date.now().toString(36)}_${quoteJson.contextSlot ?? 'na'}`,
      executeId: `quote_only_${Array.isArray(quoteJson.routePlan) ? quoteJson.routePlan.length : 0}`,
      inAmount: quoteJson.inAmount || request.amount,
      outAmount: quoteJson.outAmount || '0',
    };
  }

  async swap(request: JupiterSwapRequest): Promise<JupiterSwapResult> {
    try {
      return await this.swapViaOrderExecute(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('404') && !message.includes('fetch failed')) {
        throw error;
      }
      return this.swapViaQuote(request);
    }
  }
}

export function needsAutoSwap(request: X402Request): boolean {
  const payerCurrency = (request.payerCurrency || request.currency).toUpperCase();
  const settlementCurrency = request.currency.toUpperCase();
  return Boolean(request.autoSwap && payerCurrency !== settlementCurrency);
}
