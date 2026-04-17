import { x402PrivateSwapAction } from "../src/actions/privateSwap";
import type { IAgentRuntime } from "@elizaos/core";

jest.mock("../src/utils/vanish", () => ({
  VanishCoreClient: {
    fromEnv: jest.fn(() => ({
      getOneTimeWallet: jest.fn(async () => ({ address: "OneTimeWallet111" })),
      createTrade: jest.fn(async () => ({ tx_id: "tx_vanish_123" })),
      commit: jest.fn(async () => ({ tx_id: "tx_vanish_123", status: "committed" })),
    })),
  },
  buildVanishTradeDetails: jest.fn(() => "trade:details"),
  signVanishDetails: jest.fn(() => "base64_sig"),
}));

const MOCK_RUNTIME = {} as unknown as IAgentRuntime;
const makeMemory = (content: unknown) => ({ content } as any);

describe("x402_private_swap", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...prev };
  });

  afterAll(() => {
    process.env = prev;
  });

  it("returns disabled message when feature flag is off", async () => {
    process.env.X402_ENABLE_VANISH_PRIVATE_SWAP = "false";

    const msgs: string[] = [];
    const ok = await x402PrivateSwapAction.handler(
      MOCK_RUNTIME,
      makeMemory({
        source_token_address: "A",
        target_token_address: "B",
        amount: "1",
        swap_transaction: "tx",
      }),
      undefined,
      undefined,
      ((r: any) => {
        msgs.push(r.text);
      }) as any
    );

    expect(ok).toBe(false);
    expect(msgs[0]).toMatch(/disabled/i);
  });

  it("happy path: requests one-time wallet, creates trade, commits", async () => {
    process.env.X402_ENABLE_VANISH_PRIVATE_SWAP = "true";

    const received: any[] = [];
    const ok = await x402PrivateSwapAction.handler(
      MOCK_RUNTIME,
      makeMemory({
        source_token_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        target_token_address: "So11111111111111111111111111111111111111112",
        amount: "1000000",
        swap_transaction: "base64_unsigned_swap_tx",
      }),
      undefined,
      undefined,
      ((r: any) => {
        received.push(r);
      }) as any
    );

    expect(ok).toBe(true);
    expect(received[0].text).toContain("Private swap submitted via Vanish");
    expect(received[0].content.tx_id).toBe("tx_vanish_123");
    expect(received[0].content.provider).toBe("vanish_core");
  });
});
