import { CIRCLE_X402_SOURCE_ID, CIRCLE_X402_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/circle-x402";
import { HERMES_SOURCE_ID, HERMES_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/hermes";
import { OPENCLAW_SOURCE_ID, OPENCLAW_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/openclaw";
import { PI_SOURCE_ID, PI_SOURCE_PROFILE } from "@/lib/integrations/source-adapter/profiles/pi";

export const SOURCE_PROFILE_REGISTRY = {
  [OPENCLAW_SOURCE_ID]: OPENCLAW_SOURCE_PROFILE,
  [HERMES_SOURCE_ID]: HERMES_SOURCE_PROFILE,
  [PI_SOURCE_ID]: PI_SOURCE_PROFILE,
  [CIRCLE_X402_SOURCE_ID]: CIRCLE_X402_SOURCE_PROFILE,
} as const;

export type SourceProfileId = keyof typeof SOURCE_PROFILE_REGISTRY;

export function getSourceProfile(source: string) {
  return SOURCE_PROFILE_REGISTRY[source as SourceProfileId] ?? null;
}
