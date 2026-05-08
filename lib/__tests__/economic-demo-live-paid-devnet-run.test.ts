import {
  ECONOMIC_DEMO_LIVE_PAID_DEVNET_CONFIRM,
  runEconomicDemoLivePaidDevnet,
} from "@/lib/economic-demo/live-paid-devnet-run";

describe("economic demo live paid devnet lane", () => {
  it("fails closed when the lane is not armed", async () => {
    const run = await runEconomicDemoLivePaidDevnet({
      env: {},
      prompt: "test prompt",
    });

    expect(run.status).toBe("not_armed");
    expect(run.network).toBe("solana-devnet");
    expect(run.guardrails.devnetOnly).toBe(true);
    expect(run.guardrails.exactAllowlistedEndpointsOnly).toBe(true);
    expect(run.guardrails.noMainnet).toBe(true);
    expect(run.timeline[0]?.error).toContain("live paid lane not armed");
  });

  it("requires the exact confirmation token before using signer env", async () => {
    const run = await runEconomicDemoLivePaidDevnet({
      env: {
        ECONOMIC_DEMO_LIVE_PAID_DEVNET: "1",
        ECONOMIC_DEMO_LIVE_PAID_DEVNET_CONFIRM: "wrong",
        ECONOMIC_DEMO_ORCHESTRATOR_DEVNET_KEYPAIR_JSON: "[1,2,3]",
      },
    });

    expect(run.status).toBe("not_armed");
    expect(run.orchestratorWallet).toBeNull();
  });

  it("blocks malformed signer material without exposing raw signer bytes", async () => {
    const run = await runEconomicDemoLivePaidDevnet({
      env: {
        ECONOMIC_DEMO_LIVE_PAID_DEVNET: "1",
        ECONOMIC_DEMO_LIVE_PAID_DEVNET_CONFIRM:
          ECONOMIC_DEMO_LIVE_PAID_DEVNET_CONFIRM,
        ECONOMIC_DEMO_ORCHESTRATOR_DEVNET_KEYPAIR_JSON: "not-json",
      },
    });

    expect(run.status).toBe("blocked");
    expect(JSON.stringify(run)).not.toContain("not-json");
  });
});
