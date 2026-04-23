import { NextRequest } from "next/server";

describe("planner tools manifest route", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("returns manifest with core endpoints", async () => {
    const { GET } = await import("@/app/api/planner/tools/route");
    const req = new NextRequest("http://localhost/api/planner/tools", {
      method: "GET",
    });

    const res = await GET(req as unknown as Request);
    expect(res.status).toBe(200);

    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      protocol: "reddi-agent-protocol",
      tools: {
        endpoints: {
          resolve: "http://localhost/api/planner/tools/resolve",
          invoke: "http://localhost/api/planner/tools/invoke",
          signal: "http://localhost/api/planner/tools/signal",
          register_consumer: "http://localhost/api/planner/tools/register-consumer",
          resolve_attestor: "http://localhost/api/planner/tools/resolve-attestor",
          decide_settlement: "http://localhost/api/planner/tools/release",
        },
      },
    });
  });
});
