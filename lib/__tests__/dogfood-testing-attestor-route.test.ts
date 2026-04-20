import { NextRequest } from "next/server";

describe("dogfood testing attestor route", () => {
  it("passes when pong and valid 5/7/5 haiku are present", async () => {
    const { POST } = await import("@/app/api/dogfood/testing-attestor/route");
    const req = new NextRequest("http://localhost/api/dogfood/testing-attestor", {
      method: "POST",
      body: JSON.stringify({
        runId: "run_1",
        payload: {
          reply: "pong",
          haiku: [
            "Agents wake at dawn",
            "Tools braid trust through noisy wires",
            "Proof settles by noon",
          ],
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verdict: {
        pass: true,
        pong: true,
        haiku: true,
      },
    });
  });

  it("fails when pong is missing", async () => {
    const { POST } = await import("@/app/api/dogfood/testing-attestor/route");
    const req = new NextRequest("http://localhost/api/dogfood/testing-attestor", {
      method: "POST",
      body: JSON.stringify({
        runId: "run_2",
        payload: {
          reply: "ping",
          haiku: [
            "Agents wake at dawn",
            "Tools braid trust through noisy wires",
            "Proof settles by noon",
          ],
        },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req as unknown as Request);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      verdict: {
        pass: false,
        pong: false,
      },
    });
  });
});

