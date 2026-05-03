import type {
  AttestationCheck,
  AttestationPromptEnvelope,
  AttestationReceiptLink,
  AttestationRequest,
  AttestationVerdict,
  ChatMessage,
  SpecialistProfile,
} from "./types.js";

const REGULATED_DOMAIN_TERMS = ["medical", "health", "legal", "financial", "finance", "tax", "investment", "regulated"];

export const ATTESTATION_VERDICT_SEMANTICS = {
  release: "Recommend release when specialist output is complete, receipt/payment chain is coherent, and no material safety or evidence failures are found.",
  refund: "Recommend refund when output is missing/unsafe/unusable or receipt evidence is materially invalid.",
  dispute: "Recommend dispute when evidence is mixed, score is borderline, or human review is needed before settlement.",
} as const;

export function normalizeAttestationRequest(input: unknown): AttestationRequest {
  const body = isRecord(input) ? input : {};
  const metadata = isRecord(body.metadata) ? body.metadata : {};
  const source = isRecord(metadata.attestation) ? metadata.attestation : body;
  return {
    mode: source.mode === "attestation" ? "attestation" : "attestation",
    subjectProfileId: typeof source.subjectProfileId === "string" ? source.subjectProfileId : undefined,
    specialistOutput: stringifyUnknown(source.specialistOutput ?? source.output ?? latestUserContent(body.messages)),
    receiptChain: normalizeReceiptChain(source.receiptChain ?? source.receipts),
    domain: typeof source.domain === "string" ? source.domain : undefined,
    constraints: Array.isArray(source.constraints) ? source.constraints.map(String) : undefined,
  };
}

export function buildAttestationPromptEnvelope(profile: SpecialistProfile, request: AttestationRequest): AttestationPromptEnvelope {
  const schema = {
    schemaVersion: "reddi.attestation.v1",
    score: "number 0..1",
    recommendedAction: ["release", "refund", "dispute"],
    checks: [{ id: "string", label: "string", status: ["pass", "warn", "fail"], score: "number 0..1", summary: "string" }],
    summary: "string",
    caveats: ["string"],
  };
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `${profile.systemPrompt}\n\nAttestation mode: review the specialist output and receipt chain. Return only a structured verdict matching reddi.attestation.v1. Verdict semantics: release=pay specialist, refund=return funds to requester, dispute=hold for human/secondary review. Preserve regulated-domain caveats; do not claim legal, medical, financial, or security certification.`,
    },
    {
      role: "user",
      content: JSON.stringify({ task: "attest_specialist_output", schema, request }, null, 2),
    },
  ];
  return { mode: "attestation", schemaVersion: "reddi.attestation.v1", messages };
}

export function evaluateAttestation(request: AttestationRequest, attestorProfileId: string): AttestationVerdict {
  const checks = buildChecks(request);
  const score = round(checks.reduce((sum, check) => sum + check.score, 0) / checks.length);
  const hasFail = checks.some((check) => check.status === "fail");
  const hasWarn = checks.some((check) => check.status === "warn");
  const recommendedAction = score >= 0.8 && !hasFail && !hasWarn ? "release" : score < 0.5 || checks.some((check) => check.id === "receipt_integrity" && check.status === "fail") ? "refund" : "dispute";
  const caveats = buildCaveats(request);
  return {
    schemaVersion: "reddi.attestation.v1",
    attestorProfileId,
    subjectProfileId: request.subjectProfileId,
    score,
    recommendedAction,
    checks,
    summary: summaryFor(recommendedAction, score),
    caveats,
    receiptChain: request.receiptChain,
    semantics: ATTESTATION_VERDICT_SEMANTICS,
  };
}

