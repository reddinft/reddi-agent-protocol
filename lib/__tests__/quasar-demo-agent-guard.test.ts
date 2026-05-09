import { readFileSync } from "fs";
import { join } from "path";

describe("Quasar demo-agent guard", () => {
  it("fails closed when the legacy full-flow demo is selected as Quasar proof", () => {
    const source = readFileSync(join(process.cwd(), "packages/demo-agents/src/demo.ts"), "utf8");

    expect(source).toContain("PROGRAM_TARGET === \"quasar\" && requestedSettlementMode === \"magicblock_per\"");
    expect(source).toContain("MagicBlock PER/TEE is not claimed for the Quasar final demo path yet.");
    expect(source).toContain("Use DEMO_SETTLEMENT_MODE=public for the Quasar-native escrow/reputation/attestation demo");
  });
});
