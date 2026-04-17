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
 */

import {
  JupiterSwapV2Client,
  parseX402Header,
  sendPayment,
  type PaymentReceipt,
  type X402Request,
} from "@reddi/x402-solana";

export type X402ChallengeMetadata = {
  swap_used: boolean;
  orderId?: string;
  executeId?: string;
};

export type X402ChallengeResult =
  | {
      ok: true;
      receiptHeader: string;
      receipt: PaymentReceipt;
      trace: string[];
      metadata: X402ChallengeMetadata;
    }
  | { ok: false; error: string; trace: string[]; metadata: X402ChallengeMetadata };

export function getJupiterSwapClient() {
  const apiBase = process.env.JUPITER_API_BASE?.trim() || "https://api.jup.ag";
  if (!apiBase) return undefined;
  return new JupiterSwapV2Client({ apiBaseUrl: apiBase });
}

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
      metadata: { swap_used: false },
    };
  }

  trace.push("x402:challenge_header_found");

  let parsed: X402Request;
  try {
    parsed = parseX402Header(raw);
    trace.push(`x402:parsed:amount=${parsed.amount}:currency=${parsed.currency}`);
  } catch (err) {
    trace.push("x402:parse_error");
    return {
      ok: false,
      error: `Failed to parse x402-request header: ${err instanceof Error ? err.message : String(err)}`,
      trace,
      metadata: { swap_used: false },
    };
  }

  const swapClient = getJupiterSwapClient();
  if (swapClient) {
    trace.push(`x402:jupiter_enabled:${process.env.JUPITER_API_BASE?.trim() || "https://api.jup.ag"}`);
  }

  // Inject payer hint if not already present
  const enriched: X402Request = {
    ...parsed,
    payerAddress: parsed.payerAddress ?? orchestratorWallet,
  };

  const slippageCandidate = Number(process.env.JUPITER_SLIPPAGE_BPS ?? 50);
  const slippageBps = Number.isFinite(slippageCandidate) ? slippageCandidate : 50;

  let receipt: PaymentReceipt;
  try {
    receipt = await sendPayment(enriched, {
      swapClient,
      slippageBps,
    });
    trace.push(`x402:payment_sent:tx=${receipt.txSignature}:slot=${receipt.slot}`);
  } catch (err) {
    trace.push("x402:payment_send_error");
    return {
      ok: false,
      error: `x402 sendPayment failed: ${err instanceof Error ? err.message : String(err)}`,
      trace,
      metadata: { swap_used: false },
    };
  }

  const metadata: X402ChallengeMetadata = receipt.swap?.performed
    ? {
        swap_used: true,
        orderId: receipt.swap.orderId,
        executeId: receipt.swap.executeId,
      }
    : { swap_used: false };

  if (metadata.swap_used) {
    trace.push(`x402:swap_used:order=${metadata.orderId}:execute=${metadata.executeId}`);
  }

  return {
    ok: true,
    receiptHeader: JSON.stringify(receipt),
    receipt,
    trace,
    metadata,
  };
}
