"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Check, ChevronDown, Copy, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface GuidedSetupModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: (endpoint: string, model: string) => void;
}

type Platform = "macos" | "linux" | "windows";
type StepStatus = "idle" | "checking" | "done" | "error";
type RuntimeChoice = "ollama" | "llama_cpp" | "vllm" | "lm_studio";

type ProbeResult = {
  ok?: boolean;
  status?: string;
  runtimeStatus?: string;
  detectedRuntime?: string;
  models?: string[];
  error?: string;
};

const STEP_BADGE = "w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center";

const CLOUDFLARED_INSTALL: Record<Platform, string> = {
  macos: "brew install cloudflared",
  linux:
    "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/",
  windows: "winget install Cloudflare.cloudflared",
};

const RUNTIME_CONFIG: Record<
  RuntimeChoice,
  {
    label: string;
    defaultBaseUrl: string;
    runtimeTarget: "ollama" | "llama_cpp" | "vllm" | "lm_studio";
    install: Record<Platform, string>;
    startCommand: string;
    modelCommand: string;
    verifyRuntime: (baseUrl: string) => string;
    verifyModel: (baseUrl: string) => string;
    modelHint: string;
  }
> = {
  ollama: {
    label: "Ollama",
    defaultBaseUrl: "http://127.0.0.1:11434",
    runtimeTarget: "ollama",
    install: {
      macos: "brew install ollama\n# or download from https://ollama.com/download",
      linux: "curl -fsSL https://ollama.com/install.sh | sh",
      windows: "Download installer from https://ollama.com/download",
    },
    startCommand: "ollama serve",
    modelCommand: "ollama pull smollm2:135m",
    verifyRuntime: (base) => `curl -s ${base.replace(/\/$/, "")}/api/tags`,
    verifyModel: () => "ollama list",
    modelHint: "Confirm smollm2:135m appears in the model list.",
  },
  llama_cpp: {
    label: "llama.cpp",
    defaultBaseUrl: "http://127.0.0.1:8080",
    runtimeTarget: "llama_cpp",
    install: {
      macos: "brew install llama.cpp  # or build from source",
      linux: "git clone https://github.com/ggerganov/llama.cpp && make -C llama.cpp",
      windows: "Use llama.cpp release binaries or build with CMake",
    },
    startCommand: "./llama-server -m /path/to/model.gguf --port 8080",
    modelCommand: "Use your GGUF model path in llama-server (example above).",
    verifyRuntime: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    verifyModel: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    modelHint: "Confirm your loaded model appears in data[].id.",
  },
  vllm: {
    label: "vLLM",
    defaultBaseUrl: "http://127.0.0.1:8000",
    runtimeTarget: "vllm",
    install: {
      macos: "pip install vllm  # GPU setup varies on macOS",
      linux: "pip install vllm",
      windows: "Use WSL/Linux environment, then pip install vllm",
    },
    startCommand: "python -m vllm.entrypoints.openai.api_server --model /path/to/model",
    modelCommand: "Start vLLM with your target model path in --model.",
    verifyRuntime: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    verifyModel: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    modelHint: "Confirm your model appears in data[].id.",
  },
  lm_studio: {
    label: "LM Studio",
    defaultBaseUrl: "http://127.0.0.1:1234",
    runtimeTarget: "lm_studio",
    install: {
      macos: "Install LM Studio from https://lmstudio.ai",
      linux: "Install LM Studio from https://lmstudio.ai",
      windows: "Install LM Studio from https://lmstudio.ai",
    },
    startCommand: "Open Local Server tab → select model → Start Server",
    modelCommand: "Load your model in LM Studio and start Local Server.",
    verifyRuntime: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    verifyModel: (base) => `curl -s ${base.replace(/\/$/, "")}/v1/models`,
    modelHint: "Confirm your selected model appears in data[].id.",
  },
};

function normalizeBaseUrl(raw: string) {
  const value = raw.trim();
  if (!value) throw new Error("Base URL is required");
  return value.startsWith("http://") || value.startsWith("https://") ? value : `http://${value}`;
}

async function probeLocalRuntime(baseUrl: string, runtime: RuntimeChoice) {
  const base = normalizeBaseUrl(baseUrl).replace(/\/$/, "");
  const path = runtime === "ollama" ? "/api/tags" : "/v1/models";
  const res = await fetch(`${base}${path}`, {
    method: "GET",
    signal: AbortSignal.timeout(3000),
  });

  if (!res.ok) return { ok: false as const, models: [] as string[] };

  const data = (await res.json().catch(() => null)) as
    | { models?: Array<{ name?: string }>; data?: Array<{ id?: string }> }
    | null;

  const models = runtime === "ollama"
    ? Array.isArray(data?.models)
      ? data.models.map((m) => m?.name).filter((name): name is string => Boolean(name))
      : []
    : Array.isArray(data?.data)
      ? data.data.map((m) => m?.id).filter((id): id is string => Boolean(id))
      : [];

  return { ok: true as const, models };
}

