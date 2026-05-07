import type { BridgeStore } from "../store.js";
import { sha256Json } from "../hash.js";

export function exportDisclosureLedger(args: { quoteIds: string[] }, store: BridgeStore) {
  const quotes = store.listQuotes(args.quoteIds);
  return {
    schemaVersion: "reddi.downstream-disclosure-ledger.v1",
    generatedAt: new Date().toISOString(),
    safePublicEvidenceOnly: true,
    entries: quotes.map((quote) => ({
      entryId: `ledger_${quote.quoteId}`,
      runId: `planned_${quote.quoteId}`,
      quoteId: quote.quoteId,
      specialistWallet: quote.specialist.walletAddress,
      capability: quote.specialist.capability,
      payloadClass: quote.task.payloadClass,
      payloadHash: quote.task.taskHash,
      amount: quote.terms.amount,
      currency: quote.terms.currency,
      network: quote.terms.network,
      paymentReceiptHash: undefined,
      verificationStatus: "planned",
      evidenceRefs: [quote.quoteId, quote.termsHash, sha256Json({ quoteId: quote.quoteId, termsHash: quote.termsHash })],
    })),
  };
}
