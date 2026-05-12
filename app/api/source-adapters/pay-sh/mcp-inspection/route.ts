import { NextResponse } from "next/server";

import { inspectPayShMcpServerCard, type PayShMcpServerCard } from "@/lib/integrations/source-adapter/pay-sh-mcp-inspection";

const DEFAULT_PAY_SH_MCP_SERVER_CARD_URL = "https://pay.sh/.well-known/mcp/server-card.json";

export async function GET() {
  const response = await fetch(DEFAULT_PAY_SH_MCP_SERVER_CARD_URL, {
    headers: { accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        ok: false,
        mode: "metadata-only-mcp-inspection",
        error: `Pay.sh MCP server-card fetch failed: ${response.status} ${response.statusText}`,
        boundary:
          "Public metadata only. This endpoint does not run pay mcp, create wallets, top up funds, make paid calls, or store secrets.",
      },
      { status: 502 }
    );
  }

  const card = (await response.json()) as PayShMcpServerCard;
  return NextResponse.json({
    ...inspectPayShMcpServerCard(card),
    sourceUrl: DEFAULT_PAY_SH_MCP_SERVER_CARD_URL,
    boundary:
      "Public metadata only. This endpoint does not run pay mcp, create wallets, top up funds, make paid calls, or store secrets.",
  });
}
