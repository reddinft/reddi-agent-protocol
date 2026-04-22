import type { InvokeInput, InvokeOutput, QualitySignalInput, QualitySignalOutput, ResolveInput, ResolveOutput } from "@/lib/mcp/tools";
import { OPENCLAW_SOURCE_ID } from "@/lib/integrations/source-adapter/profiles/openclaw";

export type OpenClawConnectorConfig = {
  baseUrl: string;
  apiKey?: string;
  timeoutMs?: number;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

async function postJson<T>(cfg: OpenClawConnectorConfig, path: string, payload: unknown): Promise<T> {
  const endpoint = `${normalizeBaseUrl(cfg.baseUrl)}${path}`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };

  if (cfg.apiKey) {
    headers["x-reddi-agent-key"] = cfg.apiKey;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(cfg.timeoutMs ?? 12000),
  });

  const body = (await res.json().catch(() => null)) as T | { error?: string } | null;

  if (!res.ok) {
    const err = (body as { error?: string } | null)?.error ?? `${path} failed with status ${res.status}`;
    throw new Error(err);
  }

  if (!body) {
    throw new Error(`${path} returned empty JSON response`);
  }

  return body as T;
}

export async function openClawResolveSpecialist(cfg: OpenClawConnectorConfig, input: ResolveInput) {
  return postJson<ResolveOutput>(cfg, "/api/planner/tools/resolve", {
    ...input,
    policy: {
      ...input.policy,
      preferredSource: input.policy?.preferredSource ?? OPENCLAW_SOURCE_ID,
    },
  });
}

export async function openClawInvokeSpecialist(cfg: OpenClawConnectorConfig, input: InvokeInput) {
  return postJson<InvokeOutput>(cfg, "/api/planner/tools/invoke", input);
}

export async function openClawSubmitQualitySignal(cfg: OpenClawConnectorConfig, input: QualitySignalInput) {
  return postJson<QualitySignalOutput>(cfg, "/api/planner/tools/signal", input);
}

export async function openClawSupervisorOrchestrate(cfg: OpenClawConnectorConfig, input: {
  task: string;
  prompt: string;
  policy?: ResolveInput["policy"];
  consumerWallet?: string;
}) {
  const resolved = await openClawResolveSpecialist(cfg, {
    task: input.task,
    policy: input.policy,
  });

  if (!resolved.ok || !resolved.candidate) {
    return {
      ok: false as const,
      phase: "resolve" as const,
      error: resolved.error ?? "No candidate available",
      resolved,
    };
  }

  const invoked = await openClawInvokeSpecialist(cfg, {
    prompt: input.prompt,
    targetWallet: resolved.candidate.walletAddress,
    consumerWallet: input.consumerWallet,
    policy: input.policy,
  });

  return {
    ok: invoked.ok,
    phase: invoked.ok ? ("invoke" as const) : ("invoke_failed" as const),
    resolved,
    invoked,
  };
}
