import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

import {
  buildQuasarAttestQualityData,
  buildQuasarDeregisterAgentData,
  buildQuasarRegisterData,
  buildQuasarUpdateAgentData,
} from "@/lib/quasar/instruction-builders";

export const QUASAR_AGENT_SEED = Buffer.from("agent");
export const QUASAR_ATTESTATION_SEED = Buffer.from("attestation");
export const QUASAR_INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");

export function quasarAgentPda(owner: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([QUASAR_AGENT_SEED, owner.toBytes()], programId)[0];
}

export function quasarAttestationPda(jobId: Uint8Array, programId: PublicKey): PublicKey {
  if (jobId.length !== 16) throw new Error("job_id_must_be_16_bytes");
  return PublicKey.findProgramAddressSync([QUASAR_ATTESTATION_SEED, Buffer.from(jobId)], programId)[0];
}

export function buildQuasarRegisterAgentInstruction(input: {
  programId: PublicKey;
  owner: PublicKey;
  agentType: number;
  model: string;
  rateLamports: bigint;
  minReputation: number;
  agentPda?: PublicKey;
  feeCollector?: PublicKey;
}): TransactionInstruction {
  const agent = input.agentPda ?? quasarAgentPda(input.owner, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: agent, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: true, isWritable: true },
      { pubkey: input.feeCollector ?? QUASAR_INCINERATOR, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildQuasarRegisterData(input.agentType, input.model, input.rateLamports, input.minReputation),
  });
}

export function buildQuasarUpdateAgentInstruction(input: {
  programId: PublicKey;
  owner: PublicKey;
  rateLamports: bigint;
  minReputation: number;
  active: boolean;
  agentPda?: PublicKey;
}): TransactionInstruction {
  const agent = input.agentPda ?? quasarAgentPda(input.owner, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: agent, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: true, isWritable: false },
    ],
    data: buildQuasarUpdateAgentData(input.rateLamports, input.minReputation, input.active),
  });
}

export function buildQuasarDeregisterAgentInstruction(input: {
  programId: PublicKey;
  owner: PublicKey;
  agentPda?: PublicKey;
}): TransactionInstruction {
  const agent = input.agentPda ?? quasarAgentPda(input.owner, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: agent, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: true, isWritable: true },
    ],
    data: buildQuasarDeregisterAgentData(),
  });
}

export function buildQuasarAttestQualityInstruction(input: {
  programId: PublicKey;
  judge: PublicKey;
  jobId: Uint8Array;
  scores: Uint8Array;
  consumer: PublicKey;
  attestationPda?: PublicKey;
  judgeAgentPda?: PublicKey;
}): TransactionInstruction {
  const attestation = input.attestationPda ?? quasarAttestationPda(input.jobId, input.programId);
  const judgeAgent = input.judgeAgentPda ?? quasarAgentPda(input.judge, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: attestation, isSigner: false, isWritable: true },
      { pubkey: judgeAgent, isSigner: false, isWritable: false },
      { pubkey: input.judge, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildQuasarAttestQualityData(input.jobId, input.scores, input.consumer.toBytes()),
  });
}
