import { NextResponse } from "next/server";

import { getEconomicDemoPaymentReadiness } from "@/lib/economic-demo/payment-readiness";

export function GET() {
  return NextResponse.json({ ok: true, readiness: getEconomicDemoPaymentReadiness() });
}
