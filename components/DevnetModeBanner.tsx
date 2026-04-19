"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export default function DevnetModeBanner() {
  const { connected } = useWallet();

  if (!connected) return null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
      <div className="mx-auto max-w-7xl">
        <span className="font-semibold">Devnet mode:</span> all wallet operations, registrations, escrow actions, and attestations are currently restricted to Solana devnet until audited production programs are approved.
      </div>
    </div>
  );
}
