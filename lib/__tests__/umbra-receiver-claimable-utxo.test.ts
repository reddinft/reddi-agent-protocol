import { selectReceiverClaimableUtxos } from "@/lib/privacy/umbra/receiver-claimable-utxo.js";

describe("Umbra receiver-claimable UTXO selection", () => {
  it("selects publicReceived UTXOs for public-balance-funded receiver payments", () => {
    const selected = selectReceiverClaimableUtxos(
      {
        received: [],
        publicReceived: [
          {
            amount: "500000",
            destinationAddress: "recipient-wallet",
            leafIndex: "42",
            commitmentIndex: "7",
          },
        ],
      },
      500000n,
      "recipient-wallet",
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].__bucket).toBe("publicReceived");
    expect(selected[0].leafIndex).toBe("42");
  });

  it("falls back to received when receiver UTXO came from encrypted balance", () => {
    const selected = selectReceiverClaimableUtxos(
      {
        received: [{ amount: 500000n, destinationAddress: "recipient-wallet", leafIndex: 3n }],
        publicReceived: [],
      },
      500000n,
      "recipient-wallet",
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].__bucket).toBe("received");
  });

  it("prefers matching amount and recipient over unrelated newer UTXOs", () => {
    const selected = selectReceiverClaimableUtxos(
      {
        publicReceived: [
          { amount: "123", destinationAddress: "someone-else", leafIndex: "99" },
          { amount: "500000", destinationAddress: "recipient-wallet", leafIndex: "12" },
        ],
      },
      500000n,
      "recipient-wallet",
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].destinationAddress).toBe("recipient-wallet");
    expect(selected[0].leafIndex).toBe("12");
  });

  it("prefers the newest matching insertion index when the indexer omits leafIndex", () => {
    const selected = selectReceiverClaimableUtxos(
      {
        publicReceived: [
          { amount: "500000", destinationAddress: "recipient-wallet", insertionIndex: "808" },
          { amount: "500000", destinationAddress: "recipient-wallet", insertionIndex: "813" },
        ],
      },
      500000n,
      "recipient-wallet",
    );

    expect(selected).toHaveLength(1);
    expect(selected[0].insertionIndex).toBe("813");
  });
});
