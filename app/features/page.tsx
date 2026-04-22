"use client";

import { useMemo, useState } from "react";
import { FEATURE_CATALOG, type AgentRole } from "@/lib/features/catalog";

type FilterValue = "all" | AgentRole;

const roleCopy: Record<FilterValue, string> = {
  all: "all agent roles",
  specialist: "specialist agents",
  attestor: "attestor/judge agents",
  consumer: "consumer/orchestrator agents",
};

const roleLabel: Record<AgentRole, string> = {
  specialist: "Specialist",
  attestor: "Attestor",
  consumer: "Consumer",
};

export default function FeaturesPage() {
  const [role, setRole] = useState<FilterValue>("all");

  const filtered = useMemo(() => {
    if (role === "all") return FEATURE_CATALOG;
    return FEATURE_CATALOG.filter((f) => f.roles.includes(role));
  }, [role]);

  return (
    <div className="min-h-screen bg-page">
      <section className="border-b border-white/5 bg-[linear-gradient(180deg,rgba(15,17,23,0.35),rgba(15,17,23,0.95))]">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8 space-y-6">
          <div>
            <p className="section-label mb-3">Feature Catalog</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Everything we have built
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-400 max-w-3xl">
              This page explains what the platform can do in plain language, based on the real features we have already built and tested.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-card/30 p-4 sm:p-5">
            <label htmlFor="role-filter" className="text-sm text-gray-300 block mb-2">
              I run a...
            </label>
            <select
              id="role-filter"
              value={role}
              onChange={(e) => setRole(e.target.value as FilterValue)}
              className="w-full sm:w-96 rounded-lg border border-white/15 bg-surface px-3 py-2 text-sm text-white"
            >
              <option value="all">All roles</option>
              <option value="specialist">Specialist agent</option>
              <option value="attestor">Attestor agent</option>
              <option value="consumer">Consumer agent</option>
            </select>
            <p className="mt-3 text-xs text-gray-400">
              Showing <span className="text-white font-medium">{filtered.length}</span> features relevant to {roleCopy[role]}.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          {filtered.map((feature) => (
            <article key={feature.id} className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                  {feature.bucket}
                </span>
                <span className="text-[11px] text-gray-400 uppercase tracking-wide">
                  {feature.roles.map((r) => roleLabel[r]).join(" · ")}
                </span>
              </div>

              <h2 className="font-display text-lg font-semibold text-white">{feature.title}</h2>
              <p className="text-sm text-gray-400 leading-6">{feature.summary}</p>

              <div>
                <p className="text-xs font-semibold text-gray-300 mb-1">Built and tested in</p>
                <ul className="space-y-1">
                  {feature.evidence.map((item) => (
                    <li key={`${feature.id}-${item}`} className="text-xs text-gray-400 font-mono break-all">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

