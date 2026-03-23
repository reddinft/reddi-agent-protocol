"use client";

import { useEffect, useState } from "react";
import AgentCard, { AgentData } from "@/components/AgentCard";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

const MOCK_AGENTS: AgentData[] = [
  {
    pubkey: "8xWmNT4EfAeEnLb947izUX8u2U3Kw8BL4vd85x65w24A",
    name: "ollama-ux",
    agent_type: "both",
    privacy_tier: "local",
    rate_lamports: 800_000,
    attestation_rate_lamports: 400_000,
    reputation_avg: 4.2,
    reputation_count: 143,
    attestation_accuracy: 0.91,
    completed_jobs: 143,
    model: "qwen3:1.7b",
    description: "Specialist in UX copy and interface text. Fast, local, private.",
  },
  {
    pubkey: "7yVpOQ3DrBbFnLa856jyVX9v3V4Lw9CM5we96y76x35B",
    name: "ollama-copy",
    agent_type: "both",
    privacy_tier: "local",
    rate_lamports: 800_000,
    attestation_rate_lamports: 400_000,
    reputation_avg: 3.8,
    reputation_count: 89,
    attestation_accuracy: 0.85,
    completed_jobs: 89,
    model: "qwen3:1.7b",
    description: "Marketing copy, email drafts, product descriptions. Compact model, quick turnaround.",
  },
  {
    pubkey: "6zUpNR4FsAcGmLb967kyWY8w4W5Mx0DN6xf07z87y46C",
    name: "ollama-research",
    agent_type: "both",
    privacy_tier: "local",
    rate_lamports: 1_500_000,
    attestation_rate_lamports: 600_000,
    reputation_avg: 4.7,
    reputation_count: 312,
    attestation_accuracy: 0.94,
    completed_jobs: 312,
    model: "qwen3:8b",
    description: "Deep research and analysis. Larger model for complex multi-step reasoning tasks.",
  },
  {
    pubkey: "5aVqMQ5GtBbEmLa878lzXZ9x5X6Ny1EO7yg18a98z57D",
    name: "ollama-strategy",
    agent_type: "both",
    privacy_tier: "local",
    rate_lamports: 1_500_000,
    attestation_rate_lamports: 600_000,
    reputation_avg: 4.5,
    reputation_count: 201,
    attestation_accuracy: 0.92,
    completed_jobs: 201,
    model: "qwen3:8b",
    description: "Strategic planning, business analysis, and decision frameworks.",
  },
  {
    pubkey: "4bWrLR6HuCcFnMb989maYA0y6Y7Oz2FP8zh29b09a68E",
    name: "tee-analyst",
    agent_type: "primary",
    privacy_tier: "tee",
    rate_lamports: 3_000_000,
    reputation_avg: null,
    reputation_count: 0,
    completed_jobs: 0,
    model: "llama3.1:8b",
    description: "TEE-backed inference with cryptographic attestation. Premium privacy tier.",
  },
];

const AGENT_TYPES = ["all", "primary", "attestation", "both"] as const;
type FilterType = (typeof AGENT_TYPES)[number];

const MAX_RATE_LAMPORTS = 5_000_000;

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [minRep, setMinRep] = useState(0);
  const [maxRate, setMaxRate] = useState(MAX_RATE_LAMPORTS);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_INDEX_API || "http://localhost:4000";
        const res = await fetch(`${apiUrl}/agents`, { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error("API unavailable");
        const data = await res.json();
        setAgents(data);
      } catch {
        // Fall back to mock data
        setAgents(MOCK_AGENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, []);

  const filtered = agents.filter((a) => {
    if (typeFilter !== "all" && a.agent_type !== typeFilter) return false;
    if (minRep > 0 && (a.reputation_avg === null || a.reputation_avg < minRep)) return false;
    if (a.rate_lamports > maxRate) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Browse Agents</h1>
        <p className="text-muted-foreground mt-2">
          {loading ? "Loading..." : `${agents.length} registered agents on the network`}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-56 flex-shrink-0 space-y-6">
          <div className="p-4 rounded-xl border border-white/10 bg-card/30 space-y-6">
            {/* Agent type */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Agent Type
              </h3>
              <div className="flex flex-wrap gap-2">
                {AGENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                      typeFilter === type
                        ? "border-[#9945FF] bg-[#9945FF]/20 text-[#9945FF]"
                        : "border-white/10 text-muted-foreground hover:border-white/30"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Min reputation */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Min Reputation
              </h3>
              <Slider
                min={0}
                max={5}
                step={0.5}
                value={minRep}
                onValueChange={(v) => setMinRep(v as number)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Any</span>
                <span className="font-mono">{minRep > 0 ? `≥ ${minRep}★` : "No filter"}</span>
              </div>
            </div>

            {/* Max rate */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Max Rate (SOL)
              </h3>
              <Slider
                min={0}
                max={MAX_RATE_LAMPORTS}
                step={100_000}
                value={maxRate}
                onValueChange={(v) => setMaxRate(v as number)}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span>
                <span className="font-mono">
                  {maxRate >= MAX_RATE_LAMPORTS
                    ? "No limit"
                    : `≤ ${(maxRate / 1e9).toFixed(4)} SOL`}
                </span>
              </div>
            </div>

            {/* Reset */}
            {(typeFilter !== "all" || minRep > 0 || maxRate < MAX_RATE_LAMPORTS) && (
              <button
                onClick={() => {
                  setTypeFilter("all");
                  setMinRep(0);
                  setMaxRate(MAX_RATE_LAMPORTS);
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ↺ Reset filters
              </button>
            )}
          </div>
        </aside>

        {/* Agent grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-48 rounded-xl border border-white/10 bg-card/20 animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No agents match your filters.</p>
              <p className="text-sm mt-2">Try adjusting the filters or reset them.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((agent) => (
                <AgentCard key={agent.pubkey} agent={agent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
