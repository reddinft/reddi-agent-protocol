export type AttestorRoleCounts = {
  attestationRecords: number;
  onchainAttestations: number;
  revealCommits: number;
  availableAttestors: number;
};

export type AttestorCandidate = {
  walletAddress: string;
  endpointUrl?: string | null;
  attestationAccuracy?: number;
  avgFeedbackScore?: number;
  perCallUsd?: number;
  reasons?: string[];
};

export type AttestorRoleSummary = {
  status: "ready" | "needs_attestor" | "needs_activity";
  headline: string;
  nextAction: string;
  checks: Array<{
    id: "profile" | "work_queue" | "audit" | "settlement_gate";
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }>;
};

export function summarizeAttestorRole(counts: AttestorRoleCounts, candidate?: AttestorCandidate | null): AttestorRoleSummary {
  const hasCandidate = Boolean(candidate?.walletAddress) || counts.availableAttestors > 0;
  const hasRecords = counts.attestationRecords > 0;
  const hasOnchain = counts.onchainAttestations > 0;
  const hasRevealAudit = counts.revealCommits > 0;

  const checks: AttestorRoleSummary["checks"] = [
    {
      id: "profile",
      label: "Attestor profile",
      status: hasCandidate ? "pass" : "fail",
      detail: hasCandidate
        ? "An attested specialist can be resolved as a verifier/judge."
        : "No eligible attestor is currently resolvable; attested specialist evidence is required.",
    },
    {
      id: "work_queue",
      label: "Verification work queue",
      status: hasRecords ? "pass" : "warn",
      detail: hasRecords
        ? `${counts.attestationRecords} attestation record(s) are available for review.`
        : "No attestation jobs have been recorded yet; run dogfood or specialist health/attestation flow.",
    },
    {
      id: "audit",
      label: "Audit proof",
      status: hasOnchain ? "pass" : hasRecords ? "warn" : "fail",
      detail: hasOnchain
        ? `${counts.onchainAttestations} attestation(s) include on-chain proof.`
        : hasRecords
          ? "Only local attestation evidence is visible; on-chain proof strengthens judge readiness."
          : "No attestation audit proof is visible yet.",
    },
    {
      id: "settlement_gate",
      label: "Release/refund gate",
      status: hasRevealAudit ? "pass" : "warn",
      detail: hasRevealAudit
        ? `${counts.revealCommits} reveal/settlement audit event(s) link verifier decisions to outcomes.`
        : "No reveal/settlement decisions are visible yet; dogfood pass/fail demonstrates this gate.",
    },
  ];

  if (!hasCandidate) {
    return {
      status: "needs_attestor",
      headline: "Attestor path needs an eligible verifier",
      nextAction: "Register or attest at least one specialist, then resolve an attestor for verification work.",
      checks,
    };
  }

  if (!hasRecords) {
    return {
      status: "needs_activity",
      headline: "Attestor role is discoverable; verification activity is still needed",
      nextAction: "Run the dogfood attestor flow or submit specialist attestation evidence.",
      checks,
    };
  }

  return {
    status: "ready",
    headline: hasOnchain ? "Attestor role is ready with audit evidence" : "Attestor role is ready with local audit evidence",
    nextAction: hasRevealAudit ? "Use attestor decisions to gate release/refund flows." : "Run a pass/fail dogfood settlement to show release/refund gating.",
    checks,
  };
}
