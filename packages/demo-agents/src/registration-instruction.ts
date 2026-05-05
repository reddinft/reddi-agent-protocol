import { PublicKey, SystemProgram, TransactionInstruction } from "@solana/web3.js";
import crypto from "crypto";

import { buildQuasarRegisterData } from "../../../lib/quasar/instruction-builders";
import { AGENT_SEED, PROGRAM_TARGET, type DemoProgramTarget } from "./config";

const INCINERATOR = new PublicKey("1nc1nerator11111111111111111111111111111111");

function disc(ixName: string): Buffer {
  return crypto.createHash("sha256").update(`global:${ixName}`).digest().subarray(0, 8);
}

export function demoAgentPda(owner: PublicKey, programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([AGENT_SEED, owner.toBytes()], programId)[0];
}

export function encodeAnchorRegisterAgent(agentType: number, model: string, rateLamports: bigint, minReputation: number): Buffer {
  const modelBytes = Buffer.from(model, "utf8");
  const buf = Buffer.alloc(8 + 1 + 4 + modelBytes.length + 8 + 1);
  let offset = 0;
  disc("register_agent").copy(buf, offset); offset += 8;
  buf.writeUInt8(agentType, offset); offset += 1;
  buf.writeUInt32LE(modelBytes.length, offset); offset += 4;
  modelBytes.copy(buf, offset); offset += modelBytes.length;
  buf.writeBigUInt64LE(rateLamports, offset); offset += 8;
  buf.writeUInt8(minReputation, offset);
  return buf;
}

export function encodeDemoRegisterAgent(
  target: DemoProgramTarget,
  agentType: number,
  model: string,
  rateLamports: bigint,
  minReputation: number,
): Buffer {
  return target === "quasar"
    ? buildQuasarRegisterData(agentType, model, rateLamports, minReputation)
    : encodeAnchorRegisterAgent(agentType, model, rateLamports, minReputation);
}

export function buildDemoRegisterAgentInstruction(input: {
  target?: DemoProgramTarget;
  programId: PublicKey;
  owner: PublicKey;
  agentType: number;
  model: string;
  rateLamports: bigint;
  minReputation: number;
}): TransactionInstruction {
  const agentPk = demoAgentPda(input.owner, input.programId);
  return new TransactionInstruction({
    programId: input.programId,
    keys: [
      { pubkey: agentPk, isSigner: false, isWritable: true },
      { pubkey: input.owner, isSigner: true, isWritable: true },
      { pubkey: INCINERATOR, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeDemoRegisterAgent(
      input.target ?? PROGRAM_TARGET,
      input.agentType,
      input.model,
      input.rateLamports,
      input.minReputation,
    ),
  });
}
