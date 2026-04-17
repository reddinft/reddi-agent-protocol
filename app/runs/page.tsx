"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type RunRecord = {
  runId: string;
  createdAt: string;
  selectedWallet?: string;
  endpointUrl?: string;
  status: "completed" | "failed";
  challengeSeen: boolean;
  paymentSatisfied: boolean;
  x402TxSignature?: string;
  x402ReceiptNonce?: string;
  reputationCommitTx?: string;
  responsePreview?: string;
  error?: string;
  trace?: string[];
};

type FeedbackRecord = {
  id: string;
  runId: string;
  walletAddress: string;
  score: number;
  notes?: string;
  createdAt: string;
  reputationCommit?: {
    ok: boolean;
    txSignature?: string;
    commitHash?: string;
    ratingPda?: string;
    error?: string;
  };
};

type CommitRecord = {
  runId: string;
  jobIdHex: string;
  score: number;
  commitHashHex: string;
  specialistWallet: string;
  ratingPda: string;
  commitTx: string;
  createdAt: string;
  revealed: boolean;
  revealTx?: string;
};

function shortWallet(w: string) {
  if (!w || w.length < 12) return w;
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function RunHistoryPage() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [commits, setCommits] = useState<CommitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [revealMsg, setRevealMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [runsRes, feedbackRes, commitsRes] = await Promise.all([
        fetch("/api/onboarding/planner/execute"),
        fetch("/api/onboarding/planner/feedback"),
        fetch("/api/onboarding/planner/reveal"),
      ]);
      const [runsData, feedbackData, commitsData] = await Promise.all([
        runsRes.json(), feedbackRes.json(), commitsRes.json(),
      ]);

      const allRuns: RunRecord[] = runsData.result?.results ?? [];
      setRuns([...allRuns].reverse()); // newest first
      setFeedback(feedbackData.result?.results ?? []);
      setCommits(commitsData.result?.commits ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function revealRating(runId: string) {
    setRevealingId(runId);
    try {
      const res = await fetch("/api/onboarding/planner/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId }),
      });
      const data = await res.json();
      setRevealMsg((m) => ({
        ...m,
        [runId]: data.ok
          ? `✓ Revealed on-chain: ${data.result?.txSignature ?? "ok"}`
          : `Error: ${data.result?.error ?? data.error}`,
      }));
      if (data.ok) load(); // refresh
    } catch (e) {
      setRevealMsg((m) => ({ ...m, [runId]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setRevealingId(null);
    }
  }

  const feedbackByRun = Object.fromEntries(feedback.map((f) => [f.runId, f]));
  const commitByRun = Object.fromEntries(commits.map((c) => [c.runId, c]));

  // Spending summary
  const totalSpend = runs.filter((r) => r.paymentSatisfied).length;
  const completed = runs.filter((r) => r.status === "completed").length;
  const pendingReveal = commits.filter((c) => !c.revealed).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Run History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All planner specialist calls, receipts, and reputation commits.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/planner">
            <Button size="sm" style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000", fontWeight: 600 }}>
              New run →
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            {loading ? "…" : "↻ Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total runs", value: runs.length },
          { label: "Completed", value: completed },
          { label: "Paid calls", value: totalSpend },
          { label: "Pending reveals", value: pendingReveal },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-white/10 bg-card/30 p-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Pending reputation reveals */}
      {pendingReveal > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/10 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-yellow-300 font-semibold text-sm">⏳ {pendingReveal} pending reputation reveal{pendingReveal > 1 ? "s" : ""}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            These commits are on-chain but not yet revealed. Reveal to apply reputation updates to the specialist.
          </p>
          <div className="space-y-2">
            {commits.filter((c) => !c.revealed).map((c) => (
              <div key={c.runId} className="flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-mono text-muted-foreground/70">{shortWallet(c.specialistWallet)}</span>
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground/60">score {c.score}/10</span>
                  <span className="mx-2 text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground/40">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {revealMsg[c.runId] && <span className="text-xs text-muted-foreground">{revealMsg[c.runId]}</span>}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs px-2"
                    disabled={revealingId === c.runId}
                    onClick={() => revealRating(c.runId)}
                  >
                    {revealingId === c.runId ? "Revealing…" : "Reveal"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Run list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 h-24 animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="text-center py-20 space-y-3">
          <p className="text-muted-foreground">No runs yet.</p>
          <Link href="/planner">
            <Button style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000" }}>
              Run your first task →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => {
            const fb = feedbackByRun[run.runId];
            const commit = commitByRun[run.runId];

            return (
              <div
                key={run.runId}
                className={`rounded-xl border p-4 space-y-2 ${
                  run.status === "completed"
                    ? "border-white/10 bg-card/20"
                    : "border-red-500/20 bg-red-950/10"
                }`}
              >
                {/* Run header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={run.status === "completed"
                        ? "border-green-500/30 text-green-400 bg-green-500/5"
                        : "border-red-500/30 text-red-400 bg-red-500/5"}
                    >
                      {run.status}
                    </Badge>
                    {run.paymentSatisfied && (
                      <Badge variant="outline" className="border-[#14F195]/30 text-[#14F195] bg-[#14F195]/5 text-xs">
                        paid
                      </Badge>
                    )}
                    {run.challengeSeen && !run.paymentSatisfied && (
                      <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 text-xs">
                        402 challenge
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-muted-foreground/50">{run.runId}</span>
                  </div>
                  <span className="text-xs text-muted-foreground/50">{timeAgo(run.createdAt)}</span>
                </div>

                {/* Specialist + endpoint */}
                {run.selectedWallet && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                    <Link href={`/agents/${run.selectedWallet}`} className="font-mono hover:text-white transition-colors">
                      {shortWallet(run.selectedWallet)}
                    </Link>
                    {run.endpointUrl && (
                      <span className="truncate text-muted-foreground/40">{run.endpointUrl}</span>
                    )}
                  </div>
                )}

                {/* x402 tx */}
                {run.x402TxSignature && (
                  <p className="text-xs font-mono text-muted-foreground/50">
                    x402 tx: {run.x402TxSignature}
                  </p>
                )}

                {/* Response preview */}
                {run.responsePreview && (
                  <p className="text-xs text-muted-foreground/80 line-clamp-2 border-t border-white/5 pt-2">
                    {run.responsePreview}
                  </p>
                )}

                {/* Error */}
                {run.error && (
                  <p className="text-xs text-red-400/80">{run.error}</p>
                )}

                {/* Feedback + reputation state */}
                <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-white/5">
                  {fb ? (
                    <span className="text-xs text-muted-foreground">
                      ★ {fb.score}/10
                      {fb.reputationCommit?.ok && (
                        <span className="ml-1 text-[#14F195]">· rep committed</span>
                      )}
                      {commit && !commit.revealed && (
                        <span className="ml-1 text-yellow-400">· reveal pending</span>
                      )}
                      {commit?.revealed && (
                        <span className="ml-1 text-[#14F195]">· revealed ✓</span>
                      )}
                    </span>
                  ) : (
                    run.status === "completed" && (
                      <Link href="/planner" className="text-xs text-muted-foreground/40 hover:text-muted-foreground">
                        No feedback given
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
