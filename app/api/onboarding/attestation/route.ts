import { recordAttestation } from "@/lib/onboarding/attestation";
import { submitOnchainOnboardingAttestation } from "@/lib/onboarding/onchain-attestation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const healthcheckStatus = body.healthcheckStatus;
    if (healthcheckStatus !== "pass") {
      throw new Error("Attestation is blocked until healthcheck passes.");
    }

    const onchain = await submitOnchainOnboardingAttestation({
      walletAddress: String(body.walletAddress || ""),
      consumerWalletAddress:
        typeof body.consumerWalletAddress === "string" ? body.consumerWalletAddress : undefined,
      scores: Array.isArray(body.scores) && body.scores.length === 5
        ? [
            Number(body.scores[0]),
            Number(body.scores[1]),
            Number(body.scores[2]),
            Number(body.scores[3]),
            Number(body.scores[4]),
          ]
        : undefined,
    });

    const audit = recordAttestation({
      walletAddress: String(body.walletAddress || ""),
      endpointUrl: String(body.endpointUrl || ""),
      healthcheckStatus,
      operator: String(body.operator || "wizard-operator"),
    });

    return Response.json({
      ok: true,
      result: {
        note: "On-chain attestation submitted and audit trail recorded.",
        onchain,
        audit,
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Attestation failed",
      },
      { status: 400 }
    );
  }
}
