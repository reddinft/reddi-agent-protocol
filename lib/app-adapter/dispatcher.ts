import { buildAppAdapterReceipt } from "./receipts";
import type { AppAdapterAgent, AppAdapterRun } from "./types";

export type AppAdapterDispatchMode = "mock" | "planner";

export function getAppAdapterDispatchMode(env = process.env): AppAdapterDispatchMode {
  return env.REDDI_APP_ADAPTER_DISPATCH === "planner" ? "planner" : "mock";
}

export async function dispatchAppAdapterRun(agent: AppAdapterAgent, run: AppAdapterRun): Promise<AppAdapterRun> {
  if (getAppAdapterDispatchMode() === "planner") {
    return dispatchPlannerAppAdapterRun(agent, run);
  }
  return dispatchMockAppAdapterRun(agent, run);
}

export async function dispatchMockAppAdapterRun(agent: AppAdapterAgent, run: AppAdapterRun): Promise<AppAdapterRun> {
  const now = new Date().toISOString();
  const constraints = run.input.constraints?.length ? ` Constraints: ${run.input.constraints.join("; ")}.` : "";

  return {
    ...run,
    status: "succeeded",
    updatedAt: now,
    output: {
      content: `[Mock ReddiAgents APP Adapter] ${agent.name} accepted task: ${run.input.task}.${constraints}`,
      evidence: agent.reddi.evidenceRoutes.map((url) => ({
        label: url === "/manager" ? "Manager evidence surface" : "Volunteer tester evidence surface",
        url,
      })),
    },
    usage: {
      input_tokens: null,
      output_tokens: null,
      cost_usd: null,
    },
    receipt: buildAppAdapterReceipt(agent, run, {
      x402Satisfied: agent.reddi.x402Required,
      attestationStatus: "not_requested",
      escrowStatus: "not_used",
    }),
  };
}

export async function dispatchPlannerAppAdapterRun(agent: AppAdapterAgent, run: AppAdapterRun): Promise<AppAdapterRun> {
  const { executePlannerSpecialistCall } = await import("@/lib/onboarding/planner-execution");
  const result = await executePlannerSpecialistCall({
    prompt: run.input.task,
    preferredWallet: agent.reddi.specialistWallet,
    policy: {
      requiresAttested: agent.reddi.attestationSupported,
      requiresHealthPass: true,
    },
  });
  const now = new Date().toISOString();

  if (!result.ok) {
    return {
      ...run,
      status: "failed",
      updatedAt: now,
      safeError: {
        code: "planner_dispatch_failed",
        message: result.result.error ?? "Reddi planner dispatch failed",
      },
      receipt: buildAppAdapterReceipt(agent, run, {
        x402Satisfied: Boolean(result.result.paymentSatisfied),
        attestationStatus: "not_requested",
        escrowStatus: "failed",
      }),
    };
  }

  return {
    ...run,
    status: "succeeded",
    updatedAt: now,
    output: {
      content: result.result.responsePreview ?? "Reddi planner completed without a response preview.",
      evidence: agent.reddi.evidenceRoutes.map((url) => ({
        label: url === "/manager" ? "Manager evidence surface" : "Volunteer tester evidence surface",
        url,
      })),
    },
    usage: {
      input_tokens: null,
      output_tokens: null,
      cost_usd: null,
    },
    receipt: buildAppAdapterReceipt(agent, run, {
      x402Satisfied: Boolean(result.result.paymentSatisfied),
      attestationStatus: agent.reddi.attestationSupported ? "pending" : "not_requested",
      escrowStatus: result.result.paymentSatisfied ? "released" : "not_used",
    }),
  };
}
