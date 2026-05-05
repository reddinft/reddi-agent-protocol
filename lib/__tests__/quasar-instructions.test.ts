import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";

import {
  buildQuasarCommitRatingInstruction,
  buildQuasarConfirmAttestationInstruction,
  buildQuasarDisputeAttestationInstruction,
  buildQuasarRegisterAgentInstruction,
  buildQuasarRevealRatingInstruction,
  quasarAgentPda,
  quasarAttestationPda,
  quasarRatingPda,
} from "@/lib/quasar/instructions";

const programId = new PublicKey("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW");
const jobId = Uint8Array.from(Array.from({ length: 16 }, (_, i) => i + 1));

describe("Quasar instruction wrappers", () => {
  it("builds registration with Quasar account order and one-byte discriminator", () => {
    const owner = Keypair.generate().publicKey;
    const ix = buildQuasarRegisterAgentInstruction({
      programId,
      owner,
      agentType: 0,
      model: "ollama-local",
      rateLamports: 1_000_000n,
      minReputation: 0,
    });

    expect(ix.programId.toBase58()).toBe(programId.toBase58());
    expect([...ix.data.subarray(0, 3)]).toEqual([0, 0, "ollama-local".length]);
    expect(ix.data.length).toBe(76);
    expect(ix.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
      [quasarAgentPda(owner, programId).toBase58(), false, true],
      [owner.toBase58(), true, true],
      ["1nc1nerator11111111111111111111111111111111", false, true],
      [SystemProgram.programId.toBase58(), false, false],
    ]);
  });

  it("builds reputation commit/reveal with Quasar discriminators and account metas", () => {
    const consumer = Keypair.generate().publicKey;
    const specialist = Keypair.generate().publicKey;
    const commitment = Uint8Array.from(Array(32).fill(7));
    const salt = Uint8Array.from(Array(32).fill(9));

    const commitIx = buildQuasarCommitRatingInstruction({
      programId,
      signer: consumer,
      jobId,
      commitment,
      role: 0,
      consumer,
      specialist,
    });
    expect(commitIx.data[0]).toBe(1);
    expect(commitIx.data.length).toBe(114);
    expect(commitIx.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
      [quasarRatingPda(jobId, programId).toBase58(), false, true],
      [consumer.toBase58(), true, true],
      [SystemProgram.programId.toBase58(), false, false],
    ]);

    const specialistAgent = quasarAgentPda(specialist, programId);
    const consumerAgent = quasarAgentPda(consumer, programId);
    const revealIx = buildQuasarRevealRatingInstruction({
      programId,
      signer: consumer,
      jobId,
      score: 8,
      salt,
      specialistAgentPda: specialistAgent,
      consumerAgentPda: consumerAgent,
    });
    expect(revealIx.data[0]).toBe(2);
    expect(revealIx.data.length).toBe(50);
    expect(revealIx.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
      [quasarRatingPda(jobId, programId).toBase58(), false, true],
      [consumer.toBase58(), true, false],
      [specialistAgent.toBase58(), false, true],
      [consumerAgent.toBase58(), false, true],
    ]);
  });

  it("builds attestation confirm/dispute with Quasar discriminators", () => {
    const consumer = Keypair.generate().publicKey;
    const judge = Keypair.generate().publicKey;
    const attestation = quasarAttestationPda(jobId, programId);
    const judgeAgent = quasarAgentPda(judge, programId);

    const confirmIx = buildQuasarConfirmAttestationInstruction({ programId, consumer, judge, jobId });
    const disputeIx = buildQuasarDisputeAttestationInstruction({ programId, consumer, judge, jobId });

    for (const [ix, disc] of [[confirmIx, 2], [disputeIx, 3]] as const) {
      expect(ix.data[0]).toBe(disc);
      expect(ix.data.length).toBe(17);
      expect(ix.keys.map((k) => [k.pubkey.toBase58(), k.isSigner, k.isWritable])).toEqual([
        [attestation.toBase58(), false, true],
        [judgeAgent.toBase58(), false, true],
        [consumer.toBase58(), true, false],
      ]);
    }
  });
});
