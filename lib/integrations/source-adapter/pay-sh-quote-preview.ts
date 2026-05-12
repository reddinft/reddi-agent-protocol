import { loadPayShCandidate } from "@/lib/integrations/source-adapter/pay-sh-catalog";
import type { ReddiPayShCandidate } from "@/lib/integrations/source-adapter/profiles/pay-sh";

export type PayShQuotePreview = {
  ok: boolean;
  mode: "dry-run-quote-preview";
  candidate: ReddiPayShCandidate | null;
  task: string;
  routePreview: {
    requestedSource: "pay-sh";
    candidateSource: "pay-sh";
    strictSourceMatch: true;
    routeState: "external_unattested_candidate";
    plannerPolicy: {
      preferredSource: "pay-sh";
      strictSourceMatch: true;
      requireAttestationBeforeTrust: true;
      livePaymentAllowed: false;
      solanaFirst: true;
    };
  } | null;
  quotePreview: {
    currency: "USDC";
    network: "solana";
    rail: "pay_sh_x402_or_mpp";
    minUsd: number;
    maxUsd: number;
    metered: boolean;
    hasFreeTier: boolean;
  } | null;
  requiredGates: string[];
  trustNotes: string[];
  error?: string;
};

export function buildPayShQuotePreview(input: { candidateId: string; task?: string }): PayShQuotePreview {
  const candidateResult = loadPayShCandidate(input.candidateId);
  const task = input.task?.trim() || "Preview Pay.sh Solana API route";

  if (!candidateResult.ok || !candidateResult.candidate) {
    return {
      ok: false,
      mode: "dry-run-quote-preview",
      candidate: null,
      task,
      routePreview: null,
      quotePreview: null,
      requiredGates: [],
      trustNotes: [],
      error: candidateResult.error ?? `Pay.sh candidate not found: ${input.candidateId}`,
    };
  }

  const candidate = candidateResult.candidate;

  return {
    ok: true,
    mode: "dry-run-quote-preview",
    candidate,
    task,
    routePreview: {
      requestedSource: "pay-sh",
      candidateSource: "pay-sh",
      strictSourceMatch: true,
      routeState: "external_unattested_candidate",
      plannerPolicy: {
        preferredSource: "pay-sh",
        strictSourceMatch: true,
        requireAttestationBeforeTrust: true,
        livePaymentAllowed: false,
        solanaFirst: true,
      },
    },
    quotePreview: {
      currency: "USDC",
      network: "solana",
      rail: "pay_sh_x402_or_mpp",
      minUsd: candidate.pricing.minUsd,
      maxUsd: candidate.pricing.maxUsd,
      metered: candidate.pricing.hasMetering,
      hasFreeTier: candidate.pricing.hasFreeTier,
    },
    requiredGates: [
      "User explicitly approves live Pay.sh payment experiment.",
      "Pay.sh wallet/top-up path is verified for the user's geography before live payment.",
      "Tiny spend cap is configured before payment.",
      "Pay.sh receipt/x402/MPP payment proof is captured and attached to a RAP evidence pack.",
      "RAP attestor verifies output, receipt, and disclosure before trust/reputation credit.",
      "Agent cannot change wallet limits, top up funds, or call arbitrary non-allowlisted services.",
    ],
    trustNotes: [
      ...candidate.trustNotes,
      "Preview only: no Pay.sh wallet is created, no top-up is initiated, and no paid API request is sent.",
    ],
  };
}
