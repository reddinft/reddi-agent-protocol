import { PublicKey } from "@solana/web3.js";

import { IX } from "@/lib/program";
import { buildAgentRegistrationInstruction } from "@/lib/register/registration-instruction";

describe("target-aware agent registration instruction", () => {
  const owner = new PublicKey("11111111111111111111111111111112");
  const anchorProgramId = new PublicKey("794nTFNyJknzDrR13ApSfVyNCRvcvnCN3BVDfic8dcZD");
  const quasarProgramId = new PublicKey("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW");

  it("uses Anchor registration data for the legacy target", () => {
    const ix = buildAgentRegistrationInstruction({
      target: "legacy-anchor",
      programId: anchorProgramId,
      owner,
      agentType: 0,
      model: "qwen3:8b",
      rateLamports: 1_000_000n,
      minReputation: 3,
    });

    expect(ix.programId.toBase58()).toBe(anchorProgramId.toBase58());
    expect(ix.data.subarray(0, 8).equals(IX.register_agent)).toBe(true);
  });

  it("uses Quasar one-byte registration data for the Quasar target", () => {
    const ix = buildAgentRegistrationInstruction({
      target: "quasar",
      programId: quasarProgramId,
      owner,
      agentType: 0,
      model: "qwen3:8b",
      rateLamports: 1_000_000n,
      minReputation: 3,
    });

    expect(ix.programId.toBase58()).toBe(quasarProgramId.toBase58());
    expect(ix.data[0]).toBe(0);
    expect(ix.data.length).toBe(76);
    expect(ix.data.subarray(0, 8).equals(IX.register_agent)).toBe(false);
  });
});
