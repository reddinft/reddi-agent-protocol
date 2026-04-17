"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TASK_TYPES } from "@/lib/capabilities/taxonomy";
import type { SpecialistListing } from "@/lib/registry/bridge";

function shortWallet(w: string) {
  if (!w || w.length < 12) return w;
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function formatUsd(v: number) {
  if (!v) return "free";
  return `$${v.toFixed(4)}/call`;
}

function taskLabel(id: string) {
  return TASK_TYPES.find((t) => t.id === id)?.label ?? id;
}


export default function SpecialistDetailPage() {
  const { wallet } = useParams<{ wallet: string }>();
  const [listing, setListing] = useState<SpecialistListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hire modal state
  const [hirePrompt, setHirePrompt] = useState("");
  const [hireStatus, setHireStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [hireResult, setHireResult] = useState<{ runId?: string; response?: string; x402Tx?: string; error?: string } | null>(null);
  const [feedbackScore, setFeedbackScore] = useState("8");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showHire, setShowHire] = useState(false);

  useEffect(() => {
    if (!wallet) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/registry");
        const data = await res.json();
        if (cancelled) return;
        const found = (data.listings as SpecialistListing[]).find(
          (l) => l.walletAddress === wallet
        );
        setListing(found ?? null);
        if (!found) setError("Specialist not found in registry.");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [wallet]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-muted-foreground animate-pulse">
        Loading specialist…
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <p className="text-red-400">{error ?? "Specialist not found."}</p>
        <Link href="/agents"><Button variant="outline">← Back to marketplace</Button></Link>
      </div>
    );
  }

  const cap = listing.capabilities;
  const onchain = listing.onchain;

  async function runHire() {
    if (!hirePrompt.trim()) return;
    setHireStatus("running");
    setHireResult(null);
    try {
      const res = await fetch("/api/onboarding/planner/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: hirePrompt,
          policy: {
            requiresHealthPass: listing?.health.status === "pass" ? true : undefined,
            requiresAttested: listing?.attestation.attested ? true : undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setHireResult({
          runId: data.result?.result?.runId,
          response: data.result?.result?.responsePreview,
          x402Tx: data.result?.result?.x402TxSignature,
        });
        setHireStatus("done");
      } else {
        setHireResult({ error: data.error });
        setHireStatus("error");
      }
    } catch (e) {
      setHireResult({ error: e instanceof Error ? e.message : "Request failed" });
      setHireStatus("error");
    }
  }

  async function sendFeedback() {
    if (!hireResult?.runId) return;
    const score = Math.max(1, Math.min(10, parseInt(feedbackScore, 10) || 5));
    await fetch("/api/onboarding/planner/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: hireResult.runId, score, notes: feedbackNote || undefined }),
    });
    setFeedbackSent(true);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Back */}
      <Link href="/agents" className="text-sm text-muted-foreground hover:text-white">← Back to marketplace</Link>

      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold font-mono">{shortWallet(listing.walletAddress)}</h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            listing.health.status === "pass"
              ? "text-green-400 border-green-500/30 bg-green-500/10"
              : listing.health.status === "fail"
              ? "text-red-400 border-red-500/30 bg-red-500/10"
              : "text-muted-foreground border-white/10 bg-white/5"
          }`}>
            {listing.health.status === "pass" ? "● Online" : listing.health.status === "fail" ? "○ Offline" : "○ Unknown"}
          </span>
          {listing.attestation.attested && (
            <span className="text-xs px-2 py-0.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]">✓ Attested</span>
          )}
        </div>
        <p className="font-mono text-xs text-muted-foreground/50 break-all">{listing.walletAddress}</p>
        {listing.pda && (
          <p className="text-xs text-muted-foreground/50">
            PDA:{" "}
            <a
              href={`https://explorer.solana.com/address/${listing.pda}?cluster=devnet`}
              target="_blank" rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              {shortWallet(listing.pda)}
            </a>
          </p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {[
          { label: "Reputation", value: onchain.reputationScore || "–" },
          { label: "Jobs completed", value: Number(onchain.jobsCompleted) || "–" },
          { label: "Avg feedback", value: listing.signals.feedbackCount ? listing.signals.avgFeedbackScore.toFixed(1) : "–" },
          { label: "Attestation acc.", value: onchain.attestationAccuracy ? `${onchain.attestationAccuracy}%` : "–" },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-card/30 p-3">
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      {cap && (
        <div className="space-y-4 rounded-xl border border-white/10 bg-card/20 p-5">
          <h2 className="text-base font-semibold">Capabilities</h2>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Task types</p>
              <div className="flex flex-wrap gap-1">
                {cap.taskTypes.map((t) => (
                  <Badge key={t} variant="outline" className="border-[#9945FF]/30 text-[#9945FF] bg-[#9945FF]/5">
                    {taskLabel(t)}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Settlement / privacy</p>
              <div className="flex flex-wrap gap-1">
                {cap.privacyModes.map((p) => (
                  <span key={p} className="text-xs px-2 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground">
                    {p === "per" ? "🔒 MagicBlock PER" : p === "vanish" ? "👻 Vanish Core" : "🌐 Public"}
                  </span>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div><span className="font-medium text-white">Input:</span> {cap.inputModes.join(", ")}</div>
              <div><span className="font-medium text-white">Output:</span> {cap.outputModes.join(", ")}</div>
              <div><span className="font-medium text-white">Base price:</span> {formatUsd(cap.baseUsd)}</div>
              <div><span className="font-medium text-white">Per call:</span> {formatUsd(cap.perCallUsd)}</div>
            </div>
            {cap.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {cap.tags.map((t) => (
                  <span key={t} className="text-xs px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground/60">#{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hire panel */}
      <div className="rounded-xl border border-[#9945FF]/30 bg-[#9945FF]/5 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Hire this specialist</h2>
          <Button
            size="sm"
            style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000", fontWeight: 600 }}
            onClick={() => setShowHire((v) => !v)}
          >
            {showHire ? "Close" : "Run task →"}
          </Button>
        </div>

        {showHire && (
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Describe the task for this specialist…"
              className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
              value={hirePrompt}
              onChange={(e) => setHirePrompt(e.target.value)}
              disabled={hireStatus === "running"}
            />
            <Button
              className="w-full"
              disabled={hireStatus === "running" || !hirePrompt.trim()}
              onClick={runHire}
            >
              {hireStatus === "running" ? "Running…" : "Execute task"}
            </Button>

            {hireResult && (
              <div className={`rounded-lg border p-3 text-xs space-y-1 ${
                hireStatus === "done" ? "border-green-500/30 bg-green-950/20 text-green-300"
                : "border-red-500/30 bg-red-950/20 text-red-300"
              }`}>
                {hireResult.runId && <p className="font-mono opacity-60">run: {hireResult.runId}</p>}
                {hireResult.x402Tx && <p className="font-mono opacity-60">x402 tx: {hireResult.x402Tx}</p>}
                {hireResult.error && <p>{hireResult.error}</p>}
                {hireResult.response && (
                  <p className="border-t border-white/10 pt-2 whitespace-pre-wrap opacity-90">{hireResult.response}</p>
                )}
              </div>
            )}

            {hireStatus === "done" && hireResult?.runId && !feedbackSent && (
              <div className="space-y-2 border border-white/10 rounded-lg p-3 bg-black/20">
                <p className="text-xs font-medium text-white">Rate this call (1–10)</p>
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={10} className="w-16 text-center" value={feedbackScore} onChange={(e) => setFeedbackScore(e.target.value)} />
                  <Input placeholder="Optional notes" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} />
                  <Button size="sm" onClick={sendFeedback}>Submit</Button>
                </div>
              </div>
            )}
            {feedbackSent && <p className="text-xs text-green-400">✓ Feedback submitted</p>}
          </div>
        )}
      </div>
    </div>
  );
}
