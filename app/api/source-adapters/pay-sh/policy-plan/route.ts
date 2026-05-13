import { NextResponse } from "next/server";

import { buildPayShPolicyPlan, type PayShPolicyPlanInput } from "@/lib/integrations/source-adapter/pay-sh-policy-plan";

export async function POST(req: Request) {
  let body: Partial<PayShPolicyPlanInput>;
  try {
    body = (await req.json()) as Partial<PayShPolicyPlanInput>;
  } catch {
    return NextResponse.json(
      { ok: false, mode: "dry-run-paid-call-policy-plan", error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.candidateId || !body.task) {
    return NextResponse.json(
      {
        ok: false,
        mode: "dry-run-paid-call-policy-plan",
        error: "candidateId and task are required",
      },
      { status: 400 }
    );
  }

  const plan = buildPayShPolicyPlan({
    candidateId: body.candidateId,
    task: body.task,
    environment: body.environment,
    endpointUrl: body.endpointUrl,
    toolName: body.toolName,
    estimatedUsd: body.estimatedUsd,
    spendCapUsd: body.spendCapUsd,
    userApprovedLivePayment: body.userApprovedLivePayment,
    allowlistedEndpoints: body.allowlistedEndpoints,
    requireReceiptCapture: body.requireReceiptCapture,
    requireAttestation: body.requireAttestation,
  });

  return NextResponse.json(plan, { status: plan.ok ? 200 : 404 });
}
