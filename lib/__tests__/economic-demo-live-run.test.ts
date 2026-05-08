import {
  buildEconomicDemoLiveRun,
  ECONOMIC_DEMO_LIVE_RUN_SCHEMA_VERSION,
} from "@/lib/economic-demo/live-run";

describe("economic demo controlled live run", () => {
  it("builds a fresh no-spend run envelope from allowlisted evidence", () => {
    const run = buildEconomicDemoLiveRun({
      scenarioId: "webpage",
      prompt: "Design a landing page for a trustless AI agent marketplace.",
      clientRunNonce: "judge-visible-nonce",
    });

    expect(run.schemaVersion).toBe(ECONOMIC_DEMO_LIVE_RUN_SCHEMA_VERSION);
    expect(run.runId).toMatch(/^economic-demo-/);
    expect(run.mode).toBe("controlled_hosted_evidence");
    expect(run.clientRunNonce).toBe("judge-visible-nonce");
    expect(run.promptHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(
      run.selectedSpecialists.map((specialist) => specialist.profileId),
    ).toEqual([
      "planning-agent",
      "content-creation-agent",
      "code-generation-agent",
      "verification-validation-agent",
    ]);
    expect(
      run.selectedSpecialists.every(
        (specialist) => specialist.challengeStatus === 402,
      ),
    ).toBe(true);
    expect(
      run.selectedSpecialists.every(
        (specialist) => specialist.completionStatus === 200,
      ),
    ).toBe(true);
    expect(run.timeline.map((step) => step.id)).toEqual([
      "prompt_hash_created",
      "specialists_selected",
      "x402_challenges_observed",
      "controlled_receipts_satisfied",
      "outputs_returned",
      "attestor_verdict_returned",
      "evidence_pack_attached",
    ]);
    expect(run.output.previews.length).toBe(4);
    expect(run.guardrails).toMatchObject({
      exactAllowlistedEndpointsOnly: true,
      noSignerMaterialUsed: true,
      noSignatureAttemptedByRoute: true,
      noDevnetTransferFromRoute: true,
      noPaidProviderCallFromRoute: true,
      controlledDemoReceiptsOnly: true,
      noProductionSettlementClaim: true,
    });
    expect(run.claimBoundary).toContain("no production settlement claim");
  });

  it("bounds prompt and nonce input", () => {
    const run = buildEconomicDemoLiveRun({
      prompt: "x".repeat(1_200),
      clientRunNonce: "n".repeat(200),
    });

    expect(run.prompt).toHaveLength(800);
    expect(run.clientRunNonce).toHaveLength(120);
  });
});
