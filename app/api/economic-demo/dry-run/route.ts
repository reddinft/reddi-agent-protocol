import { buildEconomicDemoDryRunPlan, isEconomicDemoScenarioId } from "@/lib/economic-demo/dry-run";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scenario = url.searchParams.get("scenario") ?? "webpage";
  if (!isEconomicDemoScenarioId(scenario)) {
    return Response.json({ ok: false, error: "unknown_scenario" }, { status: 400 });
  }
  return Response.json({ ok: true, plan: buildEconomicDemoDryRunPlan(scenario) });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { scenario?: unknown };
  if (!isEconomicDemoScenarioId(body.scenario)) {
    return Response.json({ ok: false, error: "unknown_scenario" }, { status: 400 });
  }
  return Response.json({ ok: true, plan: buildEconomicDemoDryRunPlan(body.scenario) });
}
