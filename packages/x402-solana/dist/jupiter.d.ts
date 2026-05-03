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
export declare function resolveMint(symbolOrMint: string): string;
export declare class JupiterSwapV2Client implements SwapClient {
    private apiBaseUrl;
    private quoteApiBaseUrl;
    private apiKey?;
    private fetchImpl;
    constructor(options?: JupiterSwapClientOptions);
    private buildHeaders;
    private swapViaOrderExecute;
    private swapViaQuote;
    swap(request: JupiterSwapRequest): Promise<JupiterSwapResult>;
}
export declare function needsAutoSwap(request: X402Request): boolean;
