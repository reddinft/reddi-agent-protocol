import "server-only";

import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type RecordAttestationInput = {
  walletAddress: string;
  endpointUrl: string;
  healthcheckStatus: "pending" | "pass" | "fail";
  operator: string;
  jobIdHex?: string;
  txSignature?: string;
  operatorPubkeySuffix?: string;
  localOnly?: boolean;
};

export type AttestationRecord = {
  id: string;
  recordedAt: string;
  createdAt: string;
  walletAddress: string;
  endpointUrl: string;
  operator: string;
  operatorPubkeySuffix?: string;
  jobIdHex?: string;
  txSignature?: string;
  localOnly: boolean;
  source: "onboarding-wizard" | "onchain-attestation";
};

const ATTESTATION_PATH = join(process.cwd(), "data", "onboarding", "attestations.json");

function readAll(): AttestationRecord[] {
  try {
    return JSON.parse(readFileSync(ATTESTATION_PATH, "utf8")) as AttestationRecord[];
  } catch {
    return [];
  }
}

function writeAll(records: AttestationRecord[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(ATTESTATION_PATH, JSON.stringify(records, null, 2));
}

export function recordAttestation(input: RecordAttestationInput) {
  if (input.healthcheckStatus !== "pass") {
    throw new Error("Attestation is blocked until healthcheck passes.");
  }
  if (!input.walletAddress || input.walletAddress.length < 32) {
    throw new Error("Valid wallet address is required for attestation.");
  }
  if (!input.endpointUrl || !input.endpointUrl.includes(".")) {
    throw new Error("Valid endpoint URL is required for attestation.");
  }

  const recordedAt = new Date().toISOString();
  const record: AttestationRecord = {
    id: `att_${Date.now().toString(36)}`,
    recordedAt,
    createdAt: recordedAt,
    walletAddress: input.walletAddress,
    endpointUrl: input.endpointUrl,
    operator: input.operator || "operator-unknown",
    operatorPubkeySuffix: input.operatorPubkeySuffix,
    jobIdHex: input.jobIdHex,
    txSignature: input.txSignature,
    localOnly: input.localOnly ?? !input.txSignature,
    source: input.txSignature ? "onchain-attestation" : "onboarding-wizard",
  };

  const existing = readAll();
  existing.push(record);
  writeAll(existing);

  return {
    ok: true,
    record,
    storagePath: ATTESTATION_PATH,
    note: "Operator attestation recorded. Next: wire on-chain attest_quality submit.",
  };
}
