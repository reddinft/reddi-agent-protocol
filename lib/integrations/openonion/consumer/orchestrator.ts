import { executePlannerSpecialistCall, type PlannerExecuteInput } from "@/lib/onboarding/planner-execution";

export type OpenOnionConsumerRunInput = PlannerExecuteInput & {
  retryBudget?: number;
};

export async function runOpenOnionConsumerFlow(input: OpenOnionConsumerRunInput) {
  const retryBudget = Number.isFinite(input.retryBudget) ? Math.max(0, Math.floor(input.retryBudget as number)) : 0;

  let last = await executePlannerSpecialistCall(input);
  let retries = 0;

  while (!last.ok && retries < retryBudget) {
    retries += 1;
    last = await executePlannerSpecialistCall(input);
  }

  if (last.ok) {
    return {
      ok: true as const,
      retries,
      settlementDisposition: "release" as const,
      result: last.result,
    };
  }

  return {
    ok: false as const,
    retries,
    settlementDisposition: "refund" as const,
    failureReason: last.result.error ?? "specialist_unreachable",
    result: last.result,
  };
}
