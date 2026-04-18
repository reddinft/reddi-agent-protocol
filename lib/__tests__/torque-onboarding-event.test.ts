import { TORQUE_EVENTS } from "@/lib/torque/events";
import { emitOnboardingCompletedEvent } from "@/lib/onboarding/torque-onboarding";

describe("onboarding Torque event emission", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("posts ONBOARDING_COMPLETED with expected payload", async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: true } as Response);
    global.fetch = mockFetch;

    await emitOnboardingCompletedEvent({
      userPubkey: "wallet123",
      attested: true,
      plannerStatus: "completed",
      feedbackSent: true,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/torque/event",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
      })
    );

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body as string);
    expect(body).toMatchObject({
      userPubkey: "wallet123",
      eventName: TORQUE_EVENTS.ONBOARDING_COMPLETED,
      fields: {
        wizardStep: 8,
        attested: true,
        plannerStatus: "completed",
        feedbackSent: true,
      },
    });
  });

  it("never throws when event endpoint request fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network error"));

    await expect(
      emitOnboardingCompletedEvent({
        userPubkey: "wallet123",
        attested: true,
        plannerStatus: "completed",
        feedbackSent: false,
      })
    ).resolves.not.toThrow();
  });
});
