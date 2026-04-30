import { findAppAdapterAgent } from "@/lib/app-adapter/registry";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ agentId: string }> | { agentId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const agent = findAppAdapterAgent(params.agentId);

  if (!agent) {
    return Response.json({ ok: false, error: "Unknown APP adapter agent" }, { status: 404 });
  }

  return Response.json({ ok: true, agent_id: agent.appAgentId, schema: agent.inputSchema });
}
