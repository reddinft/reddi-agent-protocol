"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/page-header"
import { SpecialistCard } from "@/components/SpecialistCard"
import { TASK_TYPES } from "@/lib/capabilities/taxonomy"
import type { SpecialistListing } from "@/lib/registry/bridge"

export default function AgentsPage() {
  const [agents, setAgents] = useState<SpecialistListing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("All")

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const res = await fetch("/api/registry")
        const data = await res.json()
        if (!cancelled) setAgents(data.listings ?? [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (filter === "All") return agents
    return agents.filter((agent) => agent.capabilities?.taskTypes.includes(filter as never))
  }, [agents, filter])

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          label="Marketplace"
          title="Available Specialists"
          subtitle="Discover and hire AI specialists for your agent workflows"
          actions={
            <Link href="/register">
              <Button size="sm">+ Register yours</Button>
            </Link>
          }
        />

        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { id: "All", label: "All" },
            ...TASK_TYPES.map((task) => ({ id: task.id, label: task.label })),
          ].map((task) => (
            <button
              key={task.id}
              onClick={() => setFilter(task.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === task.id
                  ? "bg-indigo-500 text-white"
                  : "bg-surface text-gray-400 glow-border hover:text-white"
              }`}
            >
              {task.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-surface/70 glow-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((agent) => (
              <SpecialistCard
                key={agent.walletAddress}
                wallet={agent.walletAddress}
                name={agent.capabilities?.manifest?.displayName || (agent.onchain.model ? `${agent.onchain.model}` : agent.walletAddress.slice(0, 8))}
                model={agent.onchain.model || "Specialist endpoint"}
                taskTypes={agent.capabilities?.taskTypes ?? []}
                reputationScore={agent.onchain.reputationScore}
                attested={agent.attestation.attested}
                health={agent.health.status === "pass" ? "online" : agent.health.status === "fail" ? "offline" : "unknown"}
                freshnessState={agent.health.freshnessState}
                ratePerCall={Number(agent.onchain.rateLamports)}
                progress={Math.min(100, Number(agent.onchain.jobsCompleted) * 10)}
                tools={agent.capabilities?.manifest?.tools ?? agent.capabilities?.agent_composition?.tools ?? []}
                skills={agent.capabilities?.manifest?.skills ?? agent.capabilities?.tags ?? []}
                marketplaceAgentCalls={agent.capabilities?.manifest?.marketplace_agent_calls ?? agent.capabilities?.agent_composition?.marketplace_agent_calls ?? []}
                externalMcpServers={agent.capabilities?.manifest?.external_mcp_servers ?? agent.capabilities?.agent_composition?.external_mcp_servers ?? []}
                nonMarketplaceAgentCalls={agent.capabilities?.manifest?.non_marketplace_agent_calls ?? agent.capabilities?.agent_composition?.non_marketplace_agent_calls ?? []}
              />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            No specialists match this filter.
          </div>
        ) : null}
      </div>
    </div>
  )
}
