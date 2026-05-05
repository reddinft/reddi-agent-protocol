import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

import {
  ATTESTATION_SEED,
  buildAttestQualityData,
} from "@/lib/program";
import { buildQuasarAttestQualityInstruction, quasarAgentPda } from "@/lib/quasar/instructions";
import type { ProgramTarget as NetworkProgramTarget } from "@/lib/config/network";

export function onboardingAttestationPda(jobId: Uint8Array, programId: PublicKey): PublicKey {
  if (jobId.length !== 16) throw new Error("job_id_must_be_16_bytes");
  return PublicKey.findProgramAddressSync([ATTESTATION_SEED, Buffer.from(jobId)], programId)[0];
}

export function buildOnboardingAttestQualityInstruction(input: {
  target: NetworkProgramTarget;
  programId: PublicKey;
  jobId: Uint8Array;
  scores: [number, number, number, number, number];
  consumer: PublicKey;
  judge: PublicKey;
}): TransactionInstruction {
  const attestation = onboardingAttestationPda(input.jobId, input.programId);
  const judgeAgent = quasarAgentPda(input.judge, input.programId);

  if (input.target === "quasar") {
    return buildQuasarAttestQualityInstruction({
      programId: input.programId,
      judge: input.judge,
      jobId: input.jobId,
      scores: Uint8Array.from(input.scores),
      consumer: input.consumer,
      attestationPda: attestation,
      judgeAgentPda: judgeAgent,
    });
  }

  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: attestation, isSigner: false, isWritable: true },
      { pubkey: judgeAgent, isSigner: false, isWritable: false },
      { pubkey: input.judge, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildAttestQualityData(input.jobId, input.scores, input.consumer),
  });
}