function CommandBlock({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-3 space-y-2">
      <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs text-gray-900 dark:text-gray-100">{command}</pre>
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={copy} className="h-7 gap-1.5 text-xs">
          <Copy className="h-3.5 w-3.5" />
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function StepCard({
  index,
  title,
  description,
  completed,
  locked,
  children,
}: {
  index: number;
  title: string;
  description: string;
  completed: boolean;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm space-y-4",
        locked && "opacity-40 pointer-events-none"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={STEP_BADGE}>{completed ? <Check className="h-4 w-4" /> : index}</div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export default function GuidedSetupModal({ open, onClose, onComplete }: GuidedSetupModalProps) {
  const [platform, setPlatform] = useState<Platform>("macos");
  const [runtimeChoice, setRuntimeChoice] = useState<RuntimeChoice>("ollama");
  const [runtimeBaseUrl, setRuntimeBaseUrl] = useState(RUNTIME_CONFIG.ollama.defaultBaseUrl);
  const [runtimeStatus, setRuntimeStatus] = useState<StepStatus>("idle");
  const [modelStatus, setModelStatus] = useState<StepStatus>("idle");
  const [tunnelStatus, setTunnelStatus] = useState<StepStatus>("idle");
  const [endpointInput, setEndpointInput] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("smollm2:135m");
  const [detailMessage, setDetailMessage] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [summaryEndpoint, setSummaryEndpoint] = useState("");
  const [summaryModel, setSummaryModel] = useState("smollm2:135m");

  const runtimeConfig = useMemo(() => RUNTIME_CONFIG[runtimeChoice], [runtimeChoice]);

  const completedStep1 = runtimeStatus === "done";
  const completedStep2 = modelStatus === "done";
  const completedStep3 = tunnelStatus === "done";
  const completedStep4 = tunnelStatus === "done";

  const selectedRuntimeInstall = useMemo(() => runtimeConfig.install[platform], [platform, runtimeConfig]);
  const selectedCloudflaredInstall = useMemo(() => CLOUDFLARED_INSTALL[platform], [platform]);
  const tunnelCommand = useMemo(
    () => `cloudflared tunnel --url ${runtimeBaseUrl || runtimeConfig.defaultBaseUrl}`,
    [runtimeBaseUrl, runtimeConfig]
  );
  const sshFallback = useMemo(() => {
    try {
      const url = new URL(normalizeBaseUrl(runtimeBaseUrl || runtimeConfig.defaultBaseUrl));
      const port = url.port || (url.protocol === "https:" ? "443" : "80");
      return `ssh -R 80:localhost:${port} nokey@localhost.run`;
    } catch {
      return "ssh -R 80:localhost:11434 nokey@localhost.run";
    }
  }, [runtimeBaseUrl, runtimeConfig]);

  const checkRuntime = async () => {
    setRuntimeStatus("checking");
    setDetailMessage("");

    try {
      const local = await probeLocalRuntime(runtimeBaseUrl, runtimeChoice);
      if (local.ok) {
        setRuntimeStatus("done");
        setModels(local.models);
        setDetailMessage(`${runtimeConfig.label} detected at ${runtimeBaseUrl}. ✅`);
        return;
      }
    } catch {
      // fall through to fallback probe
    }

    try {
      const res = await fetch("/api/register/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: runtimeBaseUrl, runtimeTarget: runtimeConfig.runtimeTarget }),
      });
      const data = (await res.json().catch(() => null)) as ProbeResult | null;
      if (res.ok && data?.ok && (data.runtimeStatus === "runtime_detected" || data.status === "ollama_detected")) {
        setRuntimeStatus("done");
        setModels(Array.isArray(data.models) ? data.models : []);
        setDetailMessage(`${runtimeConfig.label} looks good.`);
        return;
      }
      setRuntimeStatus("error");
      setDetailMessage(`Could not detect ${runtimeConfig.label} at ${runtimeBaseUrl}. Confirm server is running and try again.`);
    } catch {
      setRuntimeStatus("error");
      setDetailMessage(`Could not detect ${runtimeConfig.label} at ${runtimeBaseUrl}. Confirm server is running and try again.`);
    }
  };

  const checkModel = async () => {
    setModelStatus("checking");
    setDetailMessage("");

    try {
      const local = await probeLocalRuntime(runtimeBaseUrl, runtimeChoice);
      setModels(local.models);
      if (local.ok && local.models.length > 0) {
        setModelStatus("done");
        const preferred = local.models[0] || model;
        setModel(preferred);
        setSummaryModel(preferred);
        setDetailMessage(`Model endpoint is ready. Found ${local.models.length} model${local.models.length === 1 ? "" : "s"}.`);
        return;
      }
    } catch {
      // fall through
    }

    setModelStatus("error");
    setDetailMessage(`Could not confirm loaded models yet for ${runtimeConfig.label}.`);
  };

  const confirmRuntimeManually = () => {
    setRuntimeStatus("done");
    setDetailMessage("Manual override enabled for Step 1. Continuing to Step 2.");
  };

  const confirmModelManually = () => {
    setModelStatus("done");
    setSummaryModel(model || "local-model");
    setDetailMessage("Manual override enabled for Step 2. Continuing to Step 3.");
  };

  const checkTunnel = async () => {
    const candidate = endpointInput.trim();
    if (!candidate) {
      setTunnelStatus("error");
      setDetailMessage("Paste your cloudflared URL first.");
      return;
    }

    setTunnelStatus("checking");
    setDetailMessage("");
    try {
      const res = await fetch("/api/register/probe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: candidate, runtimeTarget: runtimeConfig.runtimeTarget }),
      });
      const data = (await res.json().catch(() => null)) as ProbeResult | null;
      if (data?.runtimeStatus === "runtime_detected" || data?.status === "ollama_detected") {
        const detectedModel = data.models?.[0] || model || "local-model";
        setTunnelStatus("done");
        setEndpoint(candidate);
        setSummaryEndpoint(candidate);
        setSummaryModel(detectedModel);
        if (!model) setModel(detectedModel);
        setDetailMessage("Tunnel is live and runtime responded.");
        return;
      }
      if (data?.status === "reachable") {
        setTunnelStatus("error");
        setEndpoint(candidate);
        setSummaryEndpoint(candidate);
        setDetailMessage("Tunnel is reachable, but runtime API was not detected.");
        return;
      }
      setTunnelStatus("error");
      setDetailMessage(data?.error || "Can't reach that URL. Is cloudflared still running?");
    } catch {
      setTunnelStatus("error");
      setDetailMessage("Can't reach that URL. Is cloudflared still running?");
    }
  };

  const finish = () => onComplete(summaryEndpoint || endpointInput.trim(), summaryModel || model || "local-model");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Quick Setup</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Get your first agent online</h2>
            <p className="mt-1 text-sm text-muted-foreground">Four checks, one clean path.</p>
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close guided setup">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <StepCard
            index={1}
            title="Install local runtime"
            description="Choose your local runtime and verify the server is reachable."
            completed={completedStep1}
          >
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Runtime</p>
              <select
                value={runtimeChoice}
                onChange={(e) => {
                  const next = e.target.value as RuntimeChoice;
                  setRuntimeChoice(next);
                  setRuntimeBaseUrl(RUNTIME_CONFIG[next].defaultBaseUrl);
                  setRuntimeStatus("idle");
                  setModelStatus("idle");
                  setDetailMessage("");
                }}
                className="w-full bg-background border border-white/10 rounded-md px-3 py-2 text-sm"
              >
                <option value="ollama">Ollama</option>
                <option value="llama_cpp">llama.cpp</option>
                <option value="vllm">vLLM</option>
                <option value="lm_studio">LM Studio</option>
              </select>
            </div>

            <Tabs value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <TabsList className="w-full justify-stretch">
                <TabsTrigger value="macos" className="flex-1">macOS</TabsTrigger>
                <TabsTrigger value="linux" className="flex-1">Linux</TabsTrigger>
                <TabsTrigger value="windows" className="flex-1">Windows</TabsTrigger>
              </TabsList>
              <TabsContent value="macos" className="mt-4">
                <CommandBlock command={selectedRuntimeInstall} />
              </TabsContent>
              <TabsContent value="linux" className="mt-4">
                <CommandBlock command={selectedRuntimeInstall} />
              </TabsContent>
              <TabsContent value="windows" className="mt-4">
                <CommandBlock command={selectedRuntimeInstall} />
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Start server</p>
              <CommandBlock command={runtimeConfig.startCommand} />
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Runtime base URL</p>
              <Input
                value={runtimeBaseUrl}
                onChange={(e) => setRuntimeBaseUrl(e.target.value)}
                placeholder={runtimeConfig.defaultBaseUrl}
              />
              <p className="text-xs text-muted-foreground">
                {runtimeChoice === "ollama"
                  ? "Expected probe path: /api/tags"
                  : "Expected probe path: /v1/models"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={checkRuntime} disabled={runtimeStatus === "checking"}>
                {runtimeStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check runtime"}
              </Button>
              {runtimeStatus === "done" && <span className="text-sm text-green-500">✅ Step 1 done</span>}
              {runtimeStatus === "error" && <span className="text-sm text-red-500">Could not verify yet</span>}
              {runtimeStatus === "error" && (
                <Button type="button" variant="secondary" size="sm" onClick={confirmRuntimeManually}>
                  I verified manually, continue
                </Button>
              )}
            </div>

            {runtimeStatus === "error" && (
              <div className="rounded-xl border border-amber-300/40 bg-amber-50/70 dark:bg-amber-900/10 p-3 space-y-2 text-sm">
                <p className="text-muted-foreground">Manual verification:</p>
                <CommandBlock command={runtimeConfig.verifyRuntime(runtimeBaseUrl || runtimeConfig.defaultBaseUrl)} />
                <p className="text-xs text-muted-foreground">
                  If this returns model info, {runtimeConfig.label} is reachable.
                </p>
              </div>
            )}
          </StepCard>

          <StepCard
            index={2}
            title="Load your first model"
            description="Confirm your selected runtime has at least one model loaded."
            completed={completedStep2}
            locked={!completedStep1}
          >
            <CommandBlock command={runtimeConfig.modelCommand} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={checkModel} disabled={modelStatus === "checking" || runtimeStatus !== "done"}>
                {modelStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check model"}
              </Button>
              {models.length > 0 && <span className="text-xs text-muted-foreground">Found: {models.slice(0, 3).join(", ")}</span>}
              {modelStatus === "error" && <span className="text-sm text-red-500">Model not found yet</span>}
              {modelStatus === "error" && (
                <Button type="button" variant="secondary" size="sm" onClick={confirmModelManually}>
                  I verified manually, continue
                </Button>
              )}
            </div>
            {modelStatus === "error" && (
              <div className="rounded-xl border border-amber-300/40 bg-amber-50/70 dark:bg-amber-900/10 p-3 space-y-2 text-sm">
                <p className="text-muted-foreground">Manual verification:</p>
                <CommandBlock command={runtimeConfig.verifyModel(runtimeBaseUrl || runtimeConfig.defaultBaseUrl)} />
                <p className="text-xs text-muted-foreground">{runtimeConfig.modelHint}</p>
              </div>
            )}
          </StepCard>

          <StepCard
            index={3}
            title="Start the tunnel"
            description="cloudflared gives you a public HTTPS URL, no account needed."
            completed={completedStep3}
            locked={!completedStep2}
          >
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Install cloudflared</p>
                <CommandBlock command={selectedCloudflaredInstall} />
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Start tunnel</p>
                <CommandBlock command={tunnelCommand} />
              </div>
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-muted-foreground">Paste the https:// URL from your terminal output.</p>
                  <Input
                    value={endpointInput}
                    onChange={(e) => setEndpointInput(e.target.value)}
                    placeholder="https://random-words.trycloudflare.com"
                  />
                </div>
                <Button type="button" variant="outline" onClick={checkTunnel} disabled={tunnelStatus === "checking" || modelStatus !== "done"}>
                  {tunnelStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check ✓"}
                </Button>
              </div>
              <details className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  <span className="inline-flex items-center gap-2"><ChevronDown className="h-4 w-4" />Alternative: zero-install with SSH</span>
                </summary>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <CommandBlock command={sshFallback} />
                  <p>Copy the https:// URL from the terminal output above.</p>
                </div>
              </details>
            </div>
          </StepCard>

          <StepCard
            index={4}
            title="All set"
            description="Your form will be filled in when you continue."
            completed={completedStep4}
            locked={!completedStep3}
          >
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-4 space-y-2 text-sm">
              <p>✅ Runtime: {runtimeConfig.label}</p>
              <p>✅ Model: {summaryModel || model}</p>
              <p className="break-all">✅ Endpoint: {summaryEndpoint || endpoint || "paste and check your URL first"}</p>
              <p className="text-muted-foreground">Your registration form will be pre-filled when you click continue.</p>
            </div>
            <Button type="button" onClick={finish} disabled={tunnelStatus !== "done"} className="w-full">
              Register my agent →
            </Button>
          </StepCard>

          {detailMessage && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-3 text-sm text-muted-foreground">
              {detailMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
