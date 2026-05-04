"use client";

import { useMemo, useState } from "react";

import {
  economicDemoScenarios,
  formatLamports,
  lamportsDelta,
  type EconomicDemoScenario,
} from "@/lib/economic-demo/fixture";
import type { EconomicDemoBalanceReport } from "@/lib/economic-demo/balances";
import type { DryRunEconomicPlan } from "@/lib/economic-demo/dry-run";
import type { SurfpoolRehearsalReport } from "@/lib/economic-demo/surfpool-rehearsal";
import type { EconomicDemoPaymentReadiness } from "@/lib/economic-demo/payment-readiness";
import type { WebpageLiveWorkflowEvidence } from "@/lib/economic-demo/webpage-live-workflow-evidence";
import type { EconomicDemoLedgerReconciliation } from "@/lib/economic-demo/ledger-reconciliation";

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
  const [dryRunPlan, setDryRunPlan] = useState<DryRunEconomicPlan | null>(null);
  const [dryRunStatus, setDryRunStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [balanceReport, setBalanceReport] = useState<EconomicDemoBalanceReport | null>(null);
  const [balanceStatus, setBalanceStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [surfpoolReport, setSurfpoolReport] = useState<SurfpoolRehearsalReport | null>(null);
  const [surfpoolStatus, setSurfpoolStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [paymentReadiness, setPaymentReadiness] = useState<EconomicDemoPaymentReadiness | null>(null);
  const [paymentReadinessStatus, setPaymentReadinessStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [webpageLiveEvidence, setWebpageLiveEvidence] = useState<WebpageLiveWorkflowEvidence | null>(null);
  const [webpageLiveEvidenceStatus, setWebpageLiveEvidenceStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const [ledgerReconciliation, setLedgerReconciliation] = useState<EconomicDemoLedgerReconciliation | null>(null);
  const [ledgerReconciliationStatus, setLedgerReconciliationStatus] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const scenario = useMemo(
    () => economicDemoScenarios.find((candidate) => candidate.id === scenarioId) ?? economicDemoScenarios[0],
    [scenarioId],
  );
  const totalPlanned = scenario.edges.reduce((sum, edge) => sum + edge.amountLamports, 0);
  const activeDryRunPlan = dryRunPlan?.scenarioId === scenario.id ? dryRunPlan : null;
  const activeBalanceReport = balanceReport?.scenarioId === scenario.id ? balanceReport : null;
  const activeSurfpoolReport = surfpoolReport?.scenarioId === scenario.id ? surfpoolReport : null;

  async function loadDryRunPlan() {
    setDryRunStatus("loading");
    try {
      const res = await fetch(`/api/economic-demo/dry-run?scenario=${scenario.id}`);
      const payload = (await res.json()) as { ok?: boolean; plan?: DryRunEconomicPlan };
      if (!res.ok || !payload.ok || !payload.plan) throw new Error("dry_run_plan_failed");
      setDryRunPlan(payload.plan);
      setBalanceReport(null);
      setBalanceStatus("idle");
      setSurfpoolReport(null);
      setSurfpoolStatus("idle");
      setPaymentReadiness(null);
      setPaymentReadinessStatus("idle");
      setDryRunStatus("loaded");
    } catch {
      setDryRunStatus("error");
    }
  }

  async function loadBalanceSnapshot() {
    setBalanceStatus("loading");
    try {
      const res = await fetch(`/api/economic-demo/balances?scenario=${scenario.id}`);
      const payload = (await res.json()) as { ok?: boolean; report?: EconomicDemoBalanceReport };
      if (!res.ok || !payload.ok || !payload.report) throw new Error("balance_snapshot_failed");
      setBalanceReport(payload.report);
      setBalanceStatus("loaded");
    } catch {
      setBalanceStatus("error");
    }
  }

  async function loadSurfpoolRehearsal() {
    setSurfpoolStatus("loading");
    try {
      const res = await fetch(`/api/economic-demo/surfpool-rehearsal?scenario=${scenario.id}`);
      const payload = (await res.json()) as { ok?: boolean; report?: SurfpoolRehearsalReport };
      if (!res.ok || !payload.ok || !payload.report) throw new Error("surfpool_rehearsal_failed");
      setSurfpoolReport(payload.report);
      setSurfpoolStatus("loaded");
    } catch {
      setSurfpoolStatus("error");
    }
  }

  async function loadPaymentReadiness() {
    setPaymentReadinessStatus("loading");
    try {
      const res = await fetch("/api/economic-demo/payment-readiness");
      const payload = (await res.json()) as { ok?: boolean; readiness?: EconomicDemoPaymentReadiness };
      if (!res.ok || !payload.ok || !payload.readiness) throw new Error("payment_readiness_failed");
      setPaymentReadiness(payload.readiness);
      setPaymentReadinessStatus("loaded");
    } catch {
      setPaymentReadinessStatus("error");
    }
  }

  async function loadWebpageLiveEvidence() {
    setWebpageLiveEvidenceStatus("loading");
    try {
      const res = await fetch("/api/economic-demo/webpage-live-workflow");
      const payload = (await res.json()) as { ok?: boolean; evidence?: WebpageLiveWorkflowEvidence };
      if (!res.ok || !payload.ok || !payload.evidence) throw new Error("webpage_live_evidence_failed");
      setWebpageLiveEvidence(payload.evidence);
      setWebpageLiveEvidenceStatus("loaded");
    } catch {
      setWebpageLiveEvidenceStatus("error");
    }
  }

  async function loadLedgerReconciliation() {
    setLedgerReconciliationStatus("loading");
    try {
      const res = await fetch("/api/economic-demo/ledger-reconciliation");
      const payload = (await res.json()) as { ok?: boolean; reconciliation?: EconomicDemoLedgerReconciliation };
      if (!res.ok || !payload.ok || !payload.reconciliation) throw new Error("ledger_reconciliation_failed");
      setLedgerReconciliation(payload.reconciliation);
      setLedgerReconciliationStatus("loaded");
    } catch {
      setLedgerReconciliationStatus("error");
    }
  }

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
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={loadDryRunPlan}
                  disabled={dryRunStatus === "loading"}
                  className="rounded-lg border border-[#14F195]/30 bg-[#14F195]/10 px-4 py-2 text-sm font-semibold text-[#14F195] transition hover:bg-[#14F195]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {dryRunStatus === "loading" ? "Building dry-run plan…" : "Build dry-run economic graph"}
                </button>
                <button
                  onClick={loadBalanceSnapshot}
                  disabled={balanceStatus === "loading"}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {balanceStatus === "loading" ? "Reading balances…" : "Read devnet balances"}
                </button>
                <button
                  onClick={loadSurfpoolRehearsal}
                  disabled={surfpoolStatus === "loading"}
                  className="rounded-lg border border-accent-purple/30 bg-accent-purple/10 px-4 py-2 text-sm font-semibold text-accent-purple transition hover:bg-accent-purple/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {surfpoolStatus === "loading" ? "Planning rehearsal…" : "Plan Surfpool rehearsal"}
                </button>
                <button
                  onClick={loadPaymentReadiness}
                  disabled={paymentReadinessStatus === "loading"}
                  className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-100 transition hover:bg-yellow-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {paymentReadinessStatus === "loading" ? "Checking payment readiness…" : "Show payment readiness"}
                </button>
                <button
                  onClick={loadWebpageLiveEvidence}
                  disabled={webpageLiveEvidenceStatus === "loading"}
                  className="rounded-lg border border-[#14F195]/30 bg-[#14F195]/10 px-4 py-2 text-sm font-semibold text-[#14F195] transition hover:bg-[#14F195]/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {webpageLiveEvidenceStatus === "loading" ? "Loading live evidence…" : "Show multi-edge evidence"}
                </button>
                <button
                  onClick={loadLedgerReconciliation}
                  disabled={ledgerReconciliationStatus === "loading"}
                  className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ledgerReconciliationStatus === "loading" ? "Reconciling ledger…" : "Reconcile ledger"}
                </button>
                <span className="text-xs text-gray-500">
                  Uses deployed 30-agent profile metadata · zero downstream calls
                </span>
              </div>
              {dryRunStatus === "error" && (
                <p className="mt-3 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                  Dry-run plan failed. Fixture view is still available.
                </p>
              )}
              {balanceStatus === "error" && (
                <p className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                  Balance snapshot failed. No transfer was attempted.
                </p>
              )}
              {surfpoolStatus === "error" && (
                <p className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                  Surfpool rehearsal plan failed. No local transfer was attempted.
                </p>
              )}
              {paymentReadinessStatus === "error" && (
                <p className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                  Payment readiness failed. No live retry was attempted from the UI.
                </p>
              )}
              {webpageLiveEvidenceStatus === "error" && (
                <p className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                  Multi-edge evidence failed to load. No live specialist endpoint was called from the UI.
                </p>
              )}
              {ledgerReconciliationStatus === "error" && (
                <p className="mt-3 rounded-lg border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-100">
                  Ledger reconciliation failed. No live call or transfer was attempted.
                </p>
              )}
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

            {scenario.id === "picture" && (
              <div className="rounded-2xl border border-accent-purple/25 bg-accent-purple/10 p-6 shadow-card">
                <p className="section-label">Image adapter path</p>
                <h3 className="mt-2 text-xl font-semibold text-white">OpenAI first · Fal.ai fallback</h3>
                <p className="mt-3 text-sm leading-6 text-gray-300">
                  The picture scenario is now modeled as a gated tool adapter: `tool-using-agent` can call OpenAI image generation when configured, or Fal.ai as fallback. The live route stays disabled until `ENABLE_ECONOMIC_DEMO_IMAGE_GENERATION=true`.
                </p>
                <p className="mt-3 font-mono text-xs text-gray-500">/api/economic-demo/image · GET readiness · POST generate</p>
              </div>
            )}
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

              {activeDryRunPlan && (
                <div className="mt-6 rounded-xl border border-[#14F195]/25 bg-[#14F195]/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#14F195]">Dry-run orchestration plan</p>
                      <p className="mt-1 font-mono text-sm text-white">{activeDryRunPlan.orchestrator.id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">downstream calls executed</p>
                      <p className="font-mono text-lg text-[#14F195]">{activeDryRunPlan.downstreamCallsExecuted}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {activeDryRunPlan.edges.map((edge) => (
                      <div key={`${edge.toProfileId}-${edge.capability}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-mono text-white">{edge.fromProfileId}</span>
                          <span className="text-gray-500">→</span>
                          <span className="font-mono text-white">{edge.toProfileId}</span>
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-gray-300">planned</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-300">{edge.payloadSummary}</p>
                        <p className="mt-2 break-all font-mono text-xs text-gray-500">{edge.endpoint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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




              {paymentReadiness && (
                <div className={paymentReadiness.status === "ready" ? "mt-6 rounded-xl border border-[#14F195]/30 bg-[#14F195]/10 p-4" : "mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4"}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={paymentReadiness.status === "ready" ? "text-xs uppercase tracking-wide text-[#14F195]" : "text-xs uppercase tracking-wide text-yellow-100"}>Live x402 payment readiness</p>
                      <p className="mt-1 break-all font-mono text-sm text-white">{paymentReadiness.endpoint}</p>
                    </div>
                    <span className={paymentReadiness.status === "ready" ? "rounded-full border border-[#14F195]/40 bg-[#14F195]/10 px-2 py-0.5 text-xs text-[#14F195]" : "rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-100"}>
                      {paymentReadiness.status}{paymentReadiness.blocker ? `: ${paymentReadiness.blocker}` : ""}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">challenge</p>
                      <p className="mt-1 text-sm text-[#14F195]">reachable · {paymentReadiness.liveChallenge.network}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">price</p>
                      <p className="mt-1 font-mono text-sm text-white">{paymentReadiness.liveChallenge.amount} {paymentReadiness.liveChallenge.currency}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">paid retry</p>
                      <p className={paymentReadiness.paidCompletion.reached ? "mt-1 font-mono text-sm text-[#14F195]" : "mt-1 font-mono text-sm text-yellow-100"}>HTTP {paymentReadiness.paidCompletion.lastAttemptStatus}</p>
                    </div>
                  </div>
                  <p className={paymentReadiness.status === "ready" ? "mt-4 text-sm leading-6 text-[#14F195]/90" : "mt-4 text-sm leading-6 text-yellow-50/90"}>
                    {paymentReadiness.status === "ready"
                      ? "Controlled demo-paid completion reached HTTP 200 against the deployed code-generation specialist. The UI still will not auto-retry live payment; the next demo loop can promote this from one paid edge to a multi-edge workflow."
                      : "Paid completion is blocked because the deployed specialist rejects demo receipts. The UI will not auto-retry live payment; choose controlled demo receipts or real devnet receipt verification next."}
                  </p>
                </div>
              )}

              {ledgerReconciliation && (
                <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-300">Ledger reconciliation</p>
                      <p className="mt-1 text-sm leading-6 text-gray-200">
                        Controlled receipt totals are reconciled against x402 challenge amounts and Surfpool/local transfer semantics.
                      </p>
                    </div>
                    <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-100">
                      no production settlement claim
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">x402 total</p>
                      <p className="mt-1 font-mono text-lg text-white">{ledgerReconciliation.totals.challengeAmountUsdc} USDC</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">demo completions</p>
                      <p className="mt-1 font-mono text-lg text-[#14F195]">{ledgerReconciliation.totals.controlledPaidCompletions}/4</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">real settlements</p>
                      <p className="mt-1 font-mono text-lg text-yellow-100">{ledgerReconciliation.totals.realSettlementsVerified}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">Surfpool local proof</p>
                      <p className="mt-1 font-mono text-lg text-white">{ledgerReconciliation.totals.surfpoolLocalTransferSol} SOL</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {ledgerReconciliation.edges.map((edge) => (
                      <div key={edge.profileId} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="font-mono text-sm text-white">{edge.profileId}</p>
                        <p className="mt-1 text-xs text-gray-400">{edge.challengeAmountUsdc} USDC challenge → {shortWallet(edge.payeeWallet)}</p>
                        <p className="mt-2 text-xs text-[#14F195]">controlled receipt: {edge.controlledReceiptStatus}</p>
                        <p className="mt-1 text-xs text-yellow-100">real settlement: {edge.realSettlementStatus}</p>
                        <p className="mt-1 text-xs text-gray-400">Surfpool local transfer: {formatLamports(edge.surfpoolLocalTransferLamports)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {ledgerReconciliation.proofLayers.map((layer) => (
                      <div key={layer.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-gray-400">{layer.id}: {layer.status}</p>
                        <p className="mt-1 text-sm leading-6 text-gray-300">{layer.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {webpageLiveEvidence && (
                <div className="mt-6 rounded-xl border border-[#14F195]/30 bg-[#14F195]/10 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#14F195]">Multi-edge live x402 evidence</p>
                      <p className="mt-1 text-sm leading-6 text-gray-200">{webpageLiveEvidence.userRequest}</p>
                    </div>
                    <span className="rounded-full border border-[#14F195]/40 bg-[#14F195]/10 px-2 py-0.5 text-xs text-[#14F195]">
                      {webpageLiveEvidence.conclusion}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">bounded calls</p>
                      <p className="mt-1 font-mono text-lg text-white">{webpageLiveEvidence.downstreamCallsExecuted}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">paid completions</p>
                      <p className="mt-1 font-mono text-lg text-[#14F195]">{webpageLiveEvidence.edges.length}/4</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">receipt mode</p>
                      <p className="mt-1 text-sm text-yellow-100">controlled demo receipts</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {webpageLiveEvidence.edges.map((edge) => (
                      <div key={edge.profileId} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-mono text-sm text-white">{edge.step}. {edge.profileId}</p>
                            <p className="mt-1 text-xs text-gray-400">{edge.capability} · {edge.unpaidChallenge.amount} {edge.unpaidChallenge.currency} → {shortWallet(edge.unpaidChallenge.payTo)}</p>
                          </div>
                          <p className="text-xs text-[#14F195]">402 challenge → 200 paid</p>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-gray-300">{edge.paidCompletion.outputPreview}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-yellow-50/90">
                    This panel reads a sanitized evidence summary only. Loading it does not call live specialist endpoints, sign receipts, or transfer devnet funds. Real devnet receipt verification remains a later phase.
                  </p>
                </div>
              )}

              {activeSurfpoolReport && (
                <div className="mt-6 rounded-xl border border-accent-purple/25 bg-accent-purple/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-accent-purple">Surfpool/local rehearsal plan</p>
                      <p className="mt-1 text-sm text-gray-200">
                        {activeSurfpoolReport.networkProfile} · {activeSurfpoolReport.transferSemantics} · downstream calls executed: {activeSurfpoolReport.downstreamCallsExecuted}
                      </p>
                    </div>
                    <span className={activeSurfpoolReport.positiveProof.balanced ? "rounded-full border border-[#14F195]/30 bg-[#14F195]/10 px-2 py-0.5 text-xs text-[#14F195]" : "rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 text-xs text-red-200"}>
                      balanced: {String(activeSurfpoolReport.positiveProof.balanced)}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">planned transfers</p>
                      <p className="mt-1 font-mono text-lg text-white">{activeSurfpoolReport.transfers.length}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">debited / credited</p>
                      <p className="mt-1 font-mono text-sm text-[#14F195]">{formatLamports(activeSurfpoolReport.positiveProof.totalDebitedLamports).replace(/^\+/, "")} / {formatLamports(activeSurfpoolReport.positiveProof.totalCreditedLamports).replace(/^\+/, "")}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-gray-500">blocked delta</p>
                      <p className="mt-1 font-mono text-lg text-white">{formatLamports(activeSurfpoolReport.negativeProof.totalBlockedDeltaLamports).replace(/^\+/, "")}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {activeSurfpoolReport.participants.map((participant) => {
                      const delta = participant.endingLamports - participant.startingLamports;
                      return (
                        <div key={participant.profileId} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 text-sm sm:grid-cols-[1fr_auto]">
                          <div>
                            <p className="font-mono text-white">{participant.profileId}</p>
                            <p className="mt-1 font-mono text-xs text-gray-500">local {shortWallet(participant.localWalletAddress)}</p>
                          </div>
                          <p className={`font-mono ${delta > 0 ? "text-[#14F195]" : delta < 0 ? "text-red-300" : "text-gray-300"}`}>{formatLamports(delta)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeBalanceReport && (
                <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Read-only balance snapshot</p>
                      <p className="mt-1 text-sm text-gray-300">No transfers attempted · downstream calls executed: {activeBalanceReport.downstreamCallsExecuted}</p>
                    </div>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-gray-300">{activeBalanceReport.mode}</span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {activeBalanceReport.snapshots.map((snapshot) => (
                      <div key={`${snapshot.profileId}-${snapshot.walletAddress}`} className="grid gap-2 rounded-lg border border-white/10 bg-white/5 p-3 text-sm sm:grid-cols-[1fr_auto]">
                        <div>
                          <p className="font-mono text-white">{snapshot.profileId}</p>
                          <p className="mt-1 font-mono text-xs text-gray-500">{shortWallet(snapshot.walletAddress)}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={snapshot.status === "available" ? "font-mono text-[#14F195]" : "font-mono text-yellow-200"}>
                            {snapshot.status === "available" && snapshot.lamports !== null ? formatLamports(snapshot.lamports).replace(/^\+/, "") : "balance unavailable"}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">{snapshot.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
