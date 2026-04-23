import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CheckBody = {
  check?: string;
  model?: string;
};

export async function POST(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        ok: false,
        error: "Local checks only run in local development. Use a public tunnel URL (ngrok recommended, localtunnel fallback) from hosted environments.",
      },
      { status: 403 }
    );
  }

  const body = (await req.json().catch(() => null)) as CheckBody | null;
  const check = body?.check;
  const model = body?.model ?? "";

  if (check === "ollama") {
    try {
      const res = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      return NextResponse.json({ ok: res.ok });
    } catch {
      return NextResponse.json({ ok: false, error: "Ollama not running" });
    }
  }

  if (check === "model") {
    try {
      const res = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return NextResponse.json({ ok: false, models: [] });

      const data = await res.json().catch(() => null);
      const models: string[] = Array.isArray(data?.models)
        ? data.models.map((entry: { name?: string }) => entry?.name).filter((name: unknown): name is string => Boolean(name))
        : [];
      const target = model.replace(/:latest$/, "");
      const found = target.length > 0 && models.some((name) => name.replace(/:latest$/, "").startsWith(target));
      return NextResponse.json({ ok: found, models });
    } catch {
      return NextResponse.json({ ok: false, models: [], error: "Ollama not running" });
    }
  }

  return NextResponse.json({ ok: false, error: "Unknown check type" }, { status: 400 });
}
