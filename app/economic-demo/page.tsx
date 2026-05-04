"use client";

import { useMemo, useState } from "react";

import {
  economicDemoScenarios,
  formatLamports,
  lamportsDelta,
  type EconomicDemoScenario,
} from "@/lib/economic-demo/fixture";

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 8)}…${wallet.slice(-6)}`;
}

function statusClass(status: EconomicDemoScenario["edges"][number]["status"]) {
  if (status === "blocked") return "border-red-400/40 bg-red-400/10 text-red-200";
  if (status === "attested") return "border-[#14F195]/40 bg-[#14F195]/10 text-[#14F195]";
  if (status === "paid") return "border-accent-purple/40 bg-accent-purple/10 text-accent-purple";
  return "border-white/15 bg-white/5 text-gray-300";
}

export default function EconomicDemoPage() {
  const [scenarioId, setScenarioId] = useState(economicDemoScenarios[0].id);
  const scenario = useMemo(
    () => economicDemoScenarios.find((candidate) => candidate.id === scenarioId) ?? economicDemoScenarios[0],
    [scenarioId],
  );
  const totalPlanned = scenario.edges.reduce((sum, edge) => sum + edge.amountLamports, 0);

  return (
    <main className="min-h-screen bg-page">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(153,69,255,0.22),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(20,241,149,0.16),transparent_28%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-4xl space-y-5">
            <span className="section-label">End-user economic demo · issue #187</span>
            <h1 className="font-display text-4xl font-bold text-white sm:text-5xl">
              Watch one user request become a paid agent workflow
            </h1>
            <p className="max-w-3xl text-base leading-7 text-gray-400">
              This fixture slice shows the demo we are wiring next: an end user asks for work, a consumer-capable specialist hires other specialists through Reddi/x402, attestors verify the result, and the ledger shows the before/after impact for every wallet.
            </p>
            <div className="flex flex-wrap gap-3">
              {economicDemoScenarios.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => setScenarioId(candidate.id)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    candidate.id === scenario.id
                      ? "border-[#14F195]/50 bg-[#14F195]/15 text-[#14F195]"
                      : "border-white/10 bg-white/5 text-gray-300 hover:border-white/25 hover:text-white"
                  }`}
                >
                  {candidate.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1.5fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-card">
              <p className="section-label">User request</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{scenario.title}</h2>
              <p className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-gray-200">
                “{scenario.prompt}”
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <dt className="text-gray-500">Orchestrator</dt>
                  <dd className="mt-1 font-mono text-[#14F195]">{scenario.orchestrator}</dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <dt className="text-gray-500">Mode now</dt>
                  <dd className="mt-1 font-mono text-gray-200">{scenario.mode}</dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <dt className="text-gray-500">Edges</dt>
                  <dd className="mt-1 text-gray-200">{scenario.edges.length}</dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <dt className="text-gray-500">Planned flow</dt>
                  <dd className="mt-1 text-gray-200">{formatLamports(totalPlanned)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-card">
              <p className="section-label">Final output</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{scenario.finalOutputType}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-300">{scenario.finalOutputSummary}</p>
              <div className="mt-5 rounded-xl border border-[#14F195]/20 bg-[#14F195]/10 p-4 text-sm text-[#14F195]">
                Next live loop: replace fixture receipts with exact allowlisted devnet x402 receipts and balance snapshots.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-card">
              <p className="section-label">Guardrails</p>
              <ul className="mt-3 space-y-2 text-sm text-gray-300">
                {scenario.guardrails.map((guardrail) => (
                  <li key={guardrail} className="flex gap-2">
                    <span className="text-[#14F195]">•</span>
                    <span>{guardrail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Payload + money graph</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Agent workflow</h2>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-400">
                  fixture · zero spend
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {scenario.agents.map((agent) => (
                  <div key={agent.profileId} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-accent-purple/30 bg-accent-purple/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-purple">
                        {agent.role}
                      </span>
                    </div>
                    <h3 className="mt-3 break-words font-mono text-sm text-white">{agent.profileId}</h3>
                    <p className="mt-2 text-xs leading-5 text-gray-400">{agent.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {scenario.edges.map((edge, index) => (
                  <div key={`${edge.from}-${edge.to}-${edge.capability}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-mono text-white">{edge.from}</span>
                      <span className="text-gray-500">→</span>
                      <span className="font-mono text-white">{edge.to}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClass(edge.status)}`}>{edge.status}</span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Payload {index + 1} · {edge.capability}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-300">{edge.payloadSummary}</p>
                        <p className="mt-2 break-all font-mono text-xs text-gray-500">{edge.receipt}</p>
                      </div>
                      <div className="rounded-lg border border-[#14F195]/20 bg-[#14F195]/10 px-3 py-2 text-right">
                        <p className="text-xs text-gray-400">x402 amount</p>
                        <p className="font-mono text-sm text-[#14F195]">{formatLamports(edge.amountLamports)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-card">
              <p className="section-label">Wallet balance ledger</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Start → end balances</h2>
              <div className="mt-5 overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr] gap-3 bg-white/5 px-4 py-3 text-xs uppercase tracking-wide text-gray-500">
                  <span>Wallet</span>
                  <span>Start</span>
                  <span>End</span>
                  <span>Delta</span>
                </div>
                {scenario.balances.map((balance) => {
                  const delta = lamportsDelta(balance);
                  return (
                    <div key={`${balance.profileId}-${balance.wallet}`} className="grid grid-cols-[1.1fr_0.7fr_0.7fr_0.7fr] gap-3 border-t border-white/10 px-4 py-3 text-sm">
                      <div>
                        <p className="font-mono text-white">{balance.profileId}</p>
                        <p className="mt-1 font-mono text-xs text-gray-500">{shortWallet(balance.wallet)}</p>
                      </div>
                      <span className="font-mono text-gray-300">{formatLamports(balance.startingLamports).replace(/^\+/, "")}</span>
                      <span className="font-mono text-gray-300">{formatLamports(balance.endingLamports).replace(/^\+/, "")}</span>
                      <span className={`font-mono ${delta > 0 ? "text-[#14F195]" : delta < 0 ? "text-red-300" : "text-gray-400"}`}>
                        {formatLamports(delta)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
