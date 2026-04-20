import "server-only";

import { randomUUID } from "crypto";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type DogfoodEscrow = {
  escrowId: string;
  runId: string;
  consumerWallet: string;
  specialistWallet: string;
  amountUsd: number;
  status: "held" | "released" | "refunded" | "disputed";
  createdAt: string;
  decidedAt?: string;
  decisionReason?: string;
  attestationPass?: boolean;
};

const ESCROW_PATH = join(process.cwd(), "data", "onboarding", "dogfood-escrows.json");

function readEscrows(): DogfoodEscrow[] {
  try {
    return JSON.parse(readFileSync(ESCROW_PATH, "utf8")) as DogfoodEscrow[];
  } catch {
    return [];
  }
}

function writeEscrows(escrows: DogfoodEscrow[]) {
  mkdirSync(join(process.cwd(), "data", "onboarding"), { recursive: true });
  writeFileSync(ESCROW_PATH, JSON.stringify(escrows, null, 2));
}

export function createEscrow(input: {
  runId: string;
  consumerWallet: string;
  specialistWallet: string;
  amountUsd: number;
}) {
  const escrow: DogfoodEscrow = {
    escrowId: `escrow_${randomUUID()}`,
    runId: input.runId,
    consumerWallet: input.consumerWallet,
    specialistWallet: input.specialistWallet,
    amountUsd: input.amountUsd,
    status: "held",
    createdAt: new Date().toISOString(),
  };

  const escrows = readEscrows();
  escrows.push(escrow);
  writeEscrows(escrows);
  return escrow;
}

export function settleEscrow(input: {
  escrowId: string;
  decision: "release" | "refund" | "dispute";
  reason?: string;
  attestationPass?: boolean;
}) {
  const escrows = readEscrows();
  const idx = escrows.findIndex((e) => e.escrowId === input.escrowId);
  if (idx < 0) throw new Error("Escrow not found.");

  const current = escrows[idx];
  if (current.status !== "held") {
    throw new Error(`Escrow already settled as ${current.status}.`);
  }

  const nextStatus =
    input.decision === "release"
      ? "released"
      : input.decision === "refund"
        ? "refunded"
        : "disputed";

  const next: DogfoodEscrow = {
    ...current,
    status: nextStatus,
    decidedAt: new Date().toISOString(),
    decisionReason: input.reason,
    attestationPass: input.attestationPass,
  };

  escrows[idx] = next;
  writeEscrows(escrows);
  return next;
}

