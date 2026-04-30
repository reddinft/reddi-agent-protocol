import { dispatchAppAdapterRun } from "@/lib/app-adapter/dispatcher";
import { findAppAdapterAgent } from "@/lib/app-adapter/registry";
import { createRunId, saveAppAdapterRun } from "@/lib/app-adapter/store";
import { normalizeTraceId, validateRunInput } from "@/lib/app-adapter/translator";
import type { AppAdapterRun } from "@/lib/app-adapter/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const agentId = typeof body.agent_id === "string" ? body.agent_id : "";
  const agent = findAppAdapterAgent(agentId);
  if (!agent || !agent.enabled) {
    return Response.json({ ok: false, error: "Unknown or disabled APP adapter agent" }, { status: 404 });
  }

  const inputResult = validateRunInput(body.input);
  if (!inputResult.ok) {
    return Response.json({ ok: false, error: inputResult.error }, { status: 400 });
  }

  const context = body.context && typeof body.context === "object" ? (body.context as Record<string, unknown>) : {};
  const now = new Date().toISOString();
  const run: AppAdapterRun = {
    runId: createRunId(),
    agentId: agent.appAgentId,
    status: "running",
    input: inputResult.input,
    context: {
      conversationId: typeof context.conversation_id === "string" ? context.conversation_id : undefined,
      userId: typeof context.user_id === "string" ? context.user_id : undefined,
      traceId: normalizeTraceId(context.trace_id),
    },
    createdAt: now,
    updatedAt: now,
  };

  saveAppAdapterRun(run);
  const completedRun = await dispatchAppAdapterRun(agent, run);
  saveAppAdapterRun(completedRun);

  return Response.json({
    run_id: completedRun.runId,
    agent_id: completedRun.agentId,
    status: completedRun.status,
    status_url: `/app/runs/${completedRun.runId}`,
  });
}
