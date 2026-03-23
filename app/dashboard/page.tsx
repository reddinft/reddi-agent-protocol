"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LinkButton from "@/components/LinkButton";
import AgentCard, { AgentData } from "@/components/AgentCard";
import SolAmount from "@/components/SolAmount";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

const MOCK_AGENTS: AgentData[] = [
  {
    pubkey: "8xWmNT4EfAeEnLb947izUX8u2U3Kw8BL4vd85x65w24A",
    name: "my-research-agent",
    agent_type: "both",
    privacy_tier: "local",
    rate_lamports: 1_500_000,
    attestation_rate_lamports: 600_000,
    reputation_avg: 4.3,
    reputation_count: 47,
    attestation_accuracy: 0.89,
    completed_jobs: 47,
    model: "qwen3:8b",
  },
];

const MOCK_ESCROW_ACTIVITY = [
  {
    type: "primary_release",
    amount: 1_500_000,
    counter_party: "5xR...2kH",
    status: "settled",
    timestamp: "2026-03-23 18:42",
    earned: 1_249_500,
  },
  {
    type: "attestation",
    amount: 600_000,
    counter_party: "9mP...8vQ",
    status: "agreed",
    timestamp: "2026-03-23 16:15",
    earned: 499_800,
  },
  {
    type: "primary_release",
    amount: 1_500_000,
    counter_party: "3bK...7rN",
    status: "settled",
    timestamp: "2026-03-23 14:30",
    earned: 1_249_500,
  },
  {
    type: "attestation",
    amount: 600_000,
    counter_party: "1cJ...4sL",
    status: "disagreed",
    timestamp: "2026-03-22 22:10",
    earned: 0,
  },
];

const totalEarned = MOCK_ESCROW_ACTIVITY.reduce((sum, e) => sum + e.earned, 0);
const totalJobs = MOCK_AGENTS.reduce((sum, a) => sum + a.completed_jobs, 0);
const avgRep = MOCK_AGENTS.reduce((sum, a) => sum + (a.reputation_avg || 0), 0) / MOCK_AGENTS.length;

export default function DashboardPage() {
  const { connected, publicKey } = useWallet();

  if (!connected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6">
        <div className="text-4xl">👋</div>
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground">
          Connect your wallet to see your registered agents, earnings, and escrow activity.
        </p>
        <WalletMultiButton
          style={{
            background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
            height: "44px",
            fontSize: "15px",
            borderRadius: "8px",
            margin: "0 auto",
          }}
        />
        <p className="text-xs text-muted-foreground">
          Using mock data below ↓
        </p>
        <DashboardContent />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Dashboard</h1>
          {publicKey && (
            <p className="text-xs text-muted-foreground font-mono mt-1">
              {publicKey.toBase58()}
            </p>
          )}
        </div>
        <LinkButton
          href="/register"
          style={{
            background: "linear-gradient(135deg, #9945FF, #14F195)",
            color: "#000",
            fontWeight: 600,
          }}
        >
          + Add Another Agent
        </LinkButton>
      </div>

      <DashboardContent />
    </div>
  );
}

function DashboardContent() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: MOCK_AGENTS.length.toString(), unit: "" },
          { label: "Jobs Completed", value: totalJobs.toString(), unit: "" },
          { label: "Avg Reputation", value: avgRep.toFixed(1), unit: "★" },
          { label: "Total Earned", value: (totalEarned / 1e9).toFixed(6), unit: "SOL" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-xl border border-white/10 bg-card/30 space-y-1"
          >
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold font-mono">
              <span style={{ color: "#14F195" }}>{stat.value}</span>
              {stat.unit && <span className="text-sm text-muted-foreground ml-1">{stat.unit}</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Agents */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Agents</h2>
          <LinkButton href="/register" variant="outline" size="sm" className="border-white/10">
            + Register Agent
          </LinkButton>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MOCK_AGENTS.map((agent) => (
            <div key={agent.pubkey} className="space-y-2">
              <AgentCard agent={agent} compact />
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded-lg border border-white/10 bg-card/20 text-center">
                  <p className="text-muted-foreground">Jobs</p>
                  <p className="font-mono font-bold">{agent.completed_jobs}</p>
                </div>
                <div className="p-2 rounded-lg border border-white/10 bg-card/20 text-center">
                  <p className="text-muted-foreground">Rep</p>
                  <p className="font-mono font-bold">
                    {agent.reputation_avg?.toFixed(1) || "—"}
                  </p>
                </div>
                <div className="p-2 rounded-lg border border-white/10 bg-card/20 text-center">
                  <p className="text-muted-foreground">Accuracy</p>
                  <p className="font-mono font-bold">
                    {agent.attestation_accuracy
                      ? `${(agent.attestation_accuracy * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Add agent CTA card */}
          <Link
            href="/register"
            className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-white/20 hover:border-[#9945FF]/50 transition-colors bg-card/10 hover:bg-[#9945FF]/5 group cursor-pointer"
          >
            <span className="text-3xl mb-2 text-muted-foreground group-hover:text-[#9945FF] transition-colors">+</span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Add another agent
            </span>
          </Link>
        </div>
      </section>

      {/* Escrow activity */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Escrow Activity</h2>
        <div className="rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/2">
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Type</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Counterparty</th>
                <th className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">Earned</th>
                <th className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ESCROW_ACTIVITY.map((e, i) => (
                <tr
                  key={i}
                  className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors"
                >
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        e.type === "primary_release"
                          ? "border-[#9945FF]/30 text-[#9945FF] bg-[#9945FF]/10"
                          : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                      }`}
                    >
                      {e.type === "primary_release" ? "Specialist" : "Attestation"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {e.counter_party}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        e.status === "settled" || e.status === "agreed"
                          ? "border-[#14F195]/30 text-[#14F195] bg-[#14F195]/10"
                          : "border-red-500/30 text-red-400 bg-red-500/10"
                      }`}
                    >
                      {e.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {e.earned > 0 ? (
                      <SolAmount lamports={e.earned} className="text-xs" />
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {e.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
