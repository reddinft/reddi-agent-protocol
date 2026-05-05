import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import {
  getFallbackDisclosureLedgerSummary,
  getStaticWebpageLiveWorkflowEvidence,
  type WebpageLiveWorkflowDisclosureLedgerSummary,
  type WebpageLiveWorkflowEvidence,
} from "@/lib/economic-demo/webpage-live-workflow-evidence";

type EvidencePackJson = {
  schemaVersion?: string;
  generatedAt?: string;
  sourceArtifactPath?: string;
  disclosureLedgerSummary?: WebpageLiveWorkflowDisclosureLedgerSummary;
};

export type LatestEvidencePackSummary = {
  schemaVersion: string;
  generatedAt: string;
  artifactPath: string;
  sourceArtifactPath: string | null;
  disclosureLedgerSummary: WebpageLiveWorkflowDisclosureLedgerSummary;
};

function defaultEvidencePackRoot() {
  return join(process.cwd(), "artifacts", "economic-demo-evidence-pack");
}

function latestEvidencePackPath(evidencePackRoot = defaultEvidencePackRoot()) {
  if (!existsSync(evidencePackRoot)) return null;

  const candidates = readdirSync(evidencePackRoot)
    .map((entry) => join(evidencePackRoot, entry, "evidence-pack.json"))
    .filter((path) => existsSync(path))
    .map((path) => ({ path, mtimeMs: statSync(path).mtimeMs }))
    .sort((a, b) => b.mtimeMs - a.mtimeMs || b.path.localeCompare(a.path));

  return candidates[0]?.path ?? null;
}

export function getLatestEvidencePackSummary(evidencePackRoot = defaultEvidencePackRoot()): LatestEvidencePackSummary | null {
  const path = latestEvidencePackPath(evidencePackRoot);
  if (!path) return null;

  const pack = JSON.parse(readFileSync(path, "utf8")) as EvidencePackJson;
  if (pack.schemaVersion !== "reddi.economic-demo.judge-evidence-pack.v1") return null;

  return {
    schemaVersion: pack.schemaVersion,
    generatedAt: pack.generatedAt ?? "unknown",
    artifactPath: path.replace(`${process.cwd()}/`, ""),
    sourceArtifactPath: pack.sourceArtifactPath ?? null,
    disclosureLedgerSummary: pack.disclosureLedgerSummary ?? getFallbackDisclosureLedgerSummary(),
  };
}

export function getWebpageLiveWorkflowEvidence(evidencePackRoot = defaultEvidencePackRoot()): WebpageLiveWorkflowEvidence {
  const base = getStaticWebpageLiveWorkflowEvidence();
  const evidencePack = getLatestEvidencePackSummary(evidencePackRoot);

  if (!evidencePack) return base;

  return {
    ...base,
    sourceArtifactPath: evidencePack.sourceArtifactPath ?? base.sourceArtifactPath,
    disclosureLedgerSummary: evidencePack.disclosureLedgerSummary,
    latestEvidencePack: evidencePack,
  };
}
