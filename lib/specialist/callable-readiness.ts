import type { SpecialistListing } from "@/lib/registry/bridge";

export type SpecialistX402ProbeSummary = {
  status: "pass" | "degraded" | "fail";
  reachable: boolean;
  x402Probe: "ok" | "degraded" | "fail";
  securityStatus: "unknown" | "x402_challenge_detected" | "insecure_open_completion";
  checkedAt: string;
  note: string;
};

export type CallableReadinessItem = {
  id: "listing" | "endpoint" | "x402" | "capabilities" | "attestation";
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
  action: string;
};

export type CallableReadinessSummary = {
  status: "callable" | "action_required" | "blocked";
  headline: string;
  nextAction: string;
  items: CallableReadinessItem[];
};

export function summarizeSpecialistCallableReadiness(
  listing: Pick<SpecialistListing, "walletAddress" | "pda" | "health" | "capabilities" | "attestation">,
  latestProbe?: SpecialistX402ProbeSummary | null
): CallableReadinessSummary {
  const hasListing = Boolean(listing.walletAddress && (listing.pda || listing.capabilities));
  const hasEndpoint = Boolean(listing.health.endpointUrl);
  const endpointPass = listing.health.status === "pass" || latestProbe?.status === "pass" || latestProbe?.status === "degraded";
  const insecureOpenCompletion = latestProbe?.securityStatus === "insecure_open_completion";
  const x402Pass = latestProbe?.securityStatus === "x402_challenge_detected" || (!latestProbe && listing.health.status === "pass");
  const hasCapabilities = Boolean(listing.capabilities && listing.capabilities.taskTypes.length > 0);
  const attested = listing.attestation.attested;

  const items: CallableReadinessItem[] = [
    {
      id: "listing",
      label: "Registry listing",
      status: hasListing ? "pass" : "fail",
      detail: hasListing ? "Wallet is visible in the marketplace registry." : "Wallet is not yet registered in the marketplace registry.",
      action: hasListing ? "No action needed." : "Complete Specialist onboarding and submit registration.",
    },
    {
      id: "endpoint",
      label: "Endpoint health",
      status: endpointPass ? "pass" : hasEndpoint ? "warn" : "fail",
      detail: endpointPass
        ? "Endpoint is reachable enough for consumers to route paid calls."
        : hasEndpoint
          ? "Endpoint exists, but the last healthcheck did not prove callable readiness."
          : "No endpoint URL is attached to this specialist listing.",
      action: endpointPass ? "Keep the tunnel/runtime online." : "Restart the runtime/tunnel and rerun the healthcheck.",
    },
    {
      id: "x402",
      label: "x402 protected completion",
      status: insecureOpenCompletion ? "fail" : x402Pass ? "pass" : "warn",
      detail: insecureOpenCompletion
        ? "The completion endpoint returned 200 without an x402 challenge. This is blocked as unpaid-bypass risk."
        : x402Pass
          ? "`/v1/chat/completions` challenges first with HTTP 402 + x402-request before payment."
          : "No fresh proof that `/v1/chat/completions` fails closed before payment.",
      action: insecureOpenCompletion
        ? "Put the x402 payment proxy in front of `/v1/chat/completions`, then rerun the check."
        : x402Pass
          ? "No action needed."
          : "Run the x402 compliance check from this dashboard.",
    },
    {
      id: "capabilities",
      label: "Capability profile",
      status: hasCapabilities ? "pass" : "fail",
      detail: hasCapabilities ? "Task types, IO modes, privacy, and pricing are registered." : "Consumers cannot filter or understand this specialist without capabilities.",
      action: hasCapabilities ? "Keep pricing/capability claims current." : "Complete capability setup in onboarding.",
    },
    {
      id: "attestation",
      label: "Attestation",
      status: attested ? "pass" : "warn",
      detail: attested ? "This specialist has attestation evidence." : "Specialist is callable, but lacks attestation evidence for higher-trust routing.",
      action: attested ? "No action needed." : "Run attestation to improve trust and routing rank.",
    },
  ];

  if (insecureOpenCompletion) {
    return {
      status: "blocked",
      headline: "Blocked: endpoint can serve unpaid completions",
      nextAction: "Put the x402 proxy in front of `/v1/chat/completions`, then rerun the compliance check.",
      items,
    };
  }

  const failedRequired = items.some((item) => ["listing", "endpoint", "x402", "capabilities"].includes(item.id) && item.status === "fail");
  const warnedRequired = items.some((item) => ["endpoint", "x402"].includes(item.id) && item.status === "warn");

  if (!failedRequired && !warnedRequired) {
    return {
      status: "callable",
      headline: attested ? "Callable: consumers can pay and invoke this specialist" : "Callable with trust warning",
      nextAction: attested ? "Keep runtime, tunnel, and x402 proxy online." : "Add attestation evidence to improve marketplace trust.",
      items,
    };
  }

  const firstAction = items.find((item) => item.status === "fail" || item.status === "warn")?.action ?? "Rerun readiness checks.";
  return {
    status: "action_required",
    headline: "Action required before this specialist is safely callable",
    nextAction: firstAction,
    items,
  };
}
