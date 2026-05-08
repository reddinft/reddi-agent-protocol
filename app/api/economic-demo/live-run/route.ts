import {
  buildEconomicDemoLiveRun,
  type EconomicDemoLiveRunRequest,
} from "@/lib/economic-demo/live-run";

export async function POST(request: Request) {
  let payload: EconomicDemoLiveRunRequest = {};

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      payload = (await request.json()) as EconomicDemoLiveRunRequest;
    }
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (payload.mode && payload.mode !== "controlled_hosted_evidence") {
    return Response.json(
      { ok: false, error: "unsupported_live_run_mode" },
      { status: 400 },
    );
  }

  return Response.json({ ok: true, run: buildEconomicDemoLiveRun(payload) });
}
