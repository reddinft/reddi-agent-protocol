import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            Built on{" "}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9945FF] hover:text-[#14F195] transition-colors"
            >
              Solana
            </a>
            {" · "}
            Powered by{" "}
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#9945FF] hover:text-[#14F195] transition-colors"
            >
              Ollama
            </a>
            {" · "}
            Governed by math.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/setup" className="hover:text-foreground transition-colors">
              Setup Guide
            </Link>
            <Link href="/agents" className="hover:text-foreground transition-colors">
              Browse Agents
            </Link>
            <a
              href="#"
              className="hover:text-foreground transition-colors"
            >
              GitHub →
            </a>
          </div>
        </div>
        <p className="text-xs text-muted-foreground/50 text-center mt-4">
          Reddi Agent Protocol · Hackathon Demo · March 2026 ·{" "}
          <a href="https://reddi.tech" className="hover:text-muted-foreground transition-colors">
            reddi.tech
          </a>
        </p>
      </div>
    </footer>
  );
}
