import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import type { ReddiQuote } from "./schemas.js";

type StoreData = {
  quotes: ReddiQuote[];
  idempotency: Record<string, { quoteId: string; requestHash: string }>;
  devnetReceipts: DevnetReceipt[];
  devnetIdempotency: Record<string, { quoteId: string; requestHash: string }>;
};

export type DevnetReceipt = {
  schemaVersion: "reddi.rap-mcp-bridge.devnet-payment-receipt.v1";
  quoteId: string;
  createdAt: string;
  boundary: "solana-devnet-only-no-mainnet-no-specialist-http-invocation";
  quoteTermsHash: string;
  spendCapLamports: number;
  amounts: { downstreamAmountLamports: number; protocolFeeBps: 5; protocolFeeLamports: number; totalDebitLamports: number };
  funding: Record<string, unknown>;
  wallets: { payer: string; specialist: string; protocolTreasury: string; funder: string };
  balances: Record<string, unknown>;
  transactions: { downstreamSignature: string; feeSignature: string };
  verification: { devnetPaymentSemantics: "pass" | "fail"; mainnetSettlement: "not_applicable" };
  disclosureLedgerEntry: Record<string, unknown>;
};

const EMPTY: StoreData = { quotes: [], idempotency: {}, devnetReceipts: [], devnetIdempotency: {} };

export class BridgeStore {
  constructor(private readonly dir: string) {}

  private path() { return join(this.dir, "store.json"); }

  read(): StoreData {
    try {
      const data = JSON.parse(readFileSync(this.path(), "utf8")) as Partial<StoreData>;
      return { quotes: data.quotes ?? [], idempotency: data.idempotency ?? {}, devnetReceipts: data.devnetReceipts ?? [], devnetIdempotency: data.devnetIdempotency ?? {} };
    } catch {
      return { ...EMPTY, quotes: [], idempotency: {}, devnetReceipts: [], devnetIdempotency: {} };
    }
  }

  write(data: StoreData) {
    mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    try { chmodSync(this.dir, 0o700); } catch { /* best effort */ }
    writeFileSync(this.path(), JSON.stringify(data, null, 2), { mode: 0o600 });
    try { chmodSync(this.path(), 0o600); } catch { /* best effort */ }
  }

  upsertQuote(quote: ReddiQuote, idempotencyKey?: string, requestHash = quote.termsHash): ReddiQuote {
    const data = this.read();
    if (idempotencyKey && data.idempotency[idempotencyKey]) {
      const prior = data.idempotency[idempotencyKey];
      if (prior.requestHash !== requestHash) {
        throw new Error("idempotency_key_conflict");
      }
      const existing = data.quotes.find((candidate) => candidate.quoteId === prior.quoteId);
      if (existing) return existing;
    }
    data.quotes.push(quote);
    if (idempotencyKey) data.idempotency[idempotencyKey] = { quoteId: quote.quoteId, requestHash };
    this.write(data);
    return quote;
  }

  getQuote(quoteId: string): ReddiQuote | undefined {
    return this.read().quotes.find((quote) => quote.quoteId === quoteId);
  }

  listQuotes(ids: string[]): ReddiQuote[] {
    const data = this.read();
    if (ids.length === 0) return data.quotes.slice(-10);
    const wanted = new Set(ids);
    return data.quotes.filter((quote) => wanted.has(quote.quoteId));
  }

  getDevnetReceiptByIdempotency(idempotencyKey: string): { requestHash: string; receipt: DevnetReceipt } | undefined {
    const data = this.read();
    const prior = data.devnetIdempotency[idempotencyKey];
    if (!prior) return undefined;
    const receipt = data.devnetReceipts.find((candidate) => candidate.quoteId === prior.quoteId);
    return receipt ? { requestHash: prior.requestHash, receipt } : undefined;
  }

  upsertDevnetReceipt(idempotencyKey: string, requestHash: string, receipt: DevnetReceipt): DevnetReceipt {
    const data = this.read();
    data.devnetReceipts.push(receipt);
    data.devnetIdempotency[idempotencyKey] = { quoteId: receipt.quoteId, requestHash };
    this.write(data);
    return receipt;
  }

  listDevnetReceipts(quoteId: string): DevnetReceipt[] {
    return this.read().devnetReceipts.filter((receipt) => receipt.quoteId === quoteId);
  }
}
