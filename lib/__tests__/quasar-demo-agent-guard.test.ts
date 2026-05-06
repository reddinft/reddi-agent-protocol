import { readFileSync } from "fs";
import { join } from "path";

describe("Quasar demo-agent guard", () => {
  it("fails closed when the legacy full-flow demo is selected as Quasar proof", () => {
    const source = readFileSync(join(process.cwd(), "packages/demo-agents/src/demo.ts"), "utf8");

    expect(source).toContain("DEMO_PROGRAM_TARGET === \"quasar\"");
    expect(source).toContain("is a legacy Anchor full-flow/PER demo and is not a Quasar submission proof");
    expect(source).toContain("DEMO_PROGRAM_TARGET=legacy-anchor");
  });
});
