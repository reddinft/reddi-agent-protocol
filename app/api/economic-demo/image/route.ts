import { generateEconomicDemoImage, imageAdapterReadiness, type ImageProvider } from "@/lib/economic-demo/image-adapter";

function isProvider(value: unknown): value is ImageProvider {
  return value === "openai" || value === "fal";
}

export async function GET() {
  return Response.json({ ok: true, readiness: imageAdapterReadiness() });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { prompt?: unknown; provider?: unknown };
    if (typeof body.prompt !== "string" || !body.prompt.trim()) {
      return Response.json({ ok: false, error: "prompt_required" }, { status: 400 });
    }
    const result = await generateEconomicDemoImage({
      prompt: body.prompt,
      provider: isProvider(body.provider) ? body.provider : undefined,
    });
    return Response.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message === "image_generation_disabled" ? 403 : 502;
    return Response.json({ ok: false, error: message, readiness: imageAdapterReadiness() }, { status });
  }
}
