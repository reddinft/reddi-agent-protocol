import type { PublicKey } from "@solana/web3.js";

export type ExistingAgentStatus = "idle" | "checking" | "registered" | "not_registered" | "error";

export type ExistingAgentState = {
  status: ExistingAgentStatus;
  pda?: string;
  error?: string;
};

export const INITIAL_EXISTING_AGENT_STATE: ExistingAgentState = { status: "idle" };

export function agentDetailHref(owner: PublicKey | string) {
  const wallet = typeof owner === "string" ? owner : owner.toBase58();
  return `/agents/${encodeURIComponent(wallet)}`;
}

export function isAlreadyRegisteredError(message: string) {
  const text = message.toLowerCase();
  const hasRegisterContext = text.includes("registeragent") || text.includes("register_agent");
  const hasAlreadyInUse =
    text.includes("already in use") ||
    text.includes("alreadyinuse") ||
    text.includes("accountalreadyinitialized") ||
    text.includes("allocate: account");

  const hasSystemAllocateCustomZero =
    hasRegisterContext &&
    text.includes("allocate") &&
    (text.includes("custom program error: 0x0") || text.includes('"custom":0'));

  return hasAlreadyInUse || hasSystemAllocateCustomZero;
}
