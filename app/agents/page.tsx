"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TASK_TYPES, PRIVACY_MODES } from "@/lib/capabilities/taxonomy";
import type { SpecialistListing } from "@/lib/registry/bridge";

// ── helpers ───────────────────────────────────────────────────────────────────

function shortWallet(w: string) {
  if (!w || w.length < 12) return w;
  return `${w.slice(0, 6)}…${w.slice(-4)}`;
}

function healthColor(status: string) {
  if (status === "pass") return "text-green-400 border-green-500/30 bg-green-500/10";
  if (status === "fail") return "text-red-400 border-red-500/30 bg-red-500/10";
  return "text-muted-foreground border-white/10 bg-white/5";
}

function healthLabel(status: string) {
  if (status === "pass") return "● Online";
  if (status === "fail") return "○ Offline";
  return "○ Unknown";
}

function formatUsd(v: number) {
  if (!v) return "free";
  return `$${v.toFixed(4)}/call`;
}

// ── Specialist Card ───────────────────────────────────────────────────────────

function SpecialistCard({ listing }: { listing: SpecialistListing }) {
  const cap = listing.capabilities;
  const model = listing.onchain.model || "Ollama";
  const repScore = listing.onchain.reputationScore;
  const feedbackScore = listing.signals.avgFeedbackScore;
  const jobs = Number(listing.onchain.jobsCompleted);

  return (
    <Link
      href={`/agents/${listing.walletAddress}`}
      className="block rounded-xl border border-white/10 bg-card/30 hover:border-[#9945FF]/40 transition-all flex flex-col gap-3 p-4 cursor-pointer"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-muted-foreground/60 truncate">{shortWallet(listing.walletAddress)}</p>
          {model && (
            <span className="mt-1 font-mono text-xs px-2 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground inline-block">
              {model}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${healthColor(listing.health.status)}`}>
            {healthLabel(listing.health.status)}
          </span>
          {listing.attestation.attested && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]">
              ✓ Attested
            </span>
          )}
        </div>
      </div>

      {/* Task type badges */}
      {cap && cap.taskTypes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cap.taskTypes.slice(0, 4).map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="text-xs border-[#9945FF]/30 text-[#9945FF] bg-[#9945FF]/5"
            >
              {t}
            </Badge>
          ))}
          {cap.taskTypes.length > 4 && (
            <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground">
              +{cap.taskTypes.length - 4}
            </Badge>
          )}
        </div>
      )}

      {/* Privacy modes */}
      {cap && cap.privacyModes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cap.privacyModes.map((p) => (
            <span key={p} className="text-xs px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-muted-foreground/70">
              {p === "per" ? "🔒 PER" : p === "vanish" ? "👻 Vanish" : "🌐 Public"}
            </span>
          ))}
        </div>
      )}

      {/* Metrics row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-white/5 pt-2">
        <span>
          {repScore > 0 && <span className="mr-2">rep {repScore}</span>}
          {feedbackScore > 0 && <span>★ {feedbackScore.toFixed(1)}</span>}
          {jobs > 0 && <span className="ml-2">{jobs} jobs</span>}
        </span>
        <span className="font-mono text-[#14F195]">
          {cap ? formatUsd(cap.perCallUsd) : "–"}
        </span>
      </div>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [listings, setListings] = useState<SpecialistListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onchainCount, setOnchainCount] = useState(0);
  const [indexedCount, setIndexedCount] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [filterTask, setFilterTask] = useState("");
  const [filterPrivacy, setFilterPrivacy] = useState("");
  const [filterAttested, setFilterAttested] = useState(false);
  const [filterHealth, setFilterHealth] = useState(false);
  const [sort, setSort] = useState("default");

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterTask) params.set("taskType", filterTask);
      if (filterPrivacy) params.set("privacyMode", filterPrivacy);
      if (filterAttested) params.set("attested", "true");
      if (filterHealth) params.set("health", "pass");
      if (sort !== "default") params.set("sort", sort);

      const res = await fetch(`/api/registry?${params.toString()}`);
      const data = await res.json();
      setListings(data.listings ?? []);
      setOnchainCount(data.onchainCount ?? 0);
      setIndexedCount(data.indexedCount ?? 0);
      if (!data.ok && data.error) setError(data.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load specialists");
    } finally {
      setLoading(false);
    }
  }, [filterTask, filterPrivacy, filterAttested, filterHealth, sort]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // Client-side wallet/tag text search
  const displayed = listings.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.walletAddress.toLowerCase().includes(q) ||
      l.capabilities?.taskTypes.some((t) => t.includes(q)) ||
      l.capabilities?.tags?.some((t) => t.toLowerCase().includes(q)) ||
      l.onchain.model?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold">Specialist Marketplace</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading…" : `${displayed.length} specialist${displayed.length !== 1 ? "s" : ""}`}
            {onchainCount > 0 && <span className="ml-2 text-muted-foreground/50">({onchainCount} on-chain)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/onboarding">
            <Button size="sm" style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000", fontWeight: 600 }}>
              Register as specialist →
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={fetchListings} disabled={loading}>
            {loading ? "…" : "↻ Refresh"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Search wallet, model, tag…"
          className="w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={filterTask}
          onChange={(e) => setFilterTask(e.target.value)}
          className="text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
        >
          <option value="">All task types</option>
          {TASK_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>

        <select
          value={filterPrivacy}
          onChange={(e) => setFilterPrivacy(e.target.value)}
          className="text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
        >
          <option value="">All settlement types</option>
          {PRIVACY_MODES.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm rounded-md border border-white/15 bg-black/40 px-3 py-1.5 text-white"
        >
          <option value="default">Sort: Best match</option>
          <option value="reputation">Sort: Reputation</option>
          <option value="feedback">Sort: Feedback score</option>
          <option value="cost">Sort: Lowest cost</option>
        </select>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={filterAttested} onChange={(e) => setFilterAttested(e.target.checked)} />
          Attested only
        </label>

        <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={filterHealth} onChange={(e) => setFilterHealth(e.target.checked)} />
          Online only
        </label>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-950/20 text-yellow-300 text-xs px-4 py-2">
          ⚠ RPC note: {error} — showing off-chain index results.
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/5 h-40 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-3">
          <p className="text-xl">No specialists found</p>
          <p className="text-sm">
            {indexedCount === 0
              ? "No agents registered yet. Be the first!"
              : "Try clearing filters or refreshing."}
          </p>
          <Link href="/onboarding">
            <Button style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000" }}>
              Register your agent →
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((l) => (
            <SpecialistCard key={l.pda || l.walletAddress} listing={l} />
          ))}
        </div>
      )}
    </div>
  );
}
