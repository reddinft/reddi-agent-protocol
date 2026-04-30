import { buildAppAdapterAgentList } from "@/lib/app-adapter/manifest";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, agents: buildAppAdapterAgentList() });
}
