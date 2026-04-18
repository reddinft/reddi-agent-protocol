export const TORQUE_EVENTS = {
  SPECIALIST_JOB_COMPLETED: "specialist_job_completed",
  CONSUMER_QUERY_RUN: "consumer_query_run",
  ONBOARDING_COMPLETED: "onboarding_completed",
  RATING_SUBMITTED: "rating_submitted",
} as const;

export type TorqueEventName = typeof TORQUE_EVENTS[keyof typeof TORQUE_EVENTS];

export interface TorqueEventPayload {
  userPubkey: string;
  eventName: TorqueEventName;
  fields: Record<string, string | number | boolean>;
}

