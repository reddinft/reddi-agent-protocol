import { NextResponse } from "next/server";
import { probeRuntimeEndpoint, type RuntimeTarget } from "@/lib/onboarding/runtime-probe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint;
  const runtimeTarget = (body?.runtimeTarget ?? "auto") as RuntimeTarget;

  if (!endpoint || typeof endpoint !== "string") {
    return NextResponse.json({ ok: false, status: "invalid_url" }, { status: 400 });
  }

  const result = await probeRuntimeEndpoint(endpoint, runtimeTarget);

  const legacyStatus =
    result.status === "runtime_detected" && result.detectedRuntime === "ollama"
      ? "ollama_detected"
      : result.status === "runtime_detected"
        ? "reachable"
        : result.status;

  return NextResponse.json(
    {
      ok: result.ok,
      // legacy compatibility for existing UI surfaces
      status: legacyStatus,
      // normalized runtime-aware fields
      runtimeStatus: result.status,
      detectedRuntime: result.detectedRuntime,
      models: result.models,
      hints: result.hints,
      error: result.error,
    },
    { status: result.status === "invalid_url" ? 400 : 200 }
  );
}
