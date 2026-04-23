describe("program/network alignment", () => {
  const LEGACY_QUASAR_ESCROW_PROGRAM_ID = "VYCbMszux9seLK2aXFZMECMBFURvfuJLXsXPmJS5igW";

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NETWORK_PROFILE;
    delete process.env.NEXT_PUBLIC_NETWORK_PROFILE;
    delete process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID;
    delete process.env.ALLOW_UNSAFE_ESCROW_OVERRIDE;
  });

  it("uses the network profile escrow program by default", async () => {
    process.env.NETWORK_PROFILE = "devnet";

    const { getNetworkProfile } = await import("@/lib/config/network");
    const { ESCROW_PROGRAM_ID } = await import("@/lib/program");

    expect(ESCROW_PROGRAM_ID.toBase58()).toBe(getNetworkProfile().programs.escrowProgramId);
  });

  it("never falls back to legacy Quasar escrow id on devnet", async () => {
    process.env.NETWORK_PROFILE = "devnet";

    const { ESCROW_PROGRAM_ID } = await import("@/lib/program");

    expect(ESCROW_PROGRAM_ID.toBase58()).not.toBe(LEGACY_QUASAR_ESCROW_PROGRAM_ID);
  });

  it("ignores unsafe devnet override unless explicitly allowed", async () => {
    process.env.NETWORK_PROFILE = "devnet";
    process.env.NEXT_PUBLIC_ESCROW_PROGRAM_ID = LEGACY_QUASAR_ESCROW_PROGRAM_ID;

    const { getNetworkProfile } = await import("@/lib/config/network");
    const { ESCROW_PROGRAM_ID } = await import("@/lib/program");

    expect(getNetworkProfile().programs.escrowProgramId).not.toBe(LEGACY_QUASAR_ESCROW_PROGRAM_ID);
    expect(ESCROW_PROGRAM_ID.toBase58()).not.toBe(LEGACY_QUASAR_ESCROW_PROGRAM_ID);
  });
});
