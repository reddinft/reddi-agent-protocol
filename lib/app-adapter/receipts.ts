import type { AppAdapterAgent, AppAdapterRun } from "./types";

type ReceiptOptions = {
  x402Satisfied?: boolean;
  attestationStatus?: "not_requested" | "pending" | "passed" | "failed";
  escrowStatus?: "not_used" | "locked" | "released" | "refunded" | "failed";
};

export function buildAppAdapterReceipt(
  agent: AppAdapterAgent,
  run: Pick<AppAdapterRun, "context" | "agentId">,
  options: ReceiptOptions = {}
) {
  return {
    adapter: "reddiagents-app-adapter" as const,
    adapter_version: "0.1.0" as const,
    trace_id: run.context.traceId,
    agent_id: run.agentId,
    x402_required: agent.reddi.x402Required,
    x402_satisfied: options.x402Satisfied ?? false,
    attestation_status: options.attestationStatus ?? "not_requested" as const,
    escrow_status: options.escrowStatus ?? "not_used" as const,
    safe_public_evidence_only: true as const,
  };
}
