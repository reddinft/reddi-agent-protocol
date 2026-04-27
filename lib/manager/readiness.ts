import "server-only";

import { readFileSync } from "fs";
import { join } from "path";
import { fetchSpecialistListings } from "@/lib/registry/bridge";
import { listConsumers } from "@/lib/onboarding/consumer-registry";
import { checkOperatorKeyStatus } from "@/lib/onboarding/operator-key";

export type ManagerReadinessStatus = "ready" | "action_needed";

export type ManagerReadinessRole = {
  id: "specialist" | "attestor" | "consumer" | "manager";
  label: string;
  href: string;
  count: number;
  status: ManagerReadinessStatus;
  nextAction: string;
  signals: string[];
};

export type ManagerReadinessSummary = {
  checkedAt: string;
  status: ManagerReadinessStatus;
  counts: {
    specialists: number;
    liveSpecialists: number;
    insecureOrUnhealthySpecialists: number;
    attestationRecords: number;
    onchainAttestations: number;
    consumers: number;
    operatorReady: boolean;
  };
  roles: ManagerReadinessRole[];
  highestPriorityAction: string;
};

type AttestationRecord = {
  txSignature?: string | null;
  localOnly?: boolean;
};

function readAttestations(): AttestationRecord[] {
  try {
    const parsed = JSON.parse(
      readFileSync(join(process.cwd(), "data", "onboarding", "attestations.json"), "utf8")
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function statusFromAction(nextAction: string): ManagerReadinessStatus {
  return nextAction.startsWith("Ready") ? "ready" : "action_needed";
}

export async function getManagerReadiness(): Promise<ManagerReadinessSummary> {
  const [registry, consumers] = await Promise.all([
    fetchSpecialistListings(),
    Promise.resolve(listConsumers()),
  ]);
  const attestations = readAttestations();
  const operator = checkOperatorKeyStatus();

  const specialists = registry.listings;
  const liveSpecialists = specialists.filter(
    (s) => s.health.status === "pass" && s.capabilities && s.attestation.attested
  ).length;
  const insecureOrUnhealthySpecialists = specialists.filter((s) => s.health.status !== "pass").length;
  const onchainAttestations = attestations.filter((a) => Boolean(a.txSignature) && a.localOnly !== true).length;
  const consumerCount = consumers.results.length;
  const operatorReady = operator.state === "ready";

  const specialistAction =
    liveSpecialists > 0
      ? "Ready: at least one specialist is live, capable, and attested."
      : specialists.length > 0
        ? "Fix specialist readiness: complete healthcheck, x402 compliance, capabilities, and attestation."
        : "Register the first specialist via onboarding.";

  const attestorAction =
    operatorReady && attestations.length > 0
      ? "Ready: attestation operator and audit records are available."
      : operatorReady
        ? "Create the first attestation record by running specialist healthcheck and attestation."
        : "Configure ONBOARDING_ATTEST_OPERATOR_SECRET_KEY before attestation can gate settlement.";

  const consumerAction =
    consumerCount > 0
      ? "Ready: at least one consumer profile exists."
      : "Register a consumer profile before orchestrated paid calls.";

  const managerAction =
    registry.ok && operatorReady && liveSpecialists > 0 && consumerCount > 0
      ? "Ready: role-critical marketplace checks have a usable baseline."
      : "Use this readiness board to clear Specialist, Attestor, and Consumer blockers before demo.";

  const roles: ManagerReadinessRole[] = [
    {
      id: "specialist",
      label: "Specialist",
      href: "/onboarding",
      count: specialists.length,
      status: statusFromAction(specialistAction),
      nextAction: specialistAction,
      signals: [
        `${liveSpecialists} live/attested`,
        `${insecureOrUnhealthySpecialists} unhealthy or unknown`,
        `${registry.indexedCount} indexed`,
      ],
    },
    {
      id: "attestor",
      label: "Attestor",
      href: "/attestation",
      count: attestations.length,
      status: statusFromAction(attestorAction),
      nextAction: attestorAction,
      signals: [
        operatorReady ? "operator ready" : `operator ${operator.state}`,
        `${onchainAttestations} on-chain attestations`,
        `${attestations.length} audit records`,
      ],
    },
    {
      id: "consumer",
      label: "Consumer",
      href: "/consumer",
      count: consumerCount,
      status: statusFromAction(consumerAction),
      nextAction: consumerAction,
      signals: [`${consumerCount} profiles`, "planner tools available"],
    },
    {
      id: "manager",
      label: "Agent Manager",
      href: "/manager",
      count: 1,
      status: statusFromAction(managerAction),
      nextAction: managerAction,
      signals: [
        registry.ok ? "registry reachable" : "registry degraded",
        operatorReady ? "operator ready" : "operator action needed",
        "BDD status: npm run test:bdd:status",
      ],
    },
  ];

  const firstBlocker = roles.find((r) => r.status === "action_needed")?.nextAction;

  return {
    checkedAt: new Date().toISOString(),
    status: firstBlocker ? "action_needed" : "ready",
    counts: {
      specialists: specialists.length,
      liveSpecialists,
      insecureOrUnhealthySpecialists,
      attestationRecords: attestations.length,
      onchainAttestations,
      consumers: consumerCount,
      operatorReady,
    },
    roles,
    highestPriorityAction: firstBlocker ?? "Ready: run the BDD confidence sweep and capture judge evidence.",
  };
}
