import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeEndpoint(endpoint: string) {
  const raw = endpoint.trim();
  if (!raw) throw new Error("Endpoint URL is required.");
  try {
    return raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(`https://${raw}`);
  } catch {
    throw new Error("Invalid endpoint URL.");
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json({ ok: false, status: "invalid_url" }, { status: 400 });
  }

  try {
    const url = normalizeEndpoint(endpoint);

    const tagsRes = await fetch(`${url.origin}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (tagsRes.ok) {
      const body = await tagsRes.json().catch(() => null);
      const hasModels = body?.models && Array.isArray(body.models);
      return NextResponse.json({
        ok: true,
        status: hasModels ? "ollama_detected" : "reachable",
        models: hasModels ? body.models.map((m: { name?: string }) => m.name).filter(Boolean) : [],
      });
    }

    const healthRes = await fetch(`${url.origin}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });

    return NextResponse.json({
      ok: healthRes.ok,
      status: healthRes.ok ? "reachable" : "unhealthy",
      models: [],
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        status: "unreachable",
        error: error instanceof Error ? error.message : "Connection failed",
      },
      { status: 200 }
    );
  }
}
