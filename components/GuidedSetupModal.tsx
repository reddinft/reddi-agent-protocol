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

type ProbeResult = {
  ok?: boolean;
  status?: string;
  models?: string[];
  error?: string;
};

async function probeLocalOllamaTags() {
  const res = await fetch("http://127.0.0.1:11434/api/tags", {
    method: "GET",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) return { ok: false as const, models: [] as string[] };

  const data = (await res.json().catch(() => null)) as
    | { models?: Array<{ name?: string }> }
    | null;
  const models = Array.isArray(data?.models)
    ? data.models
        .map((entry) => entry?.name)
        .filter((name): name is string => Boolean(name))
    : [];

  return { ok: true as const, models };
}

const STEP_BADGE = "w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center";

const OLLAMA_COMMANDS: Record<Platform, string> = {
  macos: "brew install ollama\n# or download from https://ollama.com/download",
  linux: "curl -fsSL https://ollama.com/install.sh | sh",
  windows: "Download installer from https://ollama.com/download",
};

const MODEL_COMMAND = "ollama pull smollm2:135m";
const CLOUDFLARED_INSTALL: Record<Platform, string> = {
  macos: "brew install cloudflared",
  linux:
    "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/",
  windows: "winget install Cloudflare.cloudflared",
};
const CLOUDTUNNEL_COMMAND = "cloudflared tunnel --url http://localhost:11434";
const SSH_FALLBACK = "ssh -R 80:localhost:11434 nokey@localhost.run";

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
  const [ollamaStatus, setOllamaStatus] = useState<StepStatus>("idle");
  const [modelStatus, setModelStatus] = useState<StepStatus>("idle");
  const [tunnelStatus, setTunnelStatus] = useState<StepStatus>("idle");
  const [endpointInput, setEndpointInput] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [model, setModel] = useState("smollm2:135m");
  const [detailMessage, setDetailMessage] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [summaryEndpoint, setSummaryEndpoint] = useState("");
  const [summaryModel, setSummaryModel] = useState("smollm2:135m");

  const completedStep1 = ollamaStatus === "done";
  const completedStep2 = modelStatus === "done";
  const completedStep3 = tunnelStatus === "done";
  const completedStep4 = tunnelStatus === "done";

  const selectedOllamaCommand = useMemo(() => OLLAMA_COMMANDS[platform], [platform]);
  const selectedCloudflaredInstall = useMemo(() => CLOUDFLARED_INSTALL[platform], [platform]);

  const checkOllama = async () => {
    setOllamaStatus("checking");
    setDetailMessage("");

    try {
      const local = await probeLocalOllamaTags();
      if (local.ok) {
        setOllamaStatus("done");
        setDetailMessage("Ollama detected on your machine (localhost:11434). ✅");
        return;
      }
    } catch {
      // fall through to API probe
    }

    try {
      const res = await fetch("/api/register/local-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check: "ollama" }),
      });
      const data = (await res.json().catch(() => null)) as ProbeResult | null;
      if (res.ok && data?.ok) {
        setOllamaStatus("done");
        setDetailMessage("Ollama looks good.");
        return;
      }
      setOllamaStatus("error");
      setDetailMessage(
        "Could not detect Ollama on localhost:11434. Make sure `ollama serve` is running, then click Check Ollama again."
      );
    } catch {
      setOllamaStatus("error");
      setDetailMessage(
        "Could not detect Ollama on localhost:11434. Make sure `ollama serve` is running, then click Check Ollama again."
      );
    }
  };

  const checkModel = async () => {
    setModelStatus("checking");
    setDetailMessage("");

    try {
      const local = await probeLocalOllamaTags();
      setModels(local.models);
      const foundLocal = local.models.some((name) =>
        name.replace(/:latest$/, "").startsWith("smollm2:135m")
      );

      if (foundLocal) {
        setModelStatus("done");
        setModel("smollm2:135m");
        setSummaryModel("smollm2:135m");
        setDetailMessage("smollm2:135m is installed.");
        return;
      }
    } catch {
      // fall through to API probe
    }

    try {
      const res = await fetch("/api/register/local-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ check: "model", model: "smollm2:135m" }),
      });
      const data = (await res.json().catch(() => null)) as ProbeResult | null;
      const availableModels = Array.isArray(data?.models) ? data.models : [];
      setModels(availableModels);
      if (res.ok && data?.ok) {
        setModelStatus("done");
        setModel("smollm2:135m");
        setSummaryModel("smollm2:135m");
        setDetailMessage("smollm2:135m is installed.");
        return;
      }
      setModelStatus("error");
      setDetailMessage("Pull smollm2:135m, then check again.");
    } catch {
      setModelStatus("error");
      setDetailMessage("Could not check the model list.");
    }
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
        body: JSON.stringify({ endpoint: candidate }),
      });
      const data = (await res.json().catch(() => null)) as ProbeResult | null;
      if (data?.status === "ollama_detected") {
        const detectedModel = data.models?.[0] || model || "smollm2:135m";
        setTunnelStatus("done");
        setEndpoint(candidate);
        setSummaryEndpoint(candidate);
        setSummaryModel(detectedModel);
        if (!model) setModel(detectedModel);
        setDetailMessage("Tunnel is live and Ollama responded.");
        return;
      }
      if (data?.status === "reachable") {
        setTunnelStatus("error");
        setEndpoint(candidate);
        setSummaryEndpoint(candidate);
        setDetailMessage("Tunnel is reachable, but no Ollama detected.");
        return;
      }
      setTunnelStatus("error");
      setDetailMessage(data?.error || "Can't reach that URL. Is cloudflared still running?");
    } catch {
      setTunnelStatus("error");
      setDetailMessage("Can't reach that URL. Is cloudflared still running?");
    }
  };

  const finish = () => onComplete(summaryEndpoint || endpointInput.trim(), summaryModel || model || "smollm2:135m");

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
            title="Install Ollama"
            description="Get the local runtime onto your machine."
            completed={completedStep1}
          >
            <Tabs value={platform} onValueChange={(value) => setPlatform(value as Platform)}>
              <TabsList className="w-full justify-stretch">
                <TabsTrigger value="macos" className="flex-1">macOS</TabsTrigger>
                <TabsTrigger value="linux" className="flex-1">Linux</TabsTrigger>
                <TabsTrigger value="windows" className="flex-1">Windows</TabsTrigger>
              </TabsList>
              <TabsContent value="macos" className="mt-4">
                <CommandBlock command={selectedOllamaCommand} />
              </TabsContent>
              <TabsContent value="linux" className="mt-4">
                <CommandBlock command={selectedOllamaCommand} />
              </TabsContent>
              <TabsContent value="windows" className="mt-4">
                <CommandBlock command={selectedOllamaCommand} />
              </TabsContent>
            </Tabs>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={checkOllama} disabled={ollamaStatus === "checking"}>
                {ollamaStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check Ollama"}
              </Button>
              {ollamaStatus === "done" && <span className="text-sm text-green-500">✅ Step 1 done</span>}
              {ollamaStatus === "error" && <span className="text-sm text-red-500">Could not verify yet</span>}
            </div>
          </StepCard>

          <StepCard
            index={2}
            title="Pull smollm2:135m"
            description="~100MB download, fast enough for a fresh setup."
            completed={completedStep2}
            locked={!completedStep1}
          >
            <CommandBlock command={MODEL_COMMAND} />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={checkModel} disabled={modelStatus === "checking" || ollamaStatus !== "done"}>
                {modelStatus === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check model"}
              </Button>
              {models.length > 0 && <span className="text-xs text-muted-foreground">Found: {models.slice(0, 3).join(", ")}</span>}
              {modelStatus === "error" && <span className="text-sm text-red-500">Model not found yet</span>}
            </div>
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
                <CommandBlock command={CLOUDTUNNEL_COMMAND} />
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
                  <CommandBlock command={SSH_FALLBACK} />
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
              <p>✅ Ollama: running</p>
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
