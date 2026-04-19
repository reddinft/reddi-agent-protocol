"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

type ConsumerProfile = {
  walletAddress: string;
  updatedAt: string;
  reputation?: { score5?: number; totalRatings?: number };
};

type PlannerRun = {
  runId: string;
  createdAt?: string;
  status?: string;
  selectedWallet?: string;
  paymentSatisfied?: boolean;
};

type PlannerFeedback = {
  runId: string;
  score?: number;
  consumerWallet?: string;
  createdAt?: string;
};

export default function ConsumerDashboardPage() {
  const { connected, publicKey } = useWallet();
  const [profiles, setProfiles] = useState<ConsumerProfile[]>([]);
  const [runs, setRuns] = useState<PlannerRun[]>([]);
  const [feedback, setFeedback] = useState<PlannerFeedback[]>([]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      try {
        const [profilesRes, runsRes, feedbackRes] = await Promise.all([
          fetch("/api/onboarding/consumers", { cache: "no-store" }),
          fetch("/api/onboarding/planner/execute", { cache: "no-store" }),
          fetch("/api/onboarding/planner/feedback", { cache: "no-store" }),
        ]);

        const [p, r, f] = await Promise.all([profilesRes.json(), runsRes.json(), feedbackRes.json()]);
        setProfiles(Array.isArray(p?.result?.results) ? p.result.results : []);
        setRuns(Array.isArray(r?.result?.runs) ? r.result.runs : []);
        setFeedback(Array.isArray(f?.result?.entries) ? f.result.entries : Array.isArray(f?.result) ? f.result : []);
      } catch {
        setProfiles([]);
        setRuns([]);
        setFeedback([]);
      }
    })();
  }, [connected]);

  const wallet = publicKey?.toBase58() ?? "";
  const mine = useMemo(() => profiles.find((p) => p.walletAddress === wallet) ?? null, [profiles, wallet]);
  const myFeedback = useMemo(
    () => feedback.filter((x) => x.consumerWallet && x.consumerWallet === wallet),
    [feedback, wallet]
  );

  const completedRuns = runs.filter((r) => r.status === "completed").length;

  if (!connected) {
    return <PageNotice title="Consumer Dashboard" text="Connect wallet to review consumer-owner protocol statistics." />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Consumer Owner Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track planner usage, feedback, and consumer-profile reputation.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Stat label="Consumer profile" value={mine ? 1 : 0} />
        <Stat label="Profile reputation" value={mine?.reputation?.score5 ? Number(mine.reputation.score5.toFixed(2)) : 0} />
        <Stat label="Planner runs (global)" value={runs.length} />
        <Stat label="Completed runs (global)" value={completedRuns} />
      </div>

      <section className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Your consumer profile</h2>
        {mine ? (
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Wallet:</span> <span className="font-mono">{mine.walletAddress}</span></p>
            <p><span className="text-muted-foreground">Ratings:</span> {mine.reputation?.totalRatings ?? 0}</p>
            <p><span className="text-muted-foreground">Updated:</span> {mine.updatedAt ? new Date(mine.updatedAt).toLocaleString() : "—"}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No consumer profile registered for this wallet yet. Use planner tools register-consumer flow first.</p>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Recent feedback from your wallet</h2>
        {myFeedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No wallet-scoped feedback records found yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-white/10">
                  <th className="py-2 pr-4">Run</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {myFeedback.slice(0, 12).map((f) => (
                  <tr key={`${f.runId}-${f.createdAt}`} className="border-b border-white/5">
                    <td className="py-2 pr-4 font-mono text-xs">{short(f.runId)}</td>
                    <td className="py-2 pr-4">{f.score ?? "—"}</td>
                    <td className="py-2 text-xs">{f.createdAt ? new Date(f.createdAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function short(v?: string) {
  if (!v) return "—";
  return v.length > 14 ? `${v.slice(0, 8)}…${v.slice(-4)}` : v;
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-card/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function PageNotice({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-3">
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}
