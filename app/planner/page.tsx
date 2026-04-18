"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
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

  useEffect(() => {
    fetch("/api/orchestrator/policy")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPolicy(d.policy);
      })
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
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 bg-page">
      <PageHeader
        label="Execution"
        title="Planner"
        subtitle="Run a task, the planner selects the best available specialist, negotiates payment, and delivers the result."
        actions={
          <>
            <Link href="/orchestrator">
              <Button size="sm" variant="outline">
                ⚙ Settings
              </Button>
            </Link>
            <Link href="/runs">
              <Button size="sm" variant="outline">
                History →
              </Button>
            </Link>
          </>
        }
      />

      {policy && (
        <div
          className={`rounded-lg border px-4 py-2.5 text-xs flex items-center justify-between gap-4 ${
            policyActive
              ? "border-accent-green/30 bg-accent-green/10 text-accent-green"
              : "border-yellow-500/30 bg-yellow-950/20 text-yellow-300"
          }`}
        >
          <span>
            {policyActive
              ? `✓ Marketplace active — budget $${policy.maxPerTaskUsd}/task · $${policy.dailyBudgetUsd}/day · ${policy.preferredPrivacyMode} settlement`
              : "⚠ Specialist marketplace is disabled in settings."}
          </span>
          {!policyActive && (
            <Link href="/orchestrator">
              <Button size="sm" variant="outline" className="text-xs h-6 px-2">
                Enable →
              </Button>
            </Link>
          )}
        </div>
      )}

      <Card className="p-5 space-y-2">
        <Label className="section-label">Task prompt</Label>
        <textarea
          rows={4}
          placeholder="Describe the task you want a specialist to complete…"
          className="w-full rounded-lg border border-border bg-surface/80 px-3 py-2 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={status === "running"}
        />
      </Card>

      <Card className="p-5 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Task type hint</Label>
            <select
              value={taskTypeHint}
              onChange={(e) => setTaskTypeHint(e.target.value)}
              className="w-full rounded-md border border-border bg-surface/80 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Auto-detect</option>
              {TASK_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Settlement override</Label>
            <select
              value={privacyOverride}
              onChange={(e) => setPrivacyOverride(e.target.value)}
              className="w-full rounded-md border border-border bg-surface/80 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Use policy default</option>
              {PRIVACY_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Attestation</Label>
            <select
              value={requireAttestation === null ? "" : String(requireAttestation)}
              onChange={(e) => setRequireAttestation(e.target.value === "" ? null : e.target.value === "true")}
              className="w-full rounded-md border border-border bg-surface/80 px-3 py-1.5 text-sm text-white"
            >
              <option value="">Use policy default</option>
              <option value="true">Require attested</option>
              <option value="false">Any specialist</option>
            </select>
          </div>
        </div>
      </Card>

      <Button
        className="w-full py-5 text-base font-semibold"
        style={status !== "running" && prompt.trim() ? { background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000" } : {}}
        disabled={status === "running" || !prompt.trim()}
        onClick={execute}
      >
        {status === "running" ? "Finding specialist + executing…" : "Run task →"}
      </Button>

      {candidates.length > 0 && (
        <Card className="p-4 space-y-2">
          <p className="section-label">Candidate selection</p>
          <div className="space-y-1">
            {candidates.map((c, i) => (
              <div
                key={c.walletAddress}
                className={`rounded-lg border px-3 py-2 text-xs flex items-start gap-3 ${
                  i === 0 ? "border-accent-green/30 bg-accent-green/10" : "border-border bg-surface/40"
                }`}
              >
                <span className={i === 0 ? "text-accent-green font-medium" : "text-muted-foreground"}>
                  {i === 0 ? "✓ Selected" : `#${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-mono text-muted-foreground/70">{c.walletAddress.slice(0, 8)}…</span>
                  {c.reasons && c.reasons.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.reasons.map((r) => (
                        <Badge key={r} variant="outline" className="px-1.5 py-0 text-xs text-muted-foreground/60">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {(status === "done" || status === "error") && (
        <Card
          className={`p-5 space-y-3 ${
            status === "done" ? "border-accent-green/30 bg-accent-green/10" : "border-red-500/30 bg-red-950/20"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${status === "done" ? "text-accent-green" : "text-red-300"}`}>
              {status === "done" ? "✓ Task completed" : "✗ Task failed"}
            </span>
            {runResult?.runId && <span className="font-mono text-xs text-muted-foreground/60">{runResult.runId}</span>}
          </div>

          {runResult?.x402TxSignature && <p className="text-xs font-mono text-muted-foreground/70">x402 tx: {runResult.x402TxSignature}</p>}

          {runResult?.trace && runResult.trace.length > 0 && (
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground/50 hover:text-muted-foreground">
                Execution trace ({runResult.trace.length} steps)
              </summary>
              <div className="mt-2 space-y-0.5">
                {runResult.trace.map((t, i) => (
                  <div key={i} className="font-mono text-muted-foreground/60">
                    {t}
                  </div>
                ))}
              </div>
            </details>
          )}

          {execError && <p className="text-sm text-red-300">{execError}</p>}

          {runResult?.responsePreview && (
            <div className="border-t border-border pt-3">
              <p className="mb-1 text-xs text-muted-foreground">Response</p>
              <p className="whitespace-pre-wrap text-sm text-white">{runResult.responsePreview}</p>
            </div>
          )}
        </Card>
      )}

      {status === "done" && runResult?.runId && !feedbackSent && (
        <Card className="p-5 space-y-3">
          <h3 className="section-label">Rate this specialist call</h3>
          <p className="text-xs text-muted-foreground">
            Your feedback improves routing. Scores ≥3 trigger an on-chain reputation commit.
          </p>
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Score (1–10)</Label>
              <Input type="number" min={1} max={10} className="w-20 text-center" value={feedbackScore} onChange={(e) => setFeedbackScore(e.target.value)} />
            </div>
            <div className="flex-1 space-y-1">
              <Label className="text-xs text-muted-foreground">Notes (optional)</Label>
              <Input placeholder="What was good or bad about this result?" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} />
            </div>
          </div>
          <Button size="sm" onClick={sendFeedback}>
            Submit feedback
          </Button>
        </Card>
      )}

      {feedbackMsg && <p className="text-xs text-muted-foreground">{feedbackMsg}</p>}

      {status === "idle" && !prompt && (
        <Card className="p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">No specialists registered yet?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/onboarding">
              <Button size="sm" variant="outline">
                Register as specialist →
              </Button>
            </Link>
            <Link href="/agents">
              <Button size="sm" variant="outline">
                Browse marketplace →
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
