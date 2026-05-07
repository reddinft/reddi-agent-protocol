import { randomUUID } from "node:crypto";
import type { BridgeStore } from "../store.js";
import { sha256Json } from "../hash.js";
import type { ReddiQuote } from "../schemas.js";

type RequestQuoteArgs = {
  taskSummary: string;
  taskTypeHint?: string;
  specialistWallet?: string;
  capability: string;
  amount: string;
  currency: string;
  network: string;
  payloadClass: "prompt_summary" | "structured_json_summary";
  evidenceRefs: string[];
  idempotencyKey?: string;
};

export function requestQuote(args: RequestQuoteArgs, store: BridgeStore): ReddiQuote {
  const normalizedTerms = {
    amount: args.amount,
    currency: args.currency.toUpperCase(),
    network: args.network.toLowerCase(),
    capability: args.capability,
    requiredEvidence: [...args.evidenceRefs].sort(),
  };
  const taskHash = sha256Json({
    taskSummary: args.taskSummary,
    taskTypeHint: args.taskTypeHint,
    payloadClass: args.payloadClass,
  });
  const requestHash = sha256Json({
    taskSummary: args.taskSummary,
    taskTypeHint: args.taskTypeHint,
    specialistWallet: args.specialistWallet,
    capability: args.capability,
    amount: args.amount,
    currency: args.currency.toUpperCase(),
    network: args.network.toLowerCase(),
    payloadClass: args.payloadClass,
    evidenceRefs: [...args.evidenceRefs].sort(),
  });
  const quote: ReddiQuote = {
    schemaVersion: "reddi.quote.v1",
    quoteId: `quote_${randomUUID()}`,
    quoteStatus: "active",
    quoteAuthority: "bridge_synthetic",
    binding: false,
    createdAt: new Date().toISOString(),
    specialist: {
      walletAddress: args.specialistWallet ?? "unknown",
      capability: args.capability,
    },
    task: {
      taskHash,
      taskSummaryHash: sha256Json({ taskSummary: args.taskSummary }),
      payloadClass: args.payloadClass,
    },
    terms: {
      amount: normalizedTerms.amount,
      currency: normalizedTerms.currency,
      network: normalizedTerms.network,
      requiredEvidence: normalizedTerms.requiredEvidence,
    },
    termsHash: sha256Json(normalizedTerms),
  };
  return store.upsertQuote(quote, args.idempotencyKey, requestHash);
}
