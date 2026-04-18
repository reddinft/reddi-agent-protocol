import { listPlannerRuns } from "@/lib/onboarding/planner-execution"

export const runtime = "nodejs"

export async function GET() {
  try {
    return Response.json({ ok: true, result: listPlannerRuns() })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Planner run listing failed" },
      { status: 400 }
    )
  }
}
