import {
  ECONOMIC_DEMO_PROBE_PROFILE_IDS,
  runEconomicDemoHostedChallengeProbe,
} from "@/lib/economic-demo/hosted-challenge-probe";
import { openRouterWalletByProfileId } from "@/lib/economic-demo/openrouter-endpoints";

describe("economic demo hosted challenge probe", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("observes unpaid 402 x402 challenges without sending payment headers", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    global.fetch = jest.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const endpoint = String(url);
        calls.push({ url: endpoint, init });
        const profileId = ECONOMIC_DEMO_PROBE_PROFILE_IDS.find((candidate) =>
          endpoint.includes(candidate.replace("-agent", "")),
        );
        const resolvedProfileId = profileId ?? "verification-validation-agent";
        return new Response(
          JSON.stringify({ error: { code: "payment_required" } }),
          {
            status: 402,
            headers: {
              "content-type": "application/json",
              "x402-request": JSON.stringify({
                version: "1",
                network: "solana-devnet",
                payTo: openRouterWalletByProfileId[resolvedProfileId],
                amount: "0.03",
                currency: "USDC",
                endpoint,
                nonce: `nonce-${resolvedProfileId}`,
                memo: `reddi:${resolvedProfileId}:/v1/chat/completions`,
              }),
            },
          },
        );
      },
    ) as jest.Mock;

    const probe = await runEconomicDemoHostedChallengeProbe({
      timeoutMs: 1_000,
    });

    expect(probe.summary).toEqual({
      requested: 4,
      ok: 4,
      failed: 0,
      allChallengesObserved: true,
    });
    expect(probe.results.map((result) => result.httpStatus)).toEqual([
      402, 402, 402, 402,
    ]);
    expect(probe.results.every((result) => result.x402HeaderPresent)).toBe(
      true,
    );
    expect(probe.guardrails).toMatchObject({
      exactAllowlistedEndpointsOnly: true,
      noX402PaymentHeaderSent: true,
      noPaymentRetryAttempted: true,
      noSignerMaterialUsed: true,
      noDevnetTransfer: true,
      noMainnetTransfer: true,
    });
    expect(probe.claimBoundary).toContain(
      "Fresh unpaid hosted endpoint probe only",
    );
    for (const call of calls) {
      const headers = new Headers(call.init?.headers);
      expect(headers.has("x402-payment")).toBe(false);
      expect(headers.has("authorization")).toBe(false);
    }
  });
});
