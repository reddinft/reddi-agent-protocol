import { NextResponse } from "next/server";

import { buildPayShQuotePreview } from "@/lib/integrations/source-adapter/pay-sh-quote-preview";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const candidateId = url.searchParams.get("candidateId") ?? "";
  const task = url.searchParams.get("task") ?? undefined;

  if (!candidateId) {
    return NextResponse.json(
      {
        ok: false,
        mode: "dry-run-quote-preview",
        error: "candidateId is required",
      },
      { status: 400 }
    );
  }

  const preview = buildPayShQuotePreview({ candidateId, task });
  return NextResponse.json(preview, { status: preview.ok ? 200 : 404 });
}
