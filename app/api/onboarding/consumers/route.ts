import { listConsumers } from "@/lib/onboarding/consumer-registry";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = listConsumers();
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Consumer listing failed",
      },
      { status: 400 }
    );
  }
}
