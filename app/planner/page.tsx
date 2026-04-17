"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TASK_TYPES, PRIVACY_MODES } from "@/lib/capabilities/taxonomy";
import type { OrchestratorPolicy } from "@/lib/orchestrator/policy";

type RunRecord = {
  runId: string;
  createdAt: string;
  selectedWallet?: string;
  endpointUrl?: string;
  status: "completed" | "failed";
  challengeSeen: boolean;
  paymentSatisfied: boolean;
  x402TxSignature?: string;
  responsePreview?: string;
  error?: string;
  trace?: string[];
};

type Candidate = {
  walletAddress: string;
  endpointUrl?: string;
  score?: number;
  reasons?: string[];
};

type ExecuteResult = {
  ok: boolean;
  result?: {
    result?: RunRecord;
  };
  candidates?: Candidate[];
  error?: string;
};

export default function PlannerPage() {
  const [policy, setPolicy] = useState<OrchestratorPolicy | null>(null);
  const [prompt, setPrompt] = useState("");
  const [taskTypeHint, setTaskTypeHint] = useState("");
  const [privacyOverride, setPrivacyOverride] = useState("");
  const [requireAttestation, setRequireAttestation] = useState<boolean | null>(null);

  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [runResult, setRunResult] = useState<RunRecord | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [execError, setExecError] = useState("");

  const [feedbackScore, setFeedbackScore] = useState("8");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Load saved policy
  useEffect(() => {
    fetch("/api/orchestrator/policy")
      .then((r) => r.json())
      .then((d) => { if (d.ok) setPolicy(d.policy); })
      .catch(() => {});
  }, []);

  const execute = useCallback(async () => {
    if (!prompt.trim()) return;
    setStatus("running");
    setRunResult(null);
    setCandidates([]);
    setExecError("");
    setFeedbackSent(false);
    setFeedbackMsg("");

    const body: Record<string, unknown> = { prompt };
    const pol: Record<string, unknown> = {};
    if (privacyOverride) pol.requiredPrivacyMode = privacyOverride;
    if (requireAttestation !== null) pol.requiresAttested = requireAttestation;
    if (policy) {
      pol.requiresHealthPass = true;
      if (policy.requireAttestation) pol.requiresAttested = true;
      if (policy.maxPerTaskUsd > 0) pol.maxPerCallUsd = policy.maxPerTaskUsd;
    }
    if (Object.keys(pol).length) body.policy = pol;

    try {
      const res = await fetch("/api/onboarding/planner/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: ExecuteResult = await res.json();
      setCandidates(data.candidates ?? []);
      if (data.ok && data.result?.result) {
        setRunResult(data.result.result);
        setStatus("done");
      } else {
        setExecError(data.error ?? data.result?.result?.error ?? "No eligible specialist found.");
        setRunResult(data.result?.result ?? null);
        setStatus("error");
      }
    } catch (e) {
      setExecError(e instanceof Error ? e.message : "Request failed");
      setStatus("error");
    }
  }, [prompt, privacyOverride, requireAttestation, policy]);

  async function sendFeedback() {
    if (!runResult?.runId) return;
    const score = Math.max(1, Math.min(10, parseInt(feedbackScore, 10) || 5));
    try {
      const res = await fetch("/api/onboarding/planner/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: runResult.runId, score, notes: feedbackNote || undefined }),
      });
      const data = await res.json();
      setFeedbackSent(true);
      setFeedbackMsg(
        data.ok
          ? `✓ Saved${data.result?.reputationCommit?.ok ? " + on-chain reputation committed" : ""}.`
          : `Error: ${data.error}`
      );
    } catch (e) {
      setFeedbackMsg(e instanceof Error ? e.message : "Feedback failed");
    }
  }

  const policyActive = policy?.enabled;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Planner</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Run a task — the planner selects the best available specialist, negotiates payment, and delivers the result.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orchestrator">
            <Button size="sm" variant="outline">⚙ Settings</Button>
          </Link>
          <Link href="/runs">
            <Button size="sm" variant="outline">History →</Button>
          </Link>
        </div>
      </div>

      {/* Policy status banner */}
      {policy && (
        <div className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between gap-4 ${
          policyActive
            ? "border-[#14F195]/30 bg-[#14F195]/5 text-[#14F195]"
            : "border-yellow-500/30 bg-yellow-950/20 text-yellow-300"
        }`}>
          <span>
            {policyActive
              ? `✓ Marketplace active — budget $${policy.maxPerTaskUsd}/task · $${policy.dailyBudgetUsd}/day · ${policy.preferredPrivacyMode} settlement`
              : "⚠ Specialist marketplace is disabled in settings."}
          </span>
          {!policyActive && (
            <Link href="/orchestrator">
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">Enable →</Button>
            </Link>
          )}
        </div>
      )}

      {/* Prompt input */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Task prompt</Label>
        <textarea
          rows={4}
          placeholder="Describe the task you want a specialist to complete…"
          className="w-full rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={status === "running"}
        />
      </div>

      {/* Policy overrides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Task type hint</Label>
          <select
            value={taskTypeHint}
            onChange={(e) => setTaskTypeHint(e.target.value)}
            className="w-full text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
          >
            <option value="">Auto-detect</option>
            {TASK_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Settlement override</Label>
          <select
            value={privacyOverride}
            onChange={(e) => setPrivacyOverride(e.target.value)}
            className="w-full text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
          >
            <option value="">Use policy default</option>
            {PRIVACY_MODES.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Attestation</Label>
          <select
            value={requireAttestation === null ? "" : String(requireAttestation)}
            onChange={(e) => setRequireAttestation(e.target.value === "" ? null : e.target.value === "true")}
            className="w-full text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
          >
            <option value="">Use policy default</option>
            <option value="true">Require attested</option>
            <option value="false">Any specialist</option>
          </select>
        </div>
      </div>

      {/* Execute */}
      <Button
        className="w-full py-5 text-base font-semibold"
        style={status !== "running" && prompt.trim() ? { background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000" } : {}}
        disabled={status === "running" || !prompt.trim()}
        onClick={execute}
      >
        {status === "running" ? "Finding specialist + executing…" : "Run task →"}
      </Button>

      {/* Candidates panel */}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Candidate selection</p>
          <div className="space-y-1">
            {candidates.map((c, i) => (
              <div key={c.walletAddress} className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-3 ${
                i === 0 ? "border-[#14F195]/30 bg-[#14F195]/5" : "border-white/10 bg-white/5"
              }`}>
                <span className={i === 0 ? "text-[#14F195] font-medium" : "text-muted-foreground"}>
                  {i === 0 ? "✓ Selected" : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-muted-foreground/70">{c.walletAddress.slice(0, 8)}…</span>
                  {c.reasons && c.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {c.reasons.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs border-white/10 text-muted-foreground/60 px-1.5 py-0">{r}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result panel */}
      {(status === "done" || status === "error") && (
        <div className={`rounded-xl border p-5 space-y-3 ${
          status === "done"
            ? "border-green-500/30 bg-green-950/20"
            : "border-red-500/30 bg-red-950/20"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${status === "done" ? "text-green-300" : "text-red-300"}`}>
              {status === "done" ? "✓ Task completed" : "✗ Task failed"}
            </span>
            {runResult?.runId && (
              <span className="font-mono text-xs text-muted-foreground/60">{runResult.runId}</span>
            )}
          </div>

          {runResult?.x402TxSignature && (
            <p className="text-xs font-mono text-muted-foreground/70">
              x402 tx: {runResult.x402TxSignature}
            </p>
          )}

          {runResult?.trace && runResult.trace.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground">
                Execution trace ({runResult.trace.length} steps)
              </summary>
              <div className="mt-2 space-y-0.5">
                {runResult.trace.map((t, i) => (
                  <div key={i} className="font-mono text-muted-foreground/60">{t}</div>
                ))}
              </div>
            </details>
          )}

          {execError && <p className="text-sm text-red-300">{execError}</p>}

          {runResult?.responsePreview && (
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-muted-foreground mb-1">Response</p>
              <p className="text-sm text-white whitespace-pre-wrap">{runResult.responsePreview}</p>
            </div>
          )}
        </div>
      )}

      {/* Feedback */}
      {status === "done" && runResult?.runId && !feedbackSent && (
        <div className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-3">
          <h3 className="text-sm font-semibold">Rate this specialist call</h3>
          <p className="text-xs text-muted-foreground">
            Your feedback improves routing. Scores ≥3 trigger an on-chain reputation commit.
          </p>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Score (1–10)</Label>
              <Input
                type="number" min={1} max={10} className="w-20 text-center"
                value={feedbackScore}
                onChange={(e) => setFeedbackScore(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Input
                placeholder="What was good or bad about this result?"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
              />
            </div>
          </div>
          <Button size="sm" onClick={sendFeedback}>Submit feedback</Button>
        </div>
      )}

      {feedbackMsg && (
        <p className="text-xs text-muted-foreground">{feedbackMsg}</p>
      )}

      {/* Empty state */}
      {status === "idle" && !prompt && (
        <div className="rounded-xl border border-white/10 bg-card/10 p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No specialists registered yet?</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link href="/onboarding">
              <Button size="sm" variant="outline">Register as specialist →</Button>
            </Link>
            <Link href="/agents">
              <Button size="sm" variant="outline">Browse marketplace →</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
