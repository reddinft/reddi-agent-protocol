import { runRuntimeBootstrap } from "@/lib/onboarding/runtime-bootstrap";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await runRuntimeBootstrap({
      platform: body.platform,
      port: Number(body.port),
      consentExposeEndpoint: Boolean(body.consentExposeEndpoint),
      consentProtocolOps: Boolean(body.consentProtocolOps),
      protocolDomain: typeof body.protocolDomain === "string" ? body.protocolDomain : undefined,
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Runtime bootstrap failed",
      },
      { status: 400 }
    );
  }
}

