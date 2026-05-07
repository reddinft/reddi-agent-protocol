import { mkdirSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import type { ReddiQuote } from "./schemas.js";

type StoreData = {
  quotes: ReddiQuote[];
  idempotency: Record<string, { quoteId: string; requestHash: string }>;
};

const EMPTY: StoreData = { quotes: [], idempotency: {} };

export class BridgeStore {
  constructor(private readonly dir: string) {}

  private path() { return join(this.dir, "store.json"); }

  read(): StoreData {
    try {
      return JSON.parse(readFileSync(this.path(), "utf8")) as StoreData;
    } catch {
      return { ...EMPTY, quotes: [], idempotency: {} };
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
}
