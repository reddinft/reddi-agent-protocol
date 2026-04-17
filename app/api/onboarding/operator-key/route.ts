import { NextResponse } from "next/server";
import { checkOperatorKeyStatus } from "@/lib/onboarding/operator-key";

export const runtime = "nodejs";

export async function GET() {
  const status = checkOperatorKeyStatus();
  return NextResponse.json({ ok: true, result: status });
}
