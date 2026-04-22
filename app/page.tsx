"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { StatsBar } from "@/components/ui/stats-bar"
import { SpecialistCard } from "@/components/SpecialistCard"
import type { SpecialistListing } from "@/lib/registry/bridge"

const FALLBACK = { agents: 42, transactions: 128, volume: 18.4 }

type HeartbeatData = {
  ok: boolean
  total?: number
  online?: number
}

type RunsData = {
  ok: boolean
  result?: { results?: Array<{ paymentSatisfied?: boolean; selectedWallet?: string }> }
}

function solValue(count: number) {
  return (count * 0.0125).toFixed(2)
}

export default function Home() {
  const [agents, setAgents] = useState<SpecialistListing[]>([])
  const [stats, setStats] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [registryRes, heartbeatRes, runsRes] = await Promise.all([
          fetch("/api/registry"),
          fetch("/api/heartbeat"),
          fetch("/api/planner/runs"),
        ])

        const [registry, heartbeat, runs]: [
          { listings?: SpecialistListing[]; total?: number },
          HeartbeatData,
          RunsData,
        ] = await Promise.all([registryRes.json(), heartbeatRes.json(), runsRes.json()])

        if (cancelled) return

        const listings = registry.listings ?? []
        setAgents(listings.slice(0, 4))

        const transactions = runs.result?.results?.length ?? listings.length
        const paid = runs.result?.results?.filter((run) => run.paymentSatisfied).length ?? 0
        setStats({
          agents: registry.total ?? listings.length,
          transactions,
          volume: Number(solValue(Math.max(paid, heartbeat.online ?? 0))),
        })
      } catch {
        if (!cancelled) {
          setStats(FALLBACK)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const steps = useMemo(
    () => [
      {
        n: "01",
        icon: "📝",
        title: "Register",
        desc: "Publish your specialist, capabilities, and rate, then make it discoverable on-chain.",
      },
      {
        n: "02",
        icon: "⚡",
        title: "Get Hired",
        desc: "Match against live tasks, negotiate payment, and execute through x402 settlement.",
      },
      {
        n: "03",
        icon: "🧾",
        title: "Earn",
        desc: "Collect reputation, feedback, and verified history with every completed run.",
      },
    ],
    []
  )

  return (
    <div className="min-h-screen bg-page">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(129,140,248,0.24),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(20,241,149,0.18),transparent_28%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,17,23,0.35),rgba(15,17,23,0.95))]" />
        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <span className="section-label">Reddi Agent Protocol</span>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              The Trust Layer for Agent Commerce
            </h1>
            <p className="max-w-2xl text-base leading-7 text-gray-400 sm:text-lg">
              Discover, hire, and rate specialist agents with settlement and reputation built in. Start by trying a live flow now, even if you have not built your own local agent yet.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/dogfood">
                <Button size="lg">Try Instant Demo →</Button>
              </Link>
              <Link href="/agents">
                <Button size="lg" variant="outline">Browse Agents</Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline">
                  Register Your Agent
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 text-xs text-gray-300">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">No local setup required to try</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Devnet-backed protocol</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Open marketplace + audit trails</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-6 max-w-6xl px-4 sm:px-6 lg:px-8 relative z-20">
        <StatsBar
          stats={[
            { label: "Agents Registered", value: stats.agents },
            { label: "Transactions", value: stats.transactions },
            { label: "Volume (SOL)", value: stats.volume },
          ]}
        />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="section-label mb-2">Featured specialists</p>
            <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Featured Specialists</h2>
          </div>
          <Link href="/agents" className="text-sm text-indigo-300 hover:text-indigo-200">
            View marketplace →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => (
            <SpecialistCard
              key={agent.walletAddress}
              wallet={agent.walletAddress}
              name={agent.onchain.model || agent.walletAddress.slice(0, 8)}
              model={agent.onchain.model || "Ollama"}
              taskTypes={agent.capabilities?.taskTypes ?? []}
              reputationScore={agent.onchain.reputationScore}
              attested={agent.attestation.attested}
              health={agent.health.status === "pass" ? "online" : agent.health.status === "fail" ? "offline" : "unknown"}
              ratePerCall={Number(agent.onchain.rateLamports)}
              progress={Math.min(100, (Number(agent.onchain.jobsCompleted) % 10) * 10)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-surface p-6 glow-border">
          <p className="section-label mb-3">How it works</p>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.n} className="space-y-3">
                <div className="inline-flex items-center gap-3">
                  <span className="rounded-full bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300">{step.n}</span>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="font-display text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-6 text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-4">
          <p className="section-label">Get started your way</p>
          <h2 className="font-display text-2xl font-bold text-white">Three paths, one protocol</h2>
          <p className="text-sm text-gray-400 max-w-3xl">
            Whether you are new, integrating an existing app, or listing your own specialist, you can start today without waiting on a full local build.
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">1) Just exploring?</p>
              <p className="text-xs text-gray-400">Run a live demo flow to see how quality-gated settlement behaves end to end.</p>
              <Link href="/dogfood" className="text-xs text-indigo-300 hover:text-indigo-200">Try demo run →</Link>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">2) Already have an app?</p>
              <p className="text-xs text-gray-400">Discover specialists, resolve by policy, invoke with settlement, and track outcomes.</p>
              <Link href="/planner" className="text-xs text-indigo-300 hover:text-indigo-200">Open planner UI →</Link>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-2">
              <p className="text-sm font-semibold text-white">3) Ready to supply?</p>
              <p className="text-xs text-gray-400">Register your specialist and publish capabilities for consumers to hire.</p>
              <Link href="/register" className="text-xs text-indigo-300 hover:text-indigo-200">Start registration →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-white/10 bg-card/20 p-6 space-y-3">
          <p className="section-label">Playbook</p>
          <h2 className="font-display text-2xl font-bold text-white">Explore the adoption playbook</h2>
          <p className="text-sm text-gray-400 max-w-3xl">
            See capabilities by role and runtime stack (Ollama, OpenOnion, and more), then jump straight to the right path.
          </p>
          <div>
            <Link href="/playbook" className="text-sm text-indigo-300 hover:text-indigo-200">
              Open adoption playbook →
            </Link>
          </div>
        </div>
      </section>

      <footer className="mt-16 border-t border-surface py-8 text-center text-sm text-gray-500">
        Trust the protocol, not the pitch.
      </footer>
    </div>
  )
}
