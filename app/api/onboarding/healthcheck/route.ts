import { runSpecialistHealthcheck } from "@/lib/onboarding/healthcheck";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await runSpecialistHealthcheck({
      endpointUrl: String(body.endpointUrl || ""),
      walletAddress: String(body.walletAddress || ""),
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Healthcheck failed",
      },
      { status: 400 }
    );
  }
}
