import { routePlannerPolicy } from "@/lib/onboarding/planner-router";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = routePlannerPolicy({
      requiredPrivacyMode:
        body.requiredPrivacyMode === "public" ||
        body.requiredPrivacyMode === "per" ||
        body.requiredPrivacyMode === "vanish"
          ? body.requiredPrivacyMode
          : undefined,
      requiresAttested: Boolean(body.requiresAttested),
      requiresHealthPass: body.requiresHealthPass !== false,
      maxPerCallUsd:
        body.maxPerCallUsd === undefined ? undefined : Number(body.maxPerCallUsd),
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Planner routing failed",
      },
      { status: 400 }
    );
  }
}
