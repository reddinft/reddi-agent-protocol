"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TASK_TYPES } from "@/lib/capabilities/taxonomy";
import type { SpecialistListing } from "@/lib/registry/bridge";

function shortWallet(w: string) {
  return !w || w.length < 12 ? w : `${w.slice(0, 8)}…${w.slice(-6)}`;
}

function HealthBadge({ status }: { status: string }) {
  if (status === "pass") return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-green-400 border-green-500/30 bg-green-500/10">● Online</span>
  );
  if (status === "fail") return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-red-400 border-red-500/30 bg-red-500/10">○ Offline</span>
  );
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-muted-foreground border-white/10 bg-white/5">○ Unknown</span>
  );
}

export default function SpecialistDashboard() {
  const [wallet, setWallet] = useState("");
  const [listing, setListing] = useState<SpecialistListing | null>(null);
  const [walletInput, setWalletInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load from localStorage if wizard stored wallet
  useEffect(() => {
    try {
      const raw = localStorage.getItem("reddi-onboarding-wizard-v1");
      if (raw) {
        const state = JSON.parse(raw);
        if (state.walletAddress) {
          setWallet(state.walletAddress);
          setWalletInput(state.walletAddress);
        }
      }
    } catch { /* no stored state */ }
  }, []);

  const loadListing = useCallback(async (w: string) => {
    if (!w.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/registry");
      const data = await res.json();
      const found = (data.listings as SpecialistListing[]).find((l) => l.walletAddress === w.trim());
      if (found) {
        setListing(found);
        setWallet(w.trim());
      } else {
        setError("Wallet not found in registry. Complete onboarding first.");
        setListing(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wallet) loadListing(wallet);
  }, [wallet, loadListing]);

  const cap = listing?.capabilities;
  const onchain = listing?.onchain;
  const signals = listing?.signals;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Specialist Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor your agent&apos;s status, reputation, and earnings.</p>
      </div>

      {/* Wallet lookup */}
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Your wallet address (base58)…"
          className="flex-1"
          value={walletInput}
          onChange={(e) => setWalletInput(e.target.value)}
        />
        <Button onClick={() => loadListing(walletInput)} disabled={loading || !walletInput.trim()}>
          {loading ? "Loading…" : "Load"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-950/20 text-red-300 text-xs px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <Link href="/onboarding">
            <Button size="sm" style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000" }}>
              Start onboarding →
            </Button>
          </Link>
        </div>
      )}

      {listing && (
        <>
          {/* Status bar */}
          <div className="rounded-xl border border-white/10 bg-card/30 p-5 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="font-mono text-sm text-muted-foreground">{shortWallet(listing.walletAddress)}</h2>
              <HealthBadge status={listing.health.status} />
              {listing.attestation.attested && (
                <span className="text-xs px-2 py-0.5 rounded-full border border-[#14F195]/30 bg-[#14F195]/10 text-[#14F195]">✓ Attested</span>
              )}
              {listing.pda && (
                <a
                  href={`https://explorer.solana.com/address/${listing.pda}?cluster=devnet`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-[#9945FF] hover:underline"
                >
                  View on-chain ↗
                </a>
              )}
            </div>
            {listing.health.endpointUrl && (
              <p className="text-xs text-muted-foreground/70 font-mono">
                Endpoint: {listing.health.endpointUrl}
              </p>
            )}
            {listing.health.lastCheckedAt && (
              <p className="text-xs text-muted-foreground/50">
                Last checked: {new Date(listing.health.lastCheckedAt).toLocaleString()}
              </p>
            )}

            {/* Quick-fix actions */}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => loadListing(listing.walletAddress)} disabled={loading}>
                ↻ Refresh status
              </Button>
              <Link href="/onboarding">
                <Button size="sm" variant="outline">Edit / re-onboard</Button>
              </Link>
              <Link href={`/agents/${listing.walletAddress}`}>
                <Button size="sm" variant="outline">View public profile ↗</Button>
              </Link>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Reputation score", value: onchain?.reputationScore ?? "–" },
              { label: "Jobs completed", value: Number(onchain?.jobsCompleted ?? 0) || "–" },
              { label: "Avg feedback", value: signals?.feedbackCount ? signals.avgFeedbackScore.toFixed(1) : "–" },
              { label: "Attestation accuracy", value: onchain?.attestationAccuracy ? `${onchain.attestationAccuracy}%` : "–" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-white/10 bg-card/30 p-4 text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Reputation signals */}
          {signals && signals.feedbackCount > 0 && (
            <div className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-2">
              <h2 className="text-sm font-semibold">Routing signals</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                <div><span className="text-white font-medium">{signals.feedbackCount}</span> feedback responses</div>
                <div><span className="text-white font-medium">★ {signals.avgFeedbackScore.toFixed(1)}</span> avg score</div>
                <div><span className="text-[#14F195] font-medium">{signals.attestationAgreements}</span> attestation agreements</div>
                <div><span className="text-red-400 font-medium">{signals.attestationDisagreements}</span> disagreements</div>
              </div>
            </div>
          )}

          {/* Capability profile */}
          {cap ? (
            <div className="rounded-xl border border-white/10 bg-card/20 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Capability profile</h2>
                <Link href="/onboarding">
                  <Button size="sm" variant="outline" className="text-xs">Edit capabilities</Button>
                </Link>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Task types</p>
                  <div className="flex flex-wrap gap-1">
                    {cap.taskTypes.map((t) => {
                      const meta = TASK_TYPES.find((x) => x.id === t);
                      return (
                        <Badge key={t} variant="outline" className="border-[#9945FF]/30 text-[#9945FF] bg-[#9945FF]/5" title={meta?.description}>
                          {meta?.label ?? t}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div><span className="text-white font-medium">Input modes:</span> {cap.inputModes.join(", ")}</div>
                  <div><span className="text-white font-medium">Output modes:</span> {cap.outputModes.join(", ")}</div>
                  <div><span className="text-white font-medium">Privacy:</span> {cap.privacyModes.join(", ")}</div>
                  <div><span className="text-white font-medium">Base price:</span> {cap.baseUsd ? `$${cap.baseUsd}/call` : "free"}</div>
                </div>
                {cap.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {cap.tags.map((t) => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded border border-white/10 text-muted-foreground/60">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-950/20 text-yellow-300 p-5 text-sm space-y-2">
              <p className="font-semibold">⚠ Capability profile missing</p>
              <p className="text-xs">Your agent won&apos;t appear in filtered searches until you register capabilities.</p>
              <Link href="/onboarding"><Button size="sm" variant="outline">Complete capability setup →</Button></Link>
            </div>
          )}
        </>
      )}

      {!listing && !error && !loading && (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">Enter your wallet address above to view your specialist dashboard.</p>
          <p className="text-sm text-muted-foreground/60">Not registered yet?</p>
          <Link href="/onboarding">
            <Button style={{ background: "linear-gradient(135deg,#9945FF,#14F195)", color: "#000", fontWeight: 600 }}>
              Start onboarding →
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
