describe("specialist index freshness semantics", () => {
  it("returns unknown for empty or invalid timestamps", async () => {
    const { computeFreshnessState } = await import("@/lib/onboarding/specialist-index");

    expect(computeFreshnessState()).toBe("unknown");
    expect(computeFreshnessState("not-a-date")).toBe("unknown");
  });

  it("returns fresh for recent timestamps", async () => {
    const { computeFreshnessState } = await import("@/lib/onboarding/specialist-index");
    const ts = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    expect(computeFreshnessState(ts)).toBe("fresh");
  });

  it("returns warm between fresh and stale windows", async () => {
    const { computeFreshnessState } = await import("@/lib/onboarding/specialist-index");
    const ts = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

    expect(computeFreshnessState(ts)).toBe("warm");
  });

  it("returns stale for old timestamps", async () => {
    const { computeFreshnessState } = await import("@/lib/onboarding/specialist-index");
    const ts = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString();

    expect(computeFreshnessState(ts)).toBe("stale");
  });
});
