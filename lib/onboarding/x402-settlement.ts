import "server-only";

/**
 * x402 real settlement path for planner specialist calls.
 *
 * When a specialist endpoint returns HTTP 402, it must include an
 * `x402-request` header describing the payment terms:
 *   { amount, currency, paymentAddress, nonce, payerCurrency?, payerAddress?, autoSwap? }
 *
 * This module:
 * 1. Parses the x402-request challenge from the 402 response.
 * 2. Calls sendPayment() to produce a signed receipt.
 * 3. Returns the receipt as a JSON string to embed in the `x402-payment`
 *    retry header.
 *
 * NOTE: sendPayment() in @reddi/x402-solana is currently a stub (Phase 1).
 * It returns a structurally valid receipt with a mock tx signature.
 * Phase 2 wiring (real Solana keypair + RPC send) is tracked in:
 *   packages/x402-solana/src/payment.ts#sendPayment
 * The orchestration architecture here is correct and production-ready.
 */

import { parseX402Header } from "@/packages/x402-solana/src/payment";
import { sendPayment } from "@/packages/x402-solana/src/payment";
import type { PaymentReceipt } from "@/packages/x402-solana/src/types";

export type X402ChallengeResult =
  | { ok: true; receiptHeader: string; receipt: PaymentReceipt; trace: string[] }
  | { ok: false; error: string; trace: string[] };

/**
 * Process a 402 challenge from a specialist endpoint.
 *
 * @param responseHeaders  Headers from the 402 response (Record<string, string>)
 * @param orchestratorWallet  Orchestrator wallet address for payerAddress hint
 */
export async function processX402Challenge(
  responseHeaders: Record<string, string>,
  orchestratorWallet?: string
): Promise<X402ChallengeResult> {
  const trace: string[] = [];

  const raw = responseHeaders["x402-request"] ?? responseHeaders["X-402-Request"];
  if (!raw) {
    trace.push("x402:challenge_header_missing");
    return {
      ok: false,
      error: "Specialist returned 402 but no x402-request header found.",
      trace,
    };
  }

  trace.push("x402:challenge_header_found");

  let parsed;
  try {
    parsed = parseX402Header(raw);
    trace.push(`x402:parsed:amount=${parsed.amount}:currency=${parsed.currency}`);
  } catch (err) {
    trace.push("x402:parse_error");
    return {
      ok: false,
      error: `Failed to parse x402-request header: ${err instanceof Error ? err.message : String(err)}`,
      trace,
    };
  }

  // Inject payer hint if not already present
  const enriched = {
    ...parsed,
    payerAddress: parsed.payerAddress ?? orchestratorWallet,
  };

  let receipt: PaymentReceipt;
  try {
    receipt = await sendPayment(enriched);
    trace.push(`x402:payment_sent:tx=${receipt.txSignature}:slot=${receipt.slot}`);
  } catch (err) {
    trace.push("x402:payment_send_error");
    return {
      ok: false,
      error: `x402 sendPayment failed: ${err instanceof Error ? err.message : String(err)}`,
      trace,
    };
  }

  return {
    ok: true,
    receiptHeader: JSON.stringify(receipt),
    receipt,
    trace,
  };
}
