import { PublicKey, SystemProgram } from "@solana/web3.js";

import {
  QUASAR_INCINERATOR,
  buildQuasarDeregisterAgentInstruction,
  buildQuasarRegisterAgentInstruction,
  buildQuasarUpdateAgentInstruction,
  quasarAgentPda,
} from "@/lib/quasar/instructions";

describe("Quasar registry transaction-instruction helpers", () => {
  const programId = new PublicKey("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW");
  const owner = new PublicKey("11111111111111111111111111111112");

  it("derives the agent PDA using the selected Quasar program id", () => {
    const quasarPda = quasarAgentPda(owner, programId);
    const otherProgramPda = quasarAgentPda(owner, SystemProgram.programId);
    expect(quasarPda.toBase58()).not.toBe(otherProgramPda.toBase58());
  });

  it("builds register_agent with Quasar account order and data", () => {
    const agent = quasarAgentPda(owner, programId);
    const ix = buildQuasarRegisterAgentInstruction({
      programId,
      owner,
      agentType: 2,
      model: "qwen3:8b",
      rateLamports: 1_000_000n,
      minReputation: 3,
    });

    expect(ix.programId.toBase58()).toBe(programId.toBase58());
    expect(ix.keys.map((key) => key.pubkey.toBase58())).toEqual([
      agent.toBase58(),
      owner.toBase58(),
      QUASAR_INCINERATOR.toBase58(),
      SystemProgram.programId.toBase58(),
    ]);
    expect(ix.keys.map((key) => [key.isSigner, key.isWritable])).toEqual([
      [false, true],
      [true, true],
      [false, true],
      [false, false],
    ]);
    expect(ix.data[0]).toBe(0);
    expect(ix.data.length).toBe(76);
  });

  it("builds update_agent with Quasar account order and data", () => {
    const agent = quasarAgentPda(owner, programId);
    const ix = buildQuasarUpdateAgentInstruction({
      programId,
      owner,
      rateLamports: 2_000_000n,
      minReputation: 4,
      active: true,
    });

    expect(ix.keys.map((key) => key.pubkey.toBase58())).toEqual([agent.toBase58(), owner.toBase58()]);
    expect(ix.keys.map((key) => [key.isSigner, key.isWritable])).toEqual([[false, true], [true, false]]);
    expect([...ix.data]).toEqual([1, 0x80, 0x84, 0x1e, 0, 0, 0, 0, 0, 4, 1]);
  });

  it("builds deregister_agent with Quasar account order and data", () => {
    const agent = quasarAgentPda(owner, programId);
    const ix = buildQuasarDeregisterAgentInstruction({ programId, owner });

    expect(ix.keys.map((key) => key.pubkey.toBase58())).toEqual([agent.toBase58(), owner.toBase58()]);
    expect(ix.keys.map((key) => [key.isSigner, key.isWritable])).toEqual([[false, true], [true, true]]);
    expect([...ix.data]).toEqual([2]);
  });
});
