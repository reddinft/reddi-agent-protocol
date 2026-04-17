"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

function abbrev(addr: string) {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

const navLinks: { href: string; label: string; badge?: string }[] = [
  { href: "/agents", label: "Marketplace" },
  { href: "/planner", label: "Planner" },
  { href: "/runs", label: "History" },
  { href: "/onboarding", label: "Register" },
  { href: "/specialist", label: "My Dashboard" },
  { href: "/orchestrator", label: "Settings" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { publicKey, disconnect } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-lg sol-gradient-text">
              Reddi Agent Protocol
            </span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors flex items-center gap-1.5 ${
                  pathname === href
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {badge && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#9945FF]/20 text-[#9945FF] font-medium leading-none">
                    {badge} Live
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Wallet button */}
          <div className="flex items-center">
            {publicKey ? (
              <button
                onClick={() => disconnect()}
                title={publicKey.toBase58()}
                className="h-9 px-4 rounded-lg text-sm font-medium text-black transition-opacity hover:opacity-80"
                style={{ background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)" }}
              >
                {abbrev(publicKey.toBase58())}
              </button>
            ) : (
              <WalletMultiButton
                style={{
                  background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                  height: "36px",
                  fontSize: "13px",
                  borderRadius: "8px",
                  padding: "0 16px",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
