import { TORQUE_EVENTS } from "@/lib/torque/events";

export interface OnboardingCompletedEventInput {
  userPubkey: string;
  attested: boolean;
  plannerStatus: "idle" | "running" | "completed" | "failed";
  feedbackSent: boolean;
}

export async function emitOnboardingCompletedEvent(input: OnboardingCompletedEventInput): Promise<void> {
  try {
    await fetch("/api/torque/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userPubkey: input.userPubkey,
        eventName: TORQUE_EVENTS.ONBOARDING_COMPLETED,
        fields: {
          wizardStep: 8,
          attested: input.attested,
          plannerStatus: input.plannerStatus,
          feedbackSent: input.feedbackSent,
        },
      }),
    });
  } catch {
    // Non-critical instrumentation only.
  }
}
