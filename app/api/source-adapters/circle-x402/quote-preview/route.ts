import { buildCircleX402QuotePreview } from "@/lib/integrations/source-adapter/circle-x402-quote-preview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { candidateId?: string; task?: string };
    const candidateId = body.candidateId?.trim();

    if (!candidateId) {
      return Response.json(
        { ok: false, mode: "dry-run-quote-preview", error: "candidateId is required" },
        { status: 400 }
      );
    }

    const preview = buildCircleX402QuotePreview({ candidateId, task: body.task });
    return Response.json(preview, { status: preview.ok ? 200 : 404 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        mode: "dry-run-quote-preview",
        error: error instanceof Error ? error.message : "Circle x402 quote preview failed",
      },
      { status: 500 }
    );
  }
}
