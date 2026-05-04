import { NextRequest, NextResponse } from "next/server";

import { buildEconomicDemoDryRunPlan, isEconomicDemoScenarioId } from "@/lib/economic-demo/dry-run";
import { buildSurfpoolRehearsalReport } from "@/lib/economic-demo/surfpool-rehearsal";

export function GET(req: NextRequest) {
  const scenario = req.nextUrl.searchParams.get("scenario") ?? "webpage";
  if (!isEconomicDemoScenarioId(scenario)) {
    return NextResponse.json({ ok: false, error: "unknown_scenario" }, { status: 400 });
  }

  const plan = buildEconomicDemoDryRunPlan(scenario);
  const report = buildSurfpoolRehearsalReport(plan);
  return NextResponse.json({ ok: true, report });
}
