import { Keypair, PublicKey } from "@solana/web3.js";

import {
  buildDemoDeregisterAgentInstruction,
  encodeDemoDeregisterAgent,
} from "@/packages/demo-agents/src/registration-instruction";

const programId = new PublicKey("VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW");

describe("demo-agent target-aware registration helpers", () => {
  it("encodes Quasar deregister with the one-byte discriminator", () => {
    expect([...encodeDemoDeregisterAgent("quasar")]).toEqual([2]);
  });

  it("keeps Anchor deregister as the legacy 8-byte discriminator", () => {
    expect(encodeDemoDeregisterAgent("legacy-anchor").length).toBe(8);
    expect([...encodeDemoDeregisterAgent("legacy-anchor")]).not.toEqual([2]);
  });

  it("builds target-aware Quasar deregister account metas", () => {
    const owner = Keypair.generate().publicKey;
    const ix = buildDemoDeregisterAgentInstruction({ target: "quasar", programId, owner });

    expect(ix.programId.toBase58()).toBe(programId.toBase58());
    expect([...ix.data]).toEqual([2]);
    expect(ix.keys).toHaveLength(2);
    expect(ix.keys[0]).toMatchObject({ isSigner: false, isWritable: true });
    expect(ix.keys[1]).toMatchObject({ pubkey: owner, isSigner: true, isWritable: true });
  });
});
