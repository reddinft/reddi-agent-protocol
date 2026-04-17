/**
 * x402 payment request parsed from HTTP header
 */
export interface X402Request {
  amount: number;        // lamports
  currency: string;      // "SOL"
  paymentAddress: string; // base58 Solana address
  nonce: string;         // UUID or random string for replay protection
  payerCurrency?: string; // Currency currently held by payer (e.g., "SOL")
  payerAddress?: string;  // Payer wallet used for swap/order execution
  autoSwap?: boolean;     // If true, perform swap when payerCurrency != currency
}

/**
 * Payment receipt after successful SOL transfer
 */
export interface PaymentReceipt {
  txSignature: string;   // Solana transaction signature
  slot: number;          // Solana slot when confirmed
  lamports: number;      // Amount transferred (should match request)
  nonce: string;         // Echo back for correlation
  settlementCurrency?: string;
  swap?: {
    performed: boolean;
    fromCurrency?: string;
    toCurrency?: string;
    orderId?: string;
    executeId?: string;
    inAmount?: string;
    outAmount?: string;
  };
}

/**
 * x402 error codes
 */
export type X402Error = 
  | 'insufficient_funds'
  | 'duplicate_nonce'
  | 'invalid_request'
  | 'rpc_timeout'
  | 'unauthorized';
