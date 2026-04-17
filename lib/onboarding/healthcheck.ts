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
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
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
  const x402ModelsProbe = await probe(`${endpoint.replace(/\/$/, "")}/v1/models`, {
    method: "GET",
    redirect: "follow",
  });

  const reachable = rootProbe.ok || healthProbe.ok || tagsProbe.ok;
  const x402Probe: SpecialistHealthcheckResult["x402Probe"] =
    x402ModelsProbe.status === 402 || x402ModelsProbe.ok
      ? "ok"
      : x402ModelsProbe.status === 404 || x402ModelsProbe.status === 405
      ? "degraded"
      : x402ModelsProbe.status === 401 || x402ModelsProbe.status === 403
      ? "fail"
      : reachable
      ? "degraded"
      : "fail";

  const runtimeOk = tagsProbe.ok;

  const status: SpecialistHealthcheckResult["status"] =
    reachable && runtimeOk && x402Probe === "ok"
      ? "pass"
    : reachable
      ? "degraded"
      : "fail";

  const note =
    status === "pass"
      ? "Endpoint reachable, runtime probe succeeded (`/api/tags`), and x402 public path probe succeeded (`/v1/models`)."
    : status === "degraded"
      ? "Endpoint reachable but runtime or x402 probe is degraded. Confirm token-gated proxy is running and x402 public path (`/v1/*`) is exposed without token."
      : "Endpoint unreachable. Re-open tunnel and verify local runtime is listening.";

  return {
    status,
    reachable,
    x402Probe,
    endpoint,
    checkedAt,
    note,
  };
}
