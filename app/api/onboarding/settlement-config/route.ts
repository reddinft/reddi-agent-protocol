import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiBase = process.env.JUPITER_API_BASE?.trim() || "https://api.jup.ag";
  const slippage = Number(process.env.JUPITER_SLIPPAGE_BPS ?? 50);

  return NextResponse.json({
    jupiter_enabled: Boolean(apiBase),
    api_base: apiBase,
    slippage_bps: Number.isFinite(slippage) ? slippage : 50,
  });
}
