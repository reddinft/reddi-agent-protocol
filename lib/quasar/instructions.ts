import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

import {
  buildQuasarDeregisterAgentData,
  buildQuasarRegisterData,
  buildQuasarUpdateAgentData,
} from "@/lib/quasar/instruction-builders";

export const QUASAR_AGENT_SEED = Buffer.from("agent");
export const QUASAR_INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");

export function quasarAgentPda(owner: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([QUASAR_AGENT_SEED, owner.toBytes()], programId)[0];
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
