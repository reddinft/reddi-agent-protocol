import "server-only";

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

export type EvidenceArtifact = {
  id: "bdd" | "onboarding" | "attestor" | "consumer" | "settlement";
  label: string;
  path: string | null;
  status: "present" | "missing";
  summary: string;
};

export type ManagerEvidencePack = {
  generatedAt: string;
  status: "ready" | "incomplete";
  command: string;
  artifacts: EvidenceArtifact[];
  privacy: {
    rawPromptsIncluded: false;
    secretsIncluded: false;
    note: string;
  };
  nextAction: string;
};

const ARTIFACT_ROOT = join(process.cwd(), "artifacts");

function latestSummary(dir: string): { relative: string; absolute: string } | null {
  const root = join(ARTIFACT_ROOT, dir);
  if (!existsSync(root)) return null;
  const candidates = readdirSync(root)
    .map((name) => ({
      relative: `artifacts/${dir}/${name}/SUMMARY.md`,
      absolute: join(ARTIFACT_ROOT, dir, name, "SUMMARY.md"),
    }))
    .filter((item) => existsSync(item.absolute))
    .sort((a, b) => statSync(b.absolute).mtimeMs - statSync(a.absolute).mtimeMs);
  return candidates[0] ?? null;
}

function firstUsefulLine(path: { relative: string; absolute: string } | null) {
  if (!path) return "No artifact found yet.";
  try {
    const raw = readFileSync(path.absolute, "utf8");
    const line = raw
      .split(/\r?\n/)
      .map((value) => value.trim())
      .find((value) => value && !value.startsWith("#"));
    return line ?? "Artifact exists; open summary for details.";
  } catch {
    return "Artifact exists; summary could not be read.";
  }
}

function artifact(id: EvidenceArtifact["id"], label: string, dir: string): EvidenceArtifact {
  const path = latestSummary(dir);
  return {
    id,
    label,
    path: path?.relative ?? null,
    status: path ? "present" : "missing",
    summary: firstUsefulLine(path),
  };
}

export function buildManagerEvidencePack(): ManagerEvidencePack {
  const artifacts: EvidenceArtifact[] = [
    artifact("bdd", "Latest BDD confidence sweep", "bdd-sweep"),
    artifact("onboarding", "Specialist onboarding wrapper", "surfpool-onboarding-wrapper"),
    artifact("attestor", "Attestor-gated specialist onboarding", "surfpool-onboarding"),
    artifact("consumer", "Consumer paid x402 invocation", "surfpool-jupiter-invoke"),
    artifact("settlement", "Solana escrow settlement smoke", "surfpool-smoke"),
  ];
  const missing = artifacts.filter((item) => item.status === "missing");

  return {
    generatedAt: new Date().toISOString(),
    status: missing.length === 0 ? "ready" : "incomplete",
    command: "npm run test:bdd:status && npm run test:bdd:sweep",
    artifacts,
    privacy: {
      rawPromptsIncluded: false,
      secretsIncluded: false,
      note: "Evidence pack links SUMMARY.md artifacts only; raw prompts, API keys, private runtime logs, and payment secrets are intentionally excluded.",
    },
    nextAction: missing.length === 0
      ? "Attach these summary links to judge/demo notes and rerun sweep if evidence gets stale."
      : `Generate missing evidence: ${missing.map((item) => item.label).join(", ")}.`,
  };
}
