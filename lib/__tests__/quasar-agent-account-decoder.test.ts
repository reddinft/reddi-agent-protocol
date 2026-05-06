import { Keypair, PublicKey } from "@solana/web3.js";

function writeU64LE(target: Buffer, offset: number, value: bigint) {
  target.writeBigUInt64LE(value, offset);
}

function buildQuasarAgentAccountFixture(owner: PublicKey, model = "quasar-agent") {
  const data = Buffer.alloc(153);
  const modelBytes = Buffer.from(model, "utf8");
  let o = 0;
  data.writeUInt8(20, o); o += 1;
  Buffer.from(owner.toBytes()).copy(data, o); o += 32;
  data.writeUInt8(2, o); o += 1; // Both
  data.writeUInt8(modelBytes.length, o); o += 1;
  o += 6; // padding
  writeU64LE(data, o, 123_456n); o += 8;
  data.writeUInt8(7, o); o += 1;
  o += 1; // padding
  data.writeUInt16LE(8888, o); o += 2;
  o += 4; // padding
  data.writeBigUInt64LE(12n, o); o += 8;
  data.writeBigUInt64LE(3n, o); o += 8;
  data.writeBigInt64LE(0n, o); o += 8;
  data.writeUInt8(1, o); o += 1;
  data.writeUInt8(254, o); o += 1; // bump
  data.writeUInt16LE(9100, o); o += 2;
  o += 4; // padding
  modelBytes.copy(data, o);
  return data;
}

describe("Quasar AgentAccount decoder", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NETWORK_PROFILE = "devnet";
    process.env.NEXT_PUBLIC_DEMO_PROGRAM_TARGET = "quasar";
  });

  afterEach(() => {
    delete process.env.NETWORK_PROFILE;
    delete process.env.NEXT_PUBLIC_DEMO_PROGRAM_TARGET;
  });

  it("decodes fixed-layout Quasar AgentAccount bytes", async () => {
    const { decodeQuasarAgentAccount } = await import("@/lib/program");
    const owner = Keypair.generate().publicKey;
    const decoded = decodeQuasarAgentAccount(buildQuasarAgentAccountFixture(owner));

    expect(decoded).toMatchObject({
      owner: owner.toBase58(),
      agentType: "Both",
      model: "quasar-agent",
      minReputation: 7,
      reputationScore: 8888,
      active: true,
      attestationAccuracy: 9100,
    });
    expect(decoded?.rateLamports).toBe(123_456n);
    expect(decoded?.jobsCompleted).toBe(12n);
    expect(decoded?.jobsFailed).toBe(3n);
  });

  it("uses Quasar discriminator, data size, and decoder in explicit Quasar mode", async () => {
    const {
      ACTIVE_AGENT_ACCOUNT_DATA_SIZE,
      ACTIVE_AGENT_ACCOUNT_DISC,
      decodeActiveAgentAccount,
    } = await import("@/lib/program");
    const owner = Keypair.generate().publicKey;

    expect([...ACTIVE_AGENT_ACCOUNT_DISC]).toEqual([20]);
    expect(ACTIVE_AGENT_ACCOUNT_DATA_SIZE).toBe(153);
    expect(decodeActiveAgentAccount(buildQuasarAgentAccountFixture(owner))?.owner).toBe(owner.toBase58());
  });

  it("rejects invalid Quasar account discriminator and overlong model length", async () => {
    const { decodeQuasarAgentAccount } = await import("@/lib/program");
    const owner = Keypair.generate().publicKey;
    const invalidDisc = buildQuasarAgentAccountFixture(owner);
    invalidDisc[0] = 21;
    expect(decodeQuasarAgentAccount(invalidDisc)).toBeNull();

    const invalidModelLen = buildQuasarAgentAccountFixture(owner);
    invalidModelLen[34] = 65;
    expect(decodeQuasarAgentAccount(invalidModelLen)).toBeNull();
  });
});
