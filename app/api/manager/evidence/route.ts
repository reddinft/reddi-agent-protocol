import { buildManagerEvidencePack } from "@/lib/manager/evidence-pack";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ ok: true, result: buildManagerEvidencePack() });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Evidence pack failed" },
      { status: 500 }
    );
  }
}
