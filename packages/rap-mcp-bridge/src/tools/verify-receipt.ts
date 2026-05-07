import type { BridgeStore } from "../store.js";

export function verifyReceipt(args: { quoteId?: string; termsHash?: string }, store: BridgeStore) {
  const quote = args.quoteId ? store.getQuote(args.quoteId) : undefined;
  const termsMatch = quote && args.termsHash ? quote.termsHash === args.termsHash : undefined;
  return {
    schemaVersion: "reddi.receipt_verification_result.v1",
    quoteId: args.quoteId,
    verified: false,
    boundary: "dry_run",
    checks: {
      quoteExists: args.quoteId ? (quote ? "pass" : "fail") : "not_applicable",
      termsHash: termsMatch === undefined ? "not_applicable" : termsMatch ? "pass" : "fail",
      paymentReceipt: "not_applicable",
      specialistIdentity: quote ? "pending" : "not_applicable",
      disclosureLedger: quote ? "pending" : "not_applicable",
      attestation: "not_applicable",
    },
    warnings: [
      "Dry-run bridge verification does not prove payment settlement.",
      "Synthetic quotes are non-binding and bridge-authored.",
    ],
  };
}
