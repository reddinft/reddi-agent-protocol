"use client";

import { useState, useRef, useEffect } from "react";

interface TraceStep {
  delay: number;
  icon: string;
  section: string;
  lines: string[];
  type?: never;
}

interface HtmlPayload {
  type: "html";
  content: string;
}

type StreamPayload = TraceStep | HtmlPayload;

interface RenderedSection {
  icon: string;
  section: string;
  lines: string[];
}

const EXPLORER_BASE = "https://explorer.solana.com/tx";

function renderLine(line: string) {
  // Replace [EXPLORER:txhash] with a real link
  const match = line.match(/\[EXPLORER:([^\]]+)\]/);
  if (match) {
    const txHash = match[1];
    const before = line.slice(0, match.index);
    const linkText = "↗";
    return (
      <span>
        {before}
        <a
          href={`${EXPLORER_BASE}/${txHash}?cluster=devnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#14F195] hover:underline ml-1"
        >
          {linkText}
        </a>
      </span>
    );
  }
  // Colour ✅ lines green
  if (line.startsWith("✅")) {
    return <span className="text-[#14F195]">{line}</span>;
  }
  // Colour arrow lines dimmed
  if (line.startsWith("→")) {
    return <span className="text-muted-foreground">{line}</span>;
  }
  return <span>{line}</span>;
}

export default function DemoPage() {
  const [brief, setBrief] = useState("");
  const [running, setRunning] = useState(false);
  const [sections, setSections] = useState<RenderedSection[]>([]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [sections]);

  async function handleGenerate() {
    if (!brief.trim() || running) return;
    setRunning(true);
    setSections([]);
    setGeneratedHtml(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const payload = JSON.parse(line) as StreamPayload;
            if ("type" in payload && payload.type === "html") {
              setGeneratedHtml(payload.content);
            } else {
              const step = payload as TraceStep;
              setSections((prev) => [
                ...prev,
                { icon: step.icon, section: step.section, lines: step.lines },
              ]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      console.error("Demo stream error:", err);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left column — 40% */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold sol-gradient-text pb-1">
              Watch the agent economy work in real time
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter a brief. The consumer agent coordinates specialists, handles escrow, and returns
              a scored result — all on-chain.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">What kind of landing page do you want?</label>
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="e.g. A landing page for a Solana-native AI agent marketplace targeting developers"
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-card/30 p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-[#9945FF]/60"
            />
            <button
              onClick={handleGenerate}
              disabled={!brief.trim() || running}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  !brief.trim() || running
                    ? undefined
                    : "linear-gradient(135deg, #9945FF, #14F195)",
                color: !brief.trim() || running ? undefined : "#000",
                backgroundColor: !brief.trim() || running ? "rgba(255,255,255,0.05)" : undefined,
              }}
            >
              {running ? "Running pipeline..." : "Generate Landing Page →"}
            </button>
          </div>

          {/* Generated HTML preview */}
          {generatedHtml && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Generated output
              </p>
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <iframe
                  srcDoc={generatedHtml}
                  className="w-full h-64"
                  sandbox="allow-scripts"
                  title="Generated landing page preview"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right column — 60% */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">Debug Trace</h2>
            {running && (
              <span className="flex items-center gap-1.5 text-xs text-[#14F195]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#14F195] animate-pulse" />
                Live
              </span>
            )}
            {!running && sections.length > 0 && (
              <span className="text-xs text-muted-foreground">Complete</span>
            )}
          </div>

          <div
            ref={logRef}
            className="h-[520px] overflow-y-auto rounded-xl border border-white/10 bg-[#0a0a0a] p-4 font-mono text-xs space-y-4"
          >
            {sections.length === 0 && !running && (
              <p className="text-muted-foreground text-center mt-20">
                Enter a brief and click Generate to start the trace.
              </p>
            )}

            {sections.map((sec, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span>{sec.icon}</span>
                  <span>{sec.section}</span>
                </div>
                <div className="pl-6 space-y-0.5">
                  {sec.lines.map((line, j) => (
                    <div key={j} className="leading-relaxed">
                      {renderLine(line)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {running && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#9945FF] animate-ping" />
                <span>Processing...</span>
              </div>
            )}
          </div>

          {sections.length > 0 && !running && (
            <p className="text-xs text-muted-foreground text-right">
              Pipeline complete · {sections.length} stages logged
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
