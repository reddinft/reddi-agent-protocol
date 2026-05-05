import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";

import {
  AGENT_SEED,
  INCINERATOR,
  buildRegisterAgentData,
  type ProgramTarget,
} from "@/lib/program";
import { buildQuasarRegisterAgentInstruction } from "@/lib/quasar/instructions";

export function registrationAgentPda(owner: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([AGENT_SEED, owner.toBytes()], programId)[0];
}

export function buildAgentRegistrationInstruction(input: {
  target: ProgramTarget;
  programId: PublicKey;
  owner: PublicKey;
  agentType: number;
  model: string;
  rateLamports: bigint;
  minReputation: number;
}): TransactionInstruction {
  if (input.target === "quasar") {
    return buildQuasarRegisterAgentInstruction({
      programId: input.programId,
      owner: input.owner,
      agentType: input.agentType,
      model: input.model,
      rateLamports: input.rateLamports,
      minReputation: input.minReputation,
    });
  }

  const agent = registrationAgentPda(input.owner, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: agent, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: true, isWritable: true },
      { pubkey: INCINERATOR, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: buildRegisterAgentData(input.agentType, input.model, input.rateLamports, input.minReputation),
  });
}
