import { getOnchainAttestationOperatorStatus } from "@/lib/onboarding/onchain-attestation";

export const runtime = "nodejs";

export async function GET() {
  const status = getOnchainAttestationOperatorStatus();
  return Response.json({ ok: true, result: status });
}
