import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

async function latestRunDir() {
  const root = join(process.cwd(), "artifacts", "economic-demo-z-picture");
  const entries = await readdir(root, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("z-picture-")).map((entry) => entry.name).sort();
  if (!dirs.length) throw new Error("no_z_picture_runs");
  return join(root, dirs.at(-1)!);
}

export async function GET() {
  const dir = await latestRunDir();
  const summary = JSON.parse(await readFile(join(dir, "summary.json"), "utf8"));
  const imageB64 = await readFile(join(dir, "z-image.png"), "base64");
  return Response.json({ ok: true, summary, imageUrl: `data:image/png;base64,${imageB64}` });
}
