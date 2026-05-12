import { loadCircleX402Catalog } from "@/lib/integrations/source-adapter/circle-x402-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get("limit") ?? 50);
  const category = searchParams.get("category") ?? undefined;
  const catalog = loadCircleX402Catalog({ limit, category });

  const status = catalog.ok ? 200 : 404;
  return Response.json(
    {
      ...catalog,
      mode: "dry-run-catalog",
      boundary: "Circle x402 resources are externally listed and not RAP-attested until RAP verifies receipts/evidence through attestors. This endpoint never pays or invokes services.",
    },
    { status }
  );
}
