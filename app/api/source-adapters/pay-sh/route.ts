import { NextResponse } from "next/server";

import { loadPayShCatalog } from "@/lib/integrations/source-adapter/pay-sh-catalog";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limitParam = url.searchParams.get("limit");
  const category = url.searchParams.get("category") ?? undefined;
  const q = url.searchParams.get("q") ?? undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  const catalog = loadPayShCatalog({
    limit: Number.isFinite(limit) ? limit : undefined,
    category,
    q,
  });

  const body = {
    ...catalog,
    mode: "dry-run-catalog",
    boundary:
      "Metadata-only Pay.sh catalog preview: RAP never creates a wallet, tops up, pays, or invokes Pay.sh services from this endpoint.",
  };

  if (!catalog.ok) {
    return NextResponse.json(body, { status: 404 });
  }

  return NextResponse.json(body);
}
