import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SpecialistCardProps {
  wallet: string
  name?: string
  model?: string
  taskTypes?: string[]
  reputationScore?: number
  attested?: boolean
  health?: "online" | "offline" | "unknown"
  ratePerCall?: number
  progress?: number
}

function shortWallet(wallet: string) {
  return wallet.length > 12 ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : wallet
}

function avatarGradient(seed: string) {
  const palette = [
    "from-indigo-500/80 to-sky-500/30",
    "from-fuchsia-500/80 to-pink-500/30",
    "from-emerald-500/80 to-teal-500/30",
    "from-amber-500/80 to-orange-500/30",
  ]
  const index = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length
  return palette[index]
}

function formatSol(lamports?: number) {
  if (!lamports) return "free"
  return `◎ ${(lamports / 1_000_000_000).toFixed(4)} SOL/call`
}

export function SpecialistCard({
  wallet,
  name,
  model,
  taskTypes = [],
  reputationScore = 0,
  attested = false,
  health = "unknown",
  ratePerCall = 0,
  progress = 0,
}: SpecialistCardProps) {
  const healthTone =
    health === "online"
      ? "bg-emerald-500 text-emerald-50"
      : health === "offline"
      ? "bg-slate-500 text-slate-100"
      : "bg-slate-600 text-slate-100"

  return (
    <Link href={`/agents/${wallet}`} className="block h-full" data-testid="agent-card">
      <Card hover className="h-full overflow-hidden">
        <div className={cn("relative h-36 bg-gradient-to-br", avatarGradient(wallet))}>
          <div className="absolute inset-0 bg-page/55" />
          <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/90">
            {health === "online" ? "● Online" : health === "offline" ? "○ Offline" : "◌ Unknown"}
          </div>
          <div className={cn("absolute right-4 top-4 h-3 w-3 rounded-full ring-4 ring-black/20", healthTone)} />
          <div className="absolute bottom-4 left-4 right-4">
            {taskTypes[0] ? (
              <Badge variant="outline" className="border-white/15 bg-black/30 text-white">
                {taskTypes[0]}
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              {name ?? shortWallet(wallet)}
            </h3>
            <p className="text-sm text-gray-400">{model ?? "Specialist endpoint"}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {taskTypes.slice(0, 3).map((task) => (
              <Badge key={task} variant="outline" className="border-white/10 bg-white/5 text-[11px] text-gray-300">
                {task}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 text-xs text-gray-300">
            <span>⭐ {Math.round(reputationScore / 100)}</span>
            <span>{formatSol(ratePerCall)}</span>
            {attested ? (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300">
                Attested
              </Badge>
            ) : (
              <Badge variant="outline" className="border-white/10 bg-white/5 text-[11px] text-gray-400">
                Unverified
              </Badge>
            )}
          </div>

          {progress > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span>Activity</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  )
}
