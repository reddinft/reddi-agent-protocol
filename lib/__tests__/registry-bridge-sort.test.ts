import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const mockGetProgramAccounts = jest.fn();
const mockDecodeAgentAccount = jest.fn();

jest.mock("@solana/web3.js", () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getProgramAccounts: mockGetProgramAccounts,
  })),
}));

jest.mock("@/lib/program", () => ({
  DEVNET_RPC: "http://localhost:8899",
  ESCROW_PROGRAM_ID: { toBase58: () => "program" },
  ACCOUNT_DISC: { AgentAccount: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]) },
  decodeAgentAccount: (buf: Buffer) => mockDecodeAgentAccount(buf),
}));

describe("registry bridge default sort", () => {
  const onboardingDir = join(process.cwd(), "data", "onboarding");
  const indexPath = join(onboardingDir, "specialist-index.json");
  const attestPath = join(onboardingDir, "attestations.json");
  const profilePath = join(onboardingDir, "specialist-profile.json");

  let indexBackup: string | null = null;
  let attestBackup: string | null = null;
  let profileBackup: string | null = null;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    mkdirSync(onboardingDir, { recursive: true });
    indexBackup = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : null;
    attestBackup = existsSync(attestPath) ? readFileSync(attestPath, "utf8") : null;
    profileBackup = existsSync(profilePath) ? readFileSync(profilePath, "utf8") : null;
  });

  afterEach(() => {
    if (indexBackup === null) writeFileSync(indexPath, "[]");
    else writeFileSync(indexPath, indexBackup);

    if (attestBackup === null) writeFileSync(attestPath, "[]");
    else writeFileSync(attestPath, attestBackup);

    if (profileBackup === null) writeFileSync(profilePath, "[]");
    else writeFileSync(profilePath, profileBackup);
  });

  it("orders listings by attestation, then health, then feedback when no explicit sort is requested", async () => {
    writeFileSync(
      indexPath,
      JSON.stringify(
        [
          {
            walletAddress: "walletA",
            attested: false,
            healthcheckStatus: "pass",
            routingSignals: { feedbackCount: 10, avgFeedbackScore: 9, attestationAgreements: 0, attestationDisagreements: 0 },
            capabilities: { taskTypes: ["summarize"], inputModes: ["text"], outputModes: ["text"], privacyModes: ["public"], pricing: { baseUsd: 0, perCallUsd: 1 } },
          },
          {
            walletAddress: "walletB",
            attested: false,
            healthcheckStatus: "fail",
            routingSignals: { feedbackCount: 3, avgFeedbackScore: 1, attestationAgreements: 0, attestationDisagreements: 0 },
            capabilities: { taskTypes: ["classify"], inputModes: ["text"], outputModes: ["text"], privacyModes: ["public"], pricing: { baseUsd: 0, perCallUsd: 1 } },
          },
          {
            walletAddress: "walletC",
            attested: false,
            healthcheckStatus: "pass",
            routingSignals: { feedbackCount: 4, avgFeedbackScore: 5, attestationAgreements: 0, attestationDisagreements: 0 },
            capabilities: { taskTypes: ["classify"], inputModes: ["text"], outputModes: ["text"], privacyModes: ["public"], pricing: { baseUsd: 0, perCallUsd: 1 } },
          },
        ],
        null,
        2
      )
    );

    writeFileSync(attestPath, JSON.stringify([{ walletAddress: "walletB", createdAt: new Date().toISOString() }], null, 2));
    writeFileSync(
      profilePath,
      JSON.stringify(
        [
          { walletAddress: "walletA", endpointStatus: "online" },
          { walletAddress: "walletB", endpointStatus: "offline" },
          { walletAddress: "walletC", endpointStatus: "online" },
        ],
        null,
        2
      )
    );

    mockGetProgramAccounts.mockResolvedValue([
      { pubkey: { toBase58: () => "pdaA" }, account: { data: new Uint8Array([1]) } },
      { pubkey: { toBase58: () => "pdaB" }, account: { data: new Uint8Array([2]) } },
    ]);

    mockDecodeAgentAccount
      .mockReturnValueOnce({ owner: "walletA", agentType: "Primary", model: "", rateLamports: 0n, minReputation: 0, reputationScore: 10, jobsCompleted: 0n, jobsFailed: 0n, createdAt: 0n, active: true, attestationAccuracy: 0 })
      .mockReturnValueOnce({ owner: "walletB", agentType: "Primary", model: "", rateLamports: 0n, minReputation: 0, reputationScore: 10, jobsCompleted: 0n, jobsFailed: 0n, createdAt: 0n, active: true, attestationAccuracy: 0 });

    const { fetchSpecialistListings } = await import("@/lib/registry/bridge");
    const result = await fetchSpecialistListings();

    expect(result.ok).toBe(true);
    expect(result.listings.map((l) => l.walletAddress)).toEqual(["walletB", "walletA", "walletC"]);
  });
});
