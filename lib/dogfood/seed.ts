import "server-only";

import { upsertSpecialistIndex } from "@/lib/onboarding/specialist-index";
import {
  DOGFOOD_ATTESTOR_WALLET,
  DOGFOOD_SPECIALIST_WALLET,
  DOGFOOD_TAG,
} from "@/lib/dogfood/constants";

export function seedDogfoodAgents(origin: string) {
  const specialistEndpoint = `${origin}/api/dogfood/testing-specialist`;
  const attestorEndpoint = `${origin}/api/dogfood/testing-attestor`;

  const specialist = upsertSpecialistIndex(
    DOGFOOD_SPECIALIST_WALLET,
    {
      taskTypes: ["qa"],
      inputModes: ["text"],
      outputModes: ["text"],
      privacyModes: ["public"],
      pricing: { baseUsd: 0, perCallUsd: 0.01 },
      tags: [DOGFOOD_TAG, "specialist", "ping-pong"],
      context_requirements: [
        { key: "message", type: "text", required: true, description: "Expected literal ping" },
      ],
      runtime_capabilities: ["stateful"],
    },
    {
      endpointUrl: specialistEndpoint,
      healthcheckStatus: "pass",
      attested: true,
      reputationScore: 3.2,
    }
  );

  const attestor = upsertSpecialistIndex(
    DOGFOOD_ATTESTOR_WALLET,
    {
      taskTypes: ["review"],
      inputModes: ["json"],
      outputModes: ["json"],
      privacyModes: ["public"],
      pricing: { baseUsd: 0, perCallUsd: 0.005 },
      tags: [DOGFOOD_TAG, "attestor", "judge"],
      context_requirements: [
        { key: "payload", type: "json", required: true, description: "Specialist response payload" },
      ],
      runtime_capabilities: ["stateful"],
    },
    {
      endpointUrl: attestorEndpoint,
      healthcheckStatus: "pass",
      attested: true,
      reputationScore: 4.4,
    }
  );

  return {
    ok: true,
    specialist: specialist.entry,
    attestor: attestor.entry,
  };
}
