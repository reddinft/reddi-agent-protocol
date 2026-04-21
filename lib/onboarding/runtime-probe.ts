export type RuntimeTarget = "auto" | "ollama" | "llama_cpp" | "vllm" | "lm_studio";
export type RuntimeDetected = "unknown" | "ollama" | "openai_compatible";
export type RuntimeProbeStatus = "runtime_detected" | "reachable" | "unreachable" | "invalid_url";

export type RuntimeProbeResult = {
  ok: boolean;
  status: RuntimeProbeStatus;
  detectedRuntime: RuntimeDetected;
  models: string[];
  hints: string[];
  error?: string;
};

function normalizeEndpoint(endpoint: string) {
  const raw = endpoint.trim();
  if (!raw) throw new Error("Endpoint URL is required.");
  try {
    return raw.startsWith("http://") || raw.startsWith("https://")
      ? new URL(raw)
      : new URL(`https://${raw}`);
  } catch {
    throw new Error("Invalid endpoint URL.");
  }
}

function modelHints(runtime: RuntimeDetected) {
  if (runtime === "ollama") return ["Detected Ollama-compatible endpoint (/api/tags)."];
  if (runtime === "openai_compatible") {
    return ["Detected OpenAI-compatible endpoint (/v1/models).", "Works for llama.cpp, vLLM, and LM Studio local server modes."];
  }
  return ["Endpoint is reachable, but runtime API shape was not detected."];
}

async function probeOpenAI(origin: string) {
  const res = await fetch(`${origin}/v1/models`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const body = (await res.json().catch(() => null)) as
    | { data?: Array<{ id?: string }> }
    | null;

  const models = Array.isArray(body?.data)
    ? body.data.map((m) => m?.id).filter((id): id is string => Boolean(id))
    : [];

  return {
    runtime: "openai_compatible" as const,
    models,
  };
}

async function probeOllama(origin: string) {
  const res = await fetch(`${origin}/api/tags`, {
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) return null;

  const body = (await res.json().catch(() => null)) as
    | { models?: Array<{ name?: string }> }
    | null;

  const models = Array.isArray(body?.models)
    ? body.models.map((m) => m?.name).filter((name): name is string => Boolean(name))
    : [];

  return {
    runtime: "ollama" as const,
    models,
  };
}

export async function probeRuntimeEndpoint(endpoint: string, target: RuntimeTarget = "auto"): Promise<RuntimeProbeResult> {
  try {
    const url = normalizeEndpoint(endpoint);
    const origin = url.origin;

    const shouldTryOpenAI = target === "auto" || target === "llama_cpp" || target === "vllm" || target === "lm_studio";
    const shouldTryOllama = target === "auto" || target === "ollama";

    if (shouldTryOpenAI) {
      const openai = await probeOpenAI(origin);
      if (openai) {
        return {
          ok: true,
          status: "runtime_detected",
          detectedRuntime: openai.runtime,
          models: openai.models,
          hints: modelHints(openai.runtime),
        };
      }
    }

    if (shouldTryOllama) {
      const ollama = await probeOllama(origin);
      if (ollama) {
        return {
          ok: true,
          status: "runtime_detected",
          detectedRuntime: ollama.runtime,
          models: ollama.models,
          hints: modelHints(ollama.runtime),
        };
      }
    }

    const healthRes = await fetch(`${origin}/healthz`, {
      signal: AbortSignal.timeout(5000),
    });

    if (healthRes.ok) {
      return {
        ok: true,
        status: "reachable",
        detectedRuntime: "unknown",
        models: [],
        hints: modelHints("unknown"),
      };
    }

    return {
      ok: false,
      status: "unreachable",
      detectedRuntime: "unknown",
      models: [],
      hints: ["Check URL, tunnel process, and port mapping."],
      error: "Endpoint is not reachable.",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    const status: RuntimeProbeStatus = /invalid endpoint url|required/i.test(msg) ? "invalid_url" : "unreachable";
    return {
      ok: false,
      status,
      detectedRuntime: "unknown",
      models: [],
      hints: ["Check URL format and that the server is publicly reachable."],
      error: msg,
    };
  }
}
