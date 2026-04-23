/**
 * POST /api/planner/tools/resolve-attestor
 *
 * MCP tool: resolve_attestor
 * Find an attested specialist suitable to act as an attestor/judge.
 */
import { resolveAttestor } from "@/lib/onboarding/attestor-resolver";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await resolveAttestor({
      taskTypeHint: body.taskTypeHint,
      minAttestationAccuracy: body.minAttestationAccuracy,
      maxPerCallUsd: body.maxPerCallUsd,
    });

    return Response.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        candidate: null,
        alternatives: [],
        count: 0,
        error: error instanceof Error ? error.message : "resolve_attestor failed",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({
    tool: "resolve_attestor",
    description: "Find an attested specialist suitable for attestation/judge role.",
    schema: {
      input: {
        taskTypeHint: "string?",
        minAttestationAccuracy: "number?",
        maxPerCallUsd: "number?",
      },
    },
  });
}
