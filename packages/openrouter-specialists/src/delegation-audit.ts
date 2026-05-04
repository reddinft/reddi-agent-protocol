import { createHash } from "node:crypto";
import type { LiveDelegationIntentPlan } from "./delegation-intent.js";

export interface LiveDelegationAuditEnvelope {
  schemaVersion: "reddi.live-delegation-audit-envelope.v1";
  canonicalization: "json-stable-sort-v1";
  hashAlgorithm: "sha256";
  envelopeHash: string;
  canonicalJson: string;
  intentPlan: LiveDelegationIntentPlan;
  signatureStatus: "unsigned";
  persistenceStatus: "not_persisted";
  executionStatus: "not_executed";
  guardrails: {
    noSignerMaterialUsed: true;
    noExternalPersistence: true;
    noDevnetTransferExecuted: true;
    noDownstreamX402Executed: true;
  };
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value));
}

export function buildLiveDelegationAuditEnvelope(intentPlan: LiveDelegationIntentPlan): LiveDelegationAuditEnvelope {
  const canonicalPayload = canonicalJson({
    schemaVersion: "reddi.live-delegation-audit-envelope.v1",
    intentPlan,
    signatureStatus: "unsigned",
    persistenceStatus: "not_persisted",
    executionStatus: "not_executed",
  });
  return {
    schemaVersion: "reddi.live-delegation-audit-envelope.v1",
    canonicalization: "json-stable-sort-v1",
    hashAlgorithm: "sha256",
    envelopeHash: `sha256:${createHash("sha256").update(canonicalPayload).digest("hex")}`,
    canonicalJson: canonicalPayload,
    intentPlan,
    signatureStatus: "unsigned",
    persistenceStatus: "not_persisted",
    executionStatus: "not_executed",
    guardrails: {
      noSignerMaterialUsed: true,
      noExternalPersistence: true,
      noDevnetTransferExecuted: true,
      noDownstreamX402Executed: true,
    },
  };
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForCanonicalJson);
  if (!isPlainObject(value)) return value;

  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const child = value[key];
    if (child !== undefined) sorted[key] = sortForCanonicalJson(child);
  }
  return sorted;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}
