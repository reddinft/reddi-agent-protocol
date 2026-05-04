import { buildResearchWorkflowDesign } from "@/lib/economic-demo/research-workflow-design";

export async function GET() {
  return Response.json({ ok: true, design: buildResearchWorkflowDesign() });
}
