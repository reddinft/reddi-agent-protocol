import { z } from "zod";

export const MAX_TASK_CHARS = 8000;
export const MAX_SUMMARY_CHARS = 2000;
export const MAX_EVIDENCE_REFS = 32;
export const MAX_EVIDENCE_REF_CHARS = 512;
export const MAX_LEDGER_ENTRIES = 100;

export const payloadClassSchema = z.enum(["prompt_summary", "structured_json_summary"]);

export const discoverInputSchema = {
  task: z.string().min(1).max(MAX_TASK_CHARS),
  taskTypeHint: z.string().max(128).optional(),
  maxPerCallUsd: z.number().nonnegative().optional(),
  requireAttestation: z.boolean().optional(),
  limit: z.number().int().min(1).max(10).optional(),
};

export const requestQuoteInputSchema = {
  taskSummary: z.string().min(1).max(MAX_SUMMARY_CHARS),
  taskTypeHint: z.string().max(128).optional(),
  specialistWallet: z.string().max(128).optional(),
  capability: z.string().max(128).default("custom"),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/).default("0"),
  currency: z.string().max(12).default("USDC"),
  network: z.string().max(64).default("demo"),
  payloadClass: payloadClassSchema.default("prompt_summary"),
  evidenceRefs: z.array(z.string().max(MAX_EVIDENCE_REF_CHARS)).max(MAX_EVIDENCE_REFS).default([]),
  idempotencyKey: z.string().max(128).optional(),
};

export const verifyReceiptInputSchema = {
  quoteId: z.string().max(160).optional(),
  termsHash: z.string().max(160).optional(),
};

export const exportDisclosureLedgerInputSchema = {
  quoteIds: z.array(z.string().max(160)).max(MAX_LEDGER_ENTRIES).default([]),
};

export type ReddiQuote = {
  schemaVersion: "reddi.quote.v1";
  quoteId: string;
  quoteStatus: "active";
  quoteAuthority: "bridge_synthetic";
  binding: false;
  createdAt: string;
  specialist: {
    walletAddress: string;
    capability: string;
  };
  task: {
    taskHash: string;
    taskSummaryHash: string;
    payloadClass: "prompt_summary" | "structured_json_summary";
  };
  terms: {
    amount: string;
    currency: string;
    network: string;
    requiredEvidence: string[];
  };
  termsHash: string;
};
