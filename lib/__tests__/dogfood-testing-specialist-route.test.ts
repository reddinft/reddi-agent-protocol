import { NextRequest } from "next/server";

describe("dogfood testing specialist route", () => {
  it("returns pong + haiku when forced pass", async () => {
    const { POST } = await import("@/app/api/dogfood/testing-specialist/route");
    const req = new NextRequest("http://localhost/api/dogfood/testing-specialist", {
      method: "POST",
      body: JSON.stringify({ message: "ping", force: "pass" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      failureInjected: false,
      payload: {
        reply: "pong",
        haiku: expect.any(Array),
      },
    });
  });

  it("rejects non-ping messages", async () => {
    const { POST } = await import("@/app/api/dogfood/testing-specialist/route");
    const req = new NextRequest("http://localhost/api/dogfood/testing-specialist", {
      method: "POST",
      body: JSON.stringify({ message: "hello" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: 'Only "ping" is supported in this test specialist.',
    });
  });
});

