/**
 * x402 payment request parsed from HTTP header.
 * Amount is represented as the smallest payment unit for the declared currency.
 */
export interface X402Request {
    amount: number;
    currency: string;
    paymentAddress: string;
    nonce: string;
    payerCurrency?: string;
    payerAddress?: string;
    autoSwap?: boolean;
}
export type SolanaPaymentNetwork = 'solana-devnet' | 'solana-mainnet-beta' | 'solana-testnet';
export interface X402ChallengeInput {
    version?: string;
    network: SolanaPaymentNetwork;
    payTo: string;
    amount: string | number;
    currency: string;
    endpoint: string;
    nonce: string;
    memo?: string;
}
export interface X402Challenge extends X402ChallengeInput {
    version: string;
}
/**
 * Receipt shape used by specialist-side verifiers. This package deliberately
 * does not require secrets or submit transactions.
 */
export interface X402PaymentReceipt {
    network: SolanaPaymentNetwork;
    payTo: string;
    amount: string | number;
    currency: string;
    nonce: string;
    signature?: string;
    txSignature?: string;
    payer?: string;
    demo?: boolean;
}
/**
 * Payment receipt after successful SOL transfer.
 */
export interface PaymentReceipt {
    txSignature: string;
    slot: number;
    lamports: number;
    nonce: string;
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
export type ReceiptVerificationFailureReason = 'invalid_receipt' | 'invalid_payee' | 'invalid_nonce' | 'duplicate_nonce' | 'wrong_amount' | 'wrong_currency' | 'wrong_payee' | 'wrong_network' | 'demo_payment_disabled' | 'unsupported_receipt';
export type ReceiptVerificationResult = {
    ok: true;
    receipt: X402PaymentReceipt;
    demo: boolean;
} | {
    ok: false;
    reason: ReceiptVerificationFailureReason;
    message: string;
    expected?: unknown;
    actual?: unknown;
};
export interface NonceReplayStore {
    checkAndStore(nonce: string): boolean | Promise<boolean>;
}
export interface ReceiptVerifier {
    verifyReceipt(receipt: unknown, challenge: X402Challenge, replayStore?: NonceReplayStore): Promise<ReceiptVerificationResult>;
}
/**
 * x402 error codes.
 */
export type X402Error = 'insufficient_funds' | 'duplicate_nonce' | 'invalid_request' | 'rpc_timeout' | 'unauthorized';
