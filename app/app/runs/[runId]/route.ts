import { getAppAdapterRun } from "@/lib/app-adapter/store";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ runId: string }> | { runId: string };
};

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const run = getAppAdapterRun(params.runId);

  if (!run) {
    return Response.json({ ok: false, error: "Unknown APP adapter run", run_id: params.runId }, { status: 404 });
  }

  return Response.json({ ok: true, ...run });
}