function buildChecks(request: AttestationRequest): AttestationCheck[] {
  const output = request.specialistOutput.trim();
  const receiptCount = request.receiptChain.length;
  const hasReceiptEvidence = receiptCount > 0 && request.receiptChain.some((receipt) => receipt.status === "paid" || receipt.status === "satisfied" || receipt.status === "verified");
  const regulated = isRegulatedDomain(request.domain);
  const forbiddenClaim = /\b(guarantee|certified|definitive legal advice|medical diagnosis|private key|seed phrase)\b/i.test(output);
  const citesEvidence = /\b(evidence|receipt|source|citation|test|validation|artifact)\b/i.test(output);

  return [
    {
      id: "receipt_integrity",
      label: "Receipt chain integrity",
      status: hasReceiptEvidence ? "pass" : receiptCount > 0 ? "warn" : "fail",
      score: hasReceiptEvidence ? 1 : receiptCount > 0 ? 0.6 : 0.2,
      summary: hasReceiptEvidence ? "Receipt chain includes paid/satisfied/verified evidence." : receiptCount > 0 ? "Receipt chain exists but does not clearly show satisfied payment." : "No receipt chain was supplied.",
    },
    {
      id: "output_completeness",
      label: "Output completeness",
      status: output.length >= 80 ? "pass" : output.length >= 24 ? "warn" : "fail",
      score: output.length >= 80 ? 0.95 : output.length >= 24 ? 0.6 : 0.25,
      summary: output.length >= 80 ? "Specialist output is substantive enough for review." : output.length >= 24 ? "Specialist output is brief and may need clarification." : "Specialist output is missing or too short to validate.",
    },
    {
      id: "evidence_quality",
      label: "Evidence quality",
      status: citesEvidence || receiptCount > 1 ? "pass" : receiptCount > 0 ? "warn" : "fail",
      score: citesEvidence || receiptCount > 1 ? 0.9 : receiptCount > 0 ? 0.65 : 0.3,
      summary: citesEvidence || receiptCount > 1 ? "Output or receipts include evidence/validation signals." : receiptCount > 0 ? "Some receipt evidence exists, but output evidence is thin." : "No supporting evidence was provided.",
    },
    {
      id: "safety_boundary",
      label: "Safety and domain boundary",
      status: forbiddenClaim ? "fail" : regulated ? "warn" : "pass",
      score: forbiddenClaim ? 0.2 : regulated ? 0.7 : 1,
      summary: forbiddenClaim ? "Output appears to overclaim or expose unsafe sensitive material." : regulated ? "Regulated-domain caveat required; informational review only." : "No regulated-domain or overclaim caveat detected.",
    },
  ];
}

function buildCaveats(request: AttestationRequest): string[] {
  const caveats = ["Attestation is a protocol settlement recommendation, not professional certification."];
  if (isRegulatedDomain(request.domain)) caveats.push("Regulated-domain caveat: keep this informational and route legal, medical, financial, tax, or investment decisions to qualified human review.");
  if (request.constraints?.length) caveats.push(`Reviewed against stated constraints: ${request.constraints.join("; ")}`);
  return caveats;
}

function summaryFor(action: AttestationVerdict["recommendedAction"], score: number): string {
  if (action === "release") return `Recommend release: verdict score ${score} with no material failed checks.`;
  if (action === "refund") return `Recommend refund: verdict score ${score} or receipt/output failure makes settlement unsafe.`;
  return `Recommend dispute: verdict score ${score} requires human or secondary attestor review before settlement.`;
}

function normalizeReceiptChain(value: unknown): AttestationReceiptLink[] {
  if (!Array.isArray(value)) return [];
  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      id: typeof record.id === "string" ? record.id : `receipt-${index + 1}`,
      type: typeof record.type === "string" ? record.type : "unknown",
      status: typeof record.status === "string" ? record.status : undefined,
      amount: typeof record.amount === "string" ? record.amount : undefined,
      currency: typeof record.currency === "string" ? record.currency : undefined,
      txSignature: typeof record.txSignature === "string" ? record.txSignature : undefined,
      evidenceHash: typeof record.evidenceHash === "string" ? record.evidenceHash : undefined,
    };
  });
}

function latestUserContent(messages: unknown): string | undefined {
  if (!Array.isArray(messages)) return undefined;
  const users = messages.filter((message): message is { role: string; content: unknown } => isRecord(message) && message.role === "user");
  const latest = users.at(-1);
  return typeof latest?.content === "string" ? latest.content : undefined;
}

function stringifyUnknown(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  return JSON.stringify(value);
}

function isRegulatedDomain(domain?: string): boolean {
  return typeof domain === "string" && REGULATED_DOMAIN_TERMS.some((term) => domain.toLowerCase().includes(term));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
