import "server-only";

import { readFileSync } from "fs";
import { join } from "path";

const PROFILE_PATH = join(process.cwd(), "data", "onboarding", "specialist-profile.json");
const AUTH_HEADER_NAME = "x-reddi-agent-token";

export type SpecialistHealthcheckInput = {
  endpointUrl: string;
  walletAddress: string;
};

export type SpecialistHealthcheckResult = {
  status: "pass" | "degraded" | "fail";
  reachable: boolean;
  x402Probe: "ok" | "degraded" | "fail";
  securityStatus: "unknown" | "x402_challenge_detected" | "insecure_open_completion";
  endpoint: string;
  checkedAt: string;
  note: string;
};

function normalizeEndpoint(endpointUrl: string) {
  const raw = endpointUrl.trim();
  if (!raw) throw new Error("Endpoint URL is required for healthcheck.");
  if (raw.startsWith("https://")) return raw;
  if (raw.startsWith("http://")) return `https://${raw.slice("http://".length)}`;
  return `https://${raw}`;
}

async function probe(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(3000),
    });
    return { ok: res.ok, status: res.status, headers: res.headers };
  } catch {
    return { ok: false, status: 0, headers: undefined };
  }
}

function hasX402ChallengeHeader(headers?: Headers) {
  return Boolean(headers?.get("x402-request") || headers?.get("X-402-Request"));
}

function resolveTokenForEndpoint(endpoint: string): string | undefined {
  try {
    const raw = readFileSync(PROFILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as {
      endpoint?: {
        url?: string;
        auth?: {
          token?: string;
        };
      };
    };

    if (!parsed.endpoint?.url || !parsed.endpoint?.auth?.token) return undefined;
    const profileUrl = normalizeEndpoint(parsed.endpoint.url);
    return profileUrl === endpoint ? parsed.endpoint.auth.token : undefined;
  } catch {
    return undefined;
  }
}

export async function runSpecialistHealthcheck(
  input: SpecialistHealthcheckInput
): Promise<SpecialistHealthcheckResult> {
  if (!input.walletAddress || input.walletAddress.length < 32) {
    throw new Error("Valid wallet address is required for healthcheck.");
  }

  const endpoint = normalizeEndpoint(input.endpointUrl);
  const checkedAt = new Date().toISOString();
  const token = resolveTokenForEndpoint(endpoint);
  const tokenHeaders = token ? { [AUTH_HEADER_NAME]: token } : undefined;

  const rootProbe = await probe(endpoint, {
    method: "HEAD",
    redirect: "follow",
    headers: tokenHeaders,
  });
  const healthProbe = await probe(`${endpoint.replace(/\/$/, "")}/healthz`, { method: "GET" });
  const tagsProbe = await probe(`${endpoint.replace(/\/$/, "")}/api/tags`, {
    method: "GET",
    headers: tokenHeaders,
  });
  const x402CompletionProbe = await probe(`${endpoint.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    redirect: "follow",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: "probe",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    }),
  });

  const x402ChallengeOk =
    x402CompletionProbe.status === 402 && hasX402ChallengeHeader(x402CompletionProbe.headers);
  const insecureOpenCompletion = x402CompletionProbe.ok;
  const securityStatus: SpecialistHealthcheckResult["securityStatus"] = x402ChallengeOk
    ? "x402_challenge_detected"
    : insecureOpenCompletion
    ? "insecure_open_completion"
    : "unknown";

  const reachable = rootProbe.ok || healthProbe.ok || tagsProbe.ok;
  const x402Probe: SpecialistHealthcheckResult["x402Probe"] = x402ChallengeOk ? "ok" : "fail";

  const runtimeOk = tagsProbe.ok;

  const status: SpecialistHealthcheckResult["status"] =
    reachable && runtimeOk && x402Probe === "ok"
      ? "pass"
      : reachable && !insecureOpenCompletion
      ? "degraded"
      : "fail";

  const note =
    status === "pass"
      ? "Endpoint reachable, runtime probe succeeded (`/api/tags`), and `/v1/chat/completions` returned the required 402 + x402-request challenge."
    : insecureOpenCompletion
      ? "Endpoint served a completion without an x402 challenge. Healthcheck is fail-closed until `/v1/chat/completions` requires x402 payment."
    : status === "degraded"
      ? "Endpoint reachable but x402 challenge probing failed. Confirm `/v1/chat/completions` returns HTTP 402 with an x402-request header before registration."
      : "Endpoint unreachable or x402 challenge missing. Re-open tunnel and verify local runtime plus payment-enforcing gateway are listening.";

  return {
    status,
    reachable,
    x402Probe,
    securityStatus,
    endpoint,
    checkedAt,
    note,
  };
}
