import { getManagerReadiness } from "@/lib/manager/readiness";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await getManagerReadiness();
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Manager readiness failed" },
      { status: 500 }
    );
  }
}
