import { openRouterAll30EndpointEvidence } from "@/lib/economic-demo/openrouter-endpoints";

export const ECONOMIC_DEMO_HOSTED_CHALLENGE_PROBE_SCHEMA_VERSION =
  "reddi.economic-demo.hosted-challenge-probe.v1" as const;

export const ECONOMIC_DEMO_PROBE_PROFILE_IDS = [
  "planning-agent",
  "content-creation-agent",
  "code-generation-agent",
  "verification-validation-agent",
] as const;

export type EconomicDemoProbeProfileId =
  (typeof ECONOMIC_DEMO_PROBE_PROFILE_IDS)[number];

export type EconomicDemoHostedChallengeProbeResult = {
  profileId: EconomicDemoProbeProfileId;
  endpoint: string;
  ok: boolean;
  observedAt: string;
  httpStatus: number | null;
  x402HeaderPresent: boolean;
  challenge: {
    version?: string;
    network?: string;
    payTo?: string;
    amount?: string;
    currency?: string;
    endpoint?: string;
    noncePresent: boolean;
    memo?: string;
  } | null;
  error: string | null;
};

export type EconomicDemoHostedChallengeProbe = {
  schemaVersion: typeof ECONOMIC_DEMO_HOSTED_CHALLENGE_PROBE_SCHEMA_VERSION;
  generatedAt: string;
  mode: "unpaid_402_challenge_probe";
  results: EconomicDemoHostedChallengeProbeResult[];
  summary: {
    requested: number;
    ok: number;
    failed: number;
    allChallengesObserved: boolean;
  };
  guardrails: {
    exactAllowlistedEndpointsOnly: true;
    noX402PaymentHeaderSent: true;
    noPaymentRetryAttempted: true;
    noSignerMaterialUsed: true;
    noDevnetTransfer: true;
    noMainnetTransfer: true;
  };
  claimBoundary: string;
};

const allowlistedEndpoints = Object.fromEntries(
  openRouterAll30EndpointEvidence.map((entry) => [entry.profileId, entry]),
) as Record<string, (typeof openRouterAll30EndpointEvidence)[number]>;

function parseChallengeHeader(header: string | null) {
  if (!header) return null;
  try {
    const parsed = JSON.parse(header) as Record<string, unknown>;
    return {
      version: typeof parsed.version === "string" ? parsed.version : undefined,
      network: typeof parsed.network === "string" ? parsed.network : undefined,
      payTo: typeof parsed.payTo === "string" ? parsed.payTo : undefined,
      amount: typeof parsed.amount === "string" ? parsed.amount : undefined,
      currency:
        typeof parsed.currency === "string" ? parsed.currency : undefined,
      endpoint:
        typeof parsed.endpoint === "string" ? parsed.endpoint : undefined,
      noncePresent: typeof parsed.nonce === "string" && parsed.nonce.length > 0,
      memo: typeof parsed.memo === "string" ? parsed.memo : undefined,
    };
  } catch {
    return null;
  }
}

function challengeMatchesAllowlist(
  profileId: EconomicDemoProbeProfileId,
  endpoint: string,
  challenge: EconomicDemoHostedChallengeProbeResult["challenge"],
) {
  if (!challenge) return false;
  const expected = allowlistedEndpoints[profileId];
  return (
    challenge.network === "solana-devnet" &&
    challenge.currency === "USDC" &&
    challenge.payTo === expected.walletAddress &&
    challenge.endpoint === endpoint &&
    challenge.noncePresent
  );
}

async function probeOne(
  profileId: EconomicDemoProbeProfileId,
  timeoutMs: number,
): Promise<EconomicDemoHostedChallengeProbeResult> {
  const entry = allowlistedEndpoints[profileId];
  const observedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(entry.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: profileId,
        messages: [
          {
            role: "user",
            content:
              "Economic demo unpaid challenge probe only. Do not execute paid work.",
          },
        ],
        max_tokens: 1,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    const challenge = parseChallengeHeader(
      response.headers.get("x402-request"),
    );
    const ok =
      response.status === 402 &&
      response.headers.has("x402-request") &&
      challengeMatchesAllowlist(profileId, entry.endpoint, challenge);

    return {
      profileId,
      endpoint: entry.endpoint,
      ok,
      observedAt,
      httpStatus: response.status,
      x402HeaderPresent: response.headers.has("x402-request"),
      challenge,
      error: ok ? null : "challenge_did_not_match_allowlist",
    };
  } catch (error) {
    return {
      profileId,
      endpoint: entry.endpoint,
      ok: false,
      observedAt,
      httpStatus: null,
      x402HeaderPresent: false,
      challenge: null,
      error: error instanceof Error ? error.name : "probe_failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function runEconomicDemoHostedChallengeProbe(options?: {
  timeoutMs?: number;
}): Promise<EconomicDemoHostedChallengeProbe> {
  const timeoutMs = Math.min(
    Math.max(options?.timeoutMs ?? 5_000, 1_000),
    8_000,
  );
  const generatedAt = new Date().toISOString();
  const results = await Promise.all(
    ECONOMIC_DEMO_PROBE_PROFILE_IDS.map((profileId) =>
      probeOne(profileId, timeoutMs),
    ),
  );
  const ok = results.filter((result) => result.ok).length;

  return {
    schemaVersion: ECONOMIC_DEMO_HOSTED_CHALLENGE_PROBE_SCHEMA_VERSION,
    generatedAt,
    mode: "unpaid_402_challenge_probe",
    results,
    summary: {
      requested: results.length,
      ok,
      failed: results.length - ok,
      allChallengesObserved: ok === results.length,
    },
    guardrails: {
      exactAllowlistedEndpointsOnly: true,
      noX402PaymentHeaderSent: true,
      noPaymentRetryAttempted: true,
      noSignerMaterialUsed: true,
      noDevnetTransfer: true,
      noMainnetTransfer: true,
    },
    claimBoundary:
      "Fresh unpaid hosted endpoint probe only: observes HTTP 402 x402 challenges from exact allowlisted Coolify specialist endpoints; sends no x402-payment header, performs no paid retry, uses no signer material, and makes no transfer or settlement claim.",
  };
}
