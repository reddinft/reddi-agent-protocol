import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/torque/client";

export async function GET() {
  const entries = await getLeaderboard();
  return NextResponse.json({ entries });
}

