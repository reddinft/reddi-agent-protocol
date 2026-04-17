import type { Action, IAgentRuntime, Memory, State } from "@elizaos/core";
import {
  VanishCoreClient,
  buildVanishTradeDetails,
  signVanishDetails,
} from "../utils/vanish";

export interface PrivateSwapActionContent {
  source_token_address: string;
  target_token_address: string;
  amount: string;
  /** Base64 unsigned swap tx (built by Jupiter/Titan with one-time wallet as signer) */
  swap_transaction?: string;
  loan_sol?: string;
  jito_tip?: string;
}

function isPrivateSwapContent(obj: unknown): obj is PrivateSwapActionContent {
  if (typeof obj !== "object" || obj === null) return false;
  const c = obj as PrivateSwapActionContent;
  return (
    typeof c.source_token_address === "string" &&
    typeof c.target_token_address === "string" &&
    typeof c.amount === "string"
  );
}

export const x402PrivateSwapAction: Action = {
  name: "x402_private_swap",
  description: "Execute private x402 swap flow via Vanish Core one-time wallet",
  similes: ["PRIVATE_SWAP", "VANISH_SWAP", "X402_PRIVATE_SWAP"],

  validate: async (_runtime: IAgentRuntime, message: Memory): Promise<boolean> => {
    return isPrivateSwapContent(message.content);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state: State | undefined,
    _options: Record<string, unknown> | undefined,
    callback?: (r: any) => any
  ): Promise<boolean> => {
    const content = message.content as unknown as PrivateSwapActionContent;

    if (String(process.env.X402_ENABLE_VANISH_PRIVATE_SWAP ?? "false").toLowerCase() !== "true") {
      callback?.({
        text: "x402_private_swap disabled. Set X402_ENABLE_VANISH_PRIVATE_SWAP=true to enable.",
      });
      return false;
    }

    if (!content.swap_transaction) {
      callback?.({
        text: "x402_private_swap requires swap_transaction (base64 unsigned Jupiter/Titan swap)",
      });
      return false;
    }

    let client: VanishCoreClient;
    try {
      client = VanishCoreClient.fromEnv();
    } catch (err: any) {
      callback?.({ text: `x402_private_swap: ${err.message}` });
      return false;
    }

    try {
      const oneTime = await client.getOneTimeWallet();
      const timestampMs = String(Date.now());
      const loanSol = content.loan_sol ?? "0";
      const jitoTip = content.jito_tip ?? "0";

      const details = buildVanishTradeDetails({
        sourceTokenAddress: content.source_token_address,
        targetTokenAddress: content.target_token_address,
        amount: content.amount,
        loanSol,
        timestampMs,
        jitoTip,
      });
      const userSignature = signVanishDetails(details);

      const trade = await client.createTrade({
        userAddress: oneTime.address,
        sourceTokenAddress: content.source_token_address,
        targetTokenAddress: content.target_token_address,
        amount: content.amount,
        swapTransaction: content.swap_transaction,
        loanSol,
        jitoTip,
        timestampMs,
        userSignature,
      });

      await client.commit(trade.tx_id);

      callback?.({
        text: `Private swap submitted via Vanish. tx_id: ${trade.tx_id}`,
        content: {
          tx_id: trade.tx_id,
          one_time_wallet: oneTime.address,
          provider: "vanish_core",
        },
      });
      return true;
    } catch (err: any) {
      callback?.({ text: `x402_private_swap failed: ${err.message ?? String(err)}` });
      return false;
    }
  },

  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "private swap 1 USDC to SOL",
          source_token_address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          target_token_address: "So11111111111111111111111111111111111111112",
          amount: "1000000",
          swap_transaction: "base64_unsigned_swap_tx",
          jito_tip: "10000",
        },
      },
      {
        user: "{{agent}}",
        content: {
          text: "Private swap submitted via Vanish. tx_id: tx_123",
          action: "x402_private_swap",
        },
      },
    ],
  ],
};
