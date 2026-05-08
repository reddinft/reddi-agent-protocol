import type { BridgeStore } from "../store.js";
import { sha256Json } from "../hash.js";

export function exportDisclosureLedger(args: { quoteIds: string[]; x402ReceiptIds?: string[] }, store: BridgeStore) {
  const quotes = store.listQuotes(args.quoteIds);
  const x402Receipts = store.listX402SpecialistReceipts(args.x402ReceiptIds ?? []);
  return {
    schemaVersion: "reddi.downstream-disclosure-ledger.v1",
    generatedAt: new Date().toISOString(),
    safePublicEvidenceOnly: true,
    entries: [
      ...quotes.map((quote) => ({
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
      ...x402Receipts.map((receipt) => ({
        entryId: `ledger_${receipt.receiptId}`,
        runId: `paid_${receipt.receiptId}`,
        quoteId: undefined,
        specialistEndpoint: receipt.endpoint,
        capability: "specialist_http_x402",
        payloadClass: "structured_json_summary",
        payloadHash: receipt.requestHash,
        amount: receipt.paymentReceipt.amount,
        currency: receipt.paymentReceipt.currency,
        network: receipt.paymentReceipt.network,
        paymentReceiptHash: sha256Json(JSON.parse(JSON.stringify(receipt.paymentReceipt))),
        verificationStatus: "devnet_verified",
        responseHash: receipt.response.bodyHash,
        evidenceRefs: [receipt.receiptId, receipt.requestHash, String(receipt.paymentReceipt.signature ?? receipt.paymentReceipt.txSignature ?? "")].filter(Boolean),
      })),
    ],
  };
}
