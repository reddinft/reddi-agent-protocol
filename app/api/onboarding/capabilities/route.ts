import { upsertCapabilities } from "@/lib/onboarding/capabilities";
import { listSpecialistIndex, upsertSpecialistIndex } from "@/lib/onboarding/specialist-index";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = listSpecialistIndex();
    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Specialist index read failed",
      },
      { status: 400 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const walletAddress = String(body.walletAddress || "");
    const result = upsertCapabilities(String(body.walletAddress || ""), {
      taskTypes: Array.isArray(body.taskTypes) ? body.taskTypes.map(String) : [],
      inputModes: Array.isArray(body.inputModes) ? body.inputModes.map(String) : [],
      outputModes: Array.isArray(body.outputModes) ? body.outputModes.map(String) : [],
      pricing: {
        baseUsd: Number(body.pricing?.baseUsd),
        perCallUsd:
          body.pricing?.perCallUsd === undefined ? undefined : Number(body.pricing.perCallUsd),
      },
      privacyModes: Array.isArray(body.privacyModes)
        ? body.privacyModes.map(String) as Array<"public" | "per" | "vanish">
        : [],
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
    });

    upsertSpecialistIndex(walletAddress, result.record.capabilities, {
      endpointUrl: typeof body.endpointUrl === "string" ? body.endpointUrl : undefined,
      healthcheckStatus:
        body.healthcheckStatus === "pass" ||
        body.healthcheckStatus === "fail" ||
        body.healthcheckStatus === "pending"
          ? body.healthcheckStatus
          : undefined,
      attested: typeof body.attested === "boolean" ? body.attested : undefined,
    });

    return Response.json({ ok: true, result });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Capability validation failed",
      },
      { status: 400 }
    );
  }
}
