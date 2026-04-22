import { checkOperatorKeyStatus } from "@/lib/onboarding/operator-key";
import { getOnchainAttestationOperatorStatus } from "@/lib/onboarding/onchain-attestation";

export const runtime = "nodejs";

const ENV_TEMPLATE = 'ONBOARDING_ATTEST_OPERATOR_SECRET_KEY="[12,34,...,64 bytes total]"';

export async function GET() {
  const keyStatus = checkOperatorKeyStatus();
  const onchainStatus = getOnchainAttestationOperatorStatus();

  const state = keyStatus.state;
  const nextAction =
    state === "ready"
      ? "Rotation check optional. Re-run status before recording attestation if this tab has been open for a while."
      : "Set ONBOARDING_ATTEST_OPERATOR_SECRET_KEY as a 64-byte JSON array, restart the app, then run this check again.";

  return Response.json({
    ok: true,
    result: {
      ready: state === "ready" && onchainStatus.ready,
      state,
      operatorPubkey: onchainStatus.operatorPubkey,
      note: onchainStatus.note,
      error: keyStatus.error,
      checkedAt: keyStatus.checkedAt,
      envTemplate: ENV_TEMPLATE,
      nextAction,
    },
  });
}
