import { X402Request, PaymentReceipt } from './types';
import { needsAutoSwap, resolveMint, SwapClient } from './jupiter';

export interface SendPaymentOptions {
  swapClient?: SwapClient;
  slippageBps?: number;
}

/**
 * Parse x402-request header into structured request
 * Expected format: JSON string with amount, currency, paymentAddress, nonce
 * @throws Error if header is invalid
 */
export function parseX402Header(header: string): X402Request {
  try {
    const parsed = JSON.parse(header);
    
    // Validate required fields
    if (typeof parsed.amount !== 'number' || parsed.amount <= 0) {
      throw new Error('amount must be a positive number');
    }
    if (!parsed.currency || typeof parsed.currency !== 'string') {
      throw new Error('currency is required (e.g., "SOL")');
    }
    if (!parsed.paymentAddress || typeof parsed.paymentAddress !== 'string') {
      throw new Error('paymentAddress is required');
    }
    if (!parsed.nonce || typeof parsed.nonce !== 'string') {
      throw new Error('nonce is required');
    }

    return {
      amount: parsed.amount,
      currency: parsed.currency,
      paymentAddress: parsed.paymentAddress,
      nonce: parsed.nonce,
      payerCurrency: typeof parsed.payerCurrency === 'string' ? parsed.payerCurrency : undefined,
      payerAddress: typeof parsed.payerAddress === 'string' ? parsed.payerAddress : undefined,
      autoSwap: typeof parsed.autoSwap === 'boolean' ? parsed.autoSwap : false,
    };
  } catch (error: unknown) {
    if (error instanceof SyntaxError) {
      throw new Error('x402-request header is not valid JSON');
    }
    throw error;
  }
}

/**
 * Send a payment via Solana SystemProgram.transfer
 * In Phase 1, this is a stub. Full implementation in Phase 2.
 * @param request The payment request
 * @returns Promise resolving to payment receipt
 */
export async function sendPayment(
  request: X402Request,
  options: SendPaymentOptions = {}
): Promise<PaymentReceipt> {
  // Phase 2 implementation will:
  // - Create a Solana connection
  // - Load payer keypair
  // - Create SystemProgram.transfer instruction
  // - Send and confirm transaction with 5s timeout
  // - Return receipt with txSignature, slot, etc.

  let swapMeta: PaymentReceipt['swap'];

  if (needsAutoSwap(request)) {
    if (!options.swapClient) {
      throw new Error('token_mismatch_requires_swap_client');
    }

    const payerAddress = request.payerAddress;
    if (!payerAddress) {
      throw new Error('payerAddress is required when autoSwap=true');
    }

    const swapResult = await options.swapClient.swap({
      inputMint: resolveMint(request.payerCurrency || request.currency),
      outputMint: resolveMint(request.currency),
      amount: String(request.amount),
      userPublicKey: payerAddress,
      slippageBps: options.slippageBps ?? 50,
    });

    swapMeta = {
      performed: true,
      fromCurrency: request.payerCurrency,
      toCurrency: request.currency,
      orderId: swapResult.orderId,
      executeId: swapResult.executeId,
      inAmount: swapResult.inAmount,
      outAmount: swapResult.outAmount,
    };
  } else {
    swapMeta = {
      performed: false,
      fromCurrency: request.payerCurrency || request.currency,
      toCurrency: request.currency,
    };
  }

  // For now, return a mock receipt for testing
  return {
    txSignature: 'mock_tx_signature_' + Math.random().toString(36).substring(7),
    slot: Math.floor(Math.random() * 1000000),
    lamports: request.amount,
    nonce: request.nonce,
    settlementCurrency: request.currency,
    swap: swapMeta,
  };
}

/**
 * Validate payment address format (basic check)
 * Real validation would use @solana/web3.js PublicKey
 */
export function isValidPaymentAddress(address: string): boolean {
  return address.length >= 32 && address.length <= 44; // Base58 Solana addresses
}
