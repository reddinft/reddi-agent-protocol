import { parseX402Header, sendPayment, isValidPaymentAddress } from './payment';
import { checkAndStoreNonce } from './nonce';
import { X402Request, PaymentReceipt } from './types';
import { SwapClient } from './jupiter';

type ReqLike = {
  headers: Record<string, string | undefined>;
};

type ResLike = {
  status: (code: number) => ResLike;
  json: (payload: unknown) => unknown;
  setHeader: (name: string, value: string) => void;
};

type NextLike = () => unknown;

export interface X402MiddlewareOptions {
  swapClient?: SwapClient;
  slippageBps?: number;
}

/**
 * Express middleware for x402 payment processing
 * Intercepts requests with x402-request header, validates, and sends payment
 */
export function createX402Middleware(options: X402MiddlewareOptions = {}) {
  return async (req: ReqLike, res: ResLike, next: NextLike) => {
    // Check for x402-request header
    const header = req.headers['x402-request'] as string | undefined;
    if (!header) {
      return next(); // Not an x402 payment request, continue
    }

    try {
      // Parse the header
      const x402req: X402Request = parseX402Header(header);

      // Validate payment address format
      if (!isValidPaymentAddress(x402req.paymentAddress)) {
        return res.status(400).json({
          error: 'invalid_request',
          detail: 'paymentAddress format invalid',
        });
      }

      // Check for replay attack (duplicate nonce)
      if (!checkAndStoreNonce(x402req.nonce)) {
        return res.status(409).json({
          error: 'duplicate_nonce',
          detail: 'This nonce has already been used',
        });
      }

      // Send the payment (Phase 2 will implement actual Solana transfer)
      const receipt: PaymentReceipt = await sendPayment(x402req, {
        swapClient: options.swapClient,
        slippageBps: options.slippageBps,
      });

      // Set response headers
      res.setHeader('x402-payment', JSON.stringify(receipt));
      res.status(200).json({
        message: 'payment_processed',
        receipt,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'invalid_request';

      // Handle different error types
      if (message.includes('JSON')) {
        return res.status(400).json({
          error: 'invalid_request',
          detail: message,
        });
      }
      if (message.includes('timeout')) {
        return res.status(503).json({
          error: 'rpc_timeout',
          detail: 'Payment confirmation timeout',
        });
      }
      if (message.includes('token_mismatch_requires_swap_client')) {
        return res.status(400).json({
          error: 'invalid_request',
          detail: 'Token mismatch detected but no Jupiter swap client configured',
        });
      }

      // Generic error
      return res.status(400).json({
        error: 'invalid_request',
        detail: message,
      });
    }
  };
}

/**
 * Helper: Create x402-request header from components
 */
export function createX402Header(
  amount: number,
  paymentAddress: string,
  nonce: string,
  currency = 'SOL',
  extras?: Partial<Pick<X402Request, 'payerCurrency' | 'payerAddress' | 'autoSwap'>>
): string {
  return JSON.stringify({ amount, currency, paymentAddress, nonce, ...extras });
}
