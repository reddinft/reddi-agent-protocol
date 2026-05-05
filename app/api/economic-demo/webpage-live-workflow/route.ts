import { getWebpageLiveWorkflowEvidence } from "@/lib/economic-demo/webpage-live-workflow-evidence-server";

export async function GET() {
  return Response.json({ ok: true, evidence: getWebpageLiveWorkflowEvidence() });
}
