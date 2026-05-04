import { buildBalanceSnapshotReport, createDevnetConnection } from "@/lib/economic-demo/balances";
import { buildEconomicDemoDryRunPlan, isEconomicDemoScenarioId } from "@/lib/economic-demo/dry-run";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scenario = url.searchParams.get("scenario") ?? "webpage";
  if (!isEconomicDemoScenarioId(scenario)) {
    return Response.json({ ok: false, error: "unknown_scenario" }, { status: 400 });
  }

  const plan = buildEconomicDemoDryRunPlan(scenario);
  const report = await buildBalanceSnapshotReport(plan, createDevnetConnection());
  return Response.json({ ok: true, report });
}
