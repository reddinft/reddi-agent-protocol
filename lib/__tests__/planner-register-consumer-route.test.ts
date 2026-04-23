import { NextRequest } from "next/server";

jest.mock("@/lib/onboarding/consumer-registry", () => ({
  registerConsumer: jest.fn(),
  listConsumers: jest.fn().mockReturnValue({ ok: true, results: [] }),
}));

describe("planner register_consumer route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("registers consumer and returns next steps", async () => {
    const { registerConsumer } = await import("@/lib/onboarding/consumer-registry");
    (registerConsumer as jest.Mock).mockReturnValue({
      ok: true,
      alreadyRegistered: false,
      profile: { walletAddress: "So11111111111111111111111111111111111111112" },
    });

    const { POST } = await import("@/app/api/planner/tools/register-consumer/route");
    const req = new NextRequest("http://localhost/api/planner/tools/register-consumer", {
      method: "POST",
      body: JSON.stringify({ walletAddress: "So11111111111111111111111111111111111111112" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      alreadyRegistered: false,
      next: {
        registerOnchain: expect.any(String),
      },
    });
  });

  it("returns 400 on validation errors", async () => {
    const { registerConsumer } = await import("@/lib/onboarding/consumer-registry");
    (registerConsumer as jest.Mock).mockImplementation(() => {
      throw new Error("Valid consumer wallet address is required.");
    });

    const { POST } = await import("@/app/api/planner/tools/register-consumer/route");
    const req = new NextRequest("http://localhost/api/planner/tools/register-consumer", {
      method: "POST",
      body: JSON.stringify({ walletAddress: "bad" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "Valid consumer wallet address is required.",
    });
  });
});
