import { buildPictureStoryboardDesign } from "@/lib/economic-demo/picture-storyboard-design";

export async function GET() {
  return Response.json({ ok: true, design: buildPictureStoryboardDesign() });
}
