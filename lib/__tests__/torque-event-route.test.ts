import { NextRequest } from "next/server";

jest.mock("@/lib/torque/client", () => ({
  emitTorqueEvent: jest.fn().mockResolvedValue(undefined),
}));

describe("Torque event API route", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("@/app/api/torque/event/route");
    const req = new NextRequest("http://localhost/api/torque/event", {
      method: "POST",
      body: JSON.stringify({ eventName: "specialist_job_completed" }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "userPubkey and eventName required",
    });
  });

  it("returns 400 for unknown event names", async () => {
    const { POST } = await import("@/app/api/torque/event/route");
    const req = new NextRequest("http://localhost/api/torque/event", {
      method: "POST",
      body: JSON.stringify({
        userPubkey: "wallet123",
        eventName: "not_a_real_event",
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: "unknown eventName",
    });
  });

  it("emits known events and returns ok", async () => {
    const { emitTorqueEvent } = await import("@/lib/torque/client");
    const { POST } = await import("@/app/api/torque/event/route");

    const req = new NextRequest("http://localhost/api/torque/event", {
      method: "POST",
      body: JSON.stringify({
        userPubkey: "wallet123",
        eventName: "specialist_job_completed",
        fields: { jobId: "job-1" },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(emitTorqueEvent).toHaveBeenCalledWith({
      userPubkey: "wallet123",
      eventName: "specialist_job_completed",
      fields: { jobId: "job-1" },
    });
  });

  it("accepts onboarding_completed event", async () => {
    const { emitTorqueEvent } = await import("@/lib/torque/client");
    const { POST } = await import("@/app/api/torque/event/route");

    const req = new NextRequest("http://localhost/api/torque/event", {
      method: "POST",
      body: JSON.stringify({
        userPubkey: "wallet123",
        eventName: "onboarding_completed",
        fields: { wizardStep: 8, attested: true },
      }),
      headers: { "content-type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true });
    expect(emitTorqueEvent).toHaveBeenCalledWith({
      userPubkey: "wallet123",
      eventName: "onboarding_completed",
      fields: { wizardStep: 8, attested: true },
    });
  });
});
