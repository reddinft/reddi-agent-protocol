"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

type AuditAttestation = {
  timestamp: string;
  job_id: string;
  tx_signature: string | null;
  local_only: boolean;
  wallet_address: string;
  endpoint_url: string;
};

type RevealCommit = {
  runId?: string;
  revealedAt?: string;
  revealTxSignature?: string;
  specialistWallet?: string;
};

export default function AttestationDashboardPage() {
  const { connected } = useWallet();
  const [attestations, setAttestations] = useState<AuditAttestation[]>([]);
  const [commits, setCommits] = useState<RevealCommit[]>([]);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      try {
        const [auditRes, revealRes] = await Promise.all([
          fetch("/api/onboarding/audit", { cache: "no-store" }),
          fetch("/api/onboarding/planner/reveal", { cache: "no-store" }),
        ]);
        const [audit, reveal] = await Promise.all([auditRes.json(), revealRes.json()]);
        setAttestations(Array.isArray(audit?.attestations) ? audit.attestations : []);
        setCommits(Array.isArray(reveal?.result?.entries) ? reveal.result.entries : Array.isArray(reveal?.result) ? reveal.result : []);
      } catch {
        setAttestations([]);
        setCommits([]);
      }
    })();
  }, [connected]);

  const onchainCount = useMemo(() => attestations.filter((a) => Boolean(a.tx_signature)).length, [attestations]);

  if (!connected) {
    return <PageNotice title="Attestation Dashboard" text="Connect wallet to review attestation-owner protocol statistics." />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Attestation Owner Dashboard</h1>
        <p className="text-sm text-muted-foreground">Track judging and attestation protocol events.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Attestation records" value={attestations.length} />
        <Stat label="On-chain attestations" value={onchainCount} />
        <Stat label="Reveal commits" value={commits.length} />
      </div>

      <section className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-3">
        <h2 className="text-lg font-semibold">Recent attestation records</h2>
        {attestations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attestation records found yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-white/10">
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Wallet</th>
                  <th className="py-2 pr-4">On-chain</th>
                  <th className="py-2">Job</th>
                </tr>
              </thead>
              <tbody>
                {attestations.slice(0, 12).map((a) => (
                  <tr key={`${a.job_id}-${a.timestamp}`} className="border-b border-white/5">
                    <td className="py-2 pr-4 text-xs">{a.timestamp ? new Date(a.timestamp).toLocaleString() : "—"}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{short(a.wallet_address)}</td>
                    <td className="py-2 pr-4">{a.tx_signature ? "yes" : "local"}</td>
                    <td className="py-2 font-mono text-xs">{short(a.job_id)}</td>
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
