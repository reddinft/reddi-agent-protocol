import type { SpecialistListing } from "@/lib/registry/bridge";
import { getSourceProfile, type SourceProfileId } from "@/lib/integrations/source-adapter/profiles";

export type SourceRoutingPolicyInput = {
  preferredSource?: string;
  strictSourceMatch?: boolean;
};

export type SourceRoutingDecision = {
  requestedSource: SourceProfileId | null;
  listingSource: SourceProfileId | null;
  scoreDelta: number;
  reject: boolean;
  reasons: string[];
};

function normalizeRequestedSource(source?: string): SourceProfileId | null {
  if (!source) return null;
  return getSourceProfile(source) ? (source as SourceProfileId) : null;
}

export function detectListingSource(listing: SpecialistListing): SourceProfileId | null {
  const tags = listing.capabilities?.tags ?? [];

  for (const tag of tags) {
    if (!tag || typeof tag !== "string") continue;

    const [prefix, value] = tag.includes(":")
      ? tag.split(":", 2)
      : tag.split("=", 2);

    if (prefix !== "source" || !value) continue;
    if (getSourceProfile(value)) {
      return value as SourceProfileId;
    }
  }

  return null;
}

export function evaluateSourceRoutingDecision(
  listing: SpecialistListing,
  policy: SourceRoutingPolicyInput
): SourceRoutingDecision {
  const requestedSource = normalizeRequestedSource(policy.preferredSource);
  const listingSource = detectListingSource(listing);

  if (!requestedSource) {
    return {
      requestedSource: null,
      listingSource,
      scoreDelta: 0,
      reject: false,
      reasons: [],
    };
  }

  const strict = policy.strictSourceMatch === true;

  if (listingSource === requestedSource) {
    return {
      requestedSource,
      listingSource,
      scoreDelta: 12,
      reject: false,
      reasons: [`source:${requestedSource}`],
    };
  }

  if (strict) {
    return {
      requestedSource,
      listingSource,
      scoreDelta: 0,
      reject: true,
      reasons: [`source_mismatch:${requestedSource}`],
    };
  }

  if (listingSource) {
    return {
      requestedSource,
      listingSource,
      scoreDelta: -4,
      reject: false,
      reasons: [`source_penalty:${listingSource}`],
    };
  }

  return {
    requestedSource,
    listingSource,
    scoreDelta: 0,
    reject: false,
    reasons: [`source_unknown:${requestedSource}`],
  };
}
