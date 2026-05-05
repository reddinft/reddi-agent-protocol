import { PublicKey } from "@solana/web3.js";

import { IX } from "@/lib/program";
import { buildOnboardingAttestQualityInstruction } from "@/lib/onboarding/attestation-instruction";

describe("target-aware onboarding attest_quality instruction", () => {
  const programId = new PublicKey("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW");
  const judge = new PublicKey("11111111111111111111111111111112");
  const consumer = new PublicKey("11111111111111111111111111111113");
  const jobId = Uint8Array.from(Array.from({ length: 16 }, (_, i) => i + 1));
  const scores: [number, number, number, number, number] = [8, 8, 9, 9, 10];

  it("keeps Anchor attestation encoding in legacy mode", () => {
    const ix = buildOnboardingAttestQualityInstruction({ target: "legacy-anchor", programId, judge, consumer, jobId, scores });
    expect(ix.data.subarray(0, 8).equals(IX.attest_quality)).toBe(true);
  });

  it("uses Quasar one-byte attestation encoding in Quasar mode", () => {
    const ix = buildOnboardingAttestQualityInstruction({ target: "quasar", programId, judge, consumer, jobId, scores });
    expect(ix.data[0]).toBe(1);
    expect(ix.data.length).toBe(54);
    expect(ix.data.subarray(0, 8).equals(IX.attest_quality)).toBe(false);
  });
});
